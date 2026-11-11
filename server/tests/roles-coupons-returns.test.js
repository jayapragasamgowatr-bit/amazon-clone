const test = require("node:test");
const assert = require("node:assert/strict");

const { hasPermission, permissionsFor, isStaffRole, isValidRole, ROLES } = require("../utils/permissions");
const { evaluateCoupon, validateCouponInput, normalizeCode } = require("../utils/couponRules");
const { canCustomerCancel, canRequestReturn, canDecideReturn, returnDeadline } = require("../utils/returnRules");
const { summariseBody } = require("../middlewares/auditMiddleware");

test("customers have no admin permissions and admins have all of them", () => {
  assert.deepEqual(permissionsFor("user"), []);
  assert.equal(isStaffRole("user"), false);
  assert.equal(hasPermission("admin", "staff.manage"), true);
  assert.equal(permissionsFor("nonsense").length, 0);
  assert.equal(isValidRole("superuser"), false);
  assert.deepEqual(ROLES, ["user", "support", "inventory", "manager", "admin"]);
});

test("staff roles are limited to their own area", () => {
  assert.equal(hasPermission("support", "orders.manage"), true);
  assert.equal(hasPermission("support", "products.manage"), false);
  assert.equal(hasPermission("support", "coupons.manage"), false);
  assert.equal(hasPermission("inventory", "inventory.manage"), true);
  assert.equal(hasPermission("inventory", "orders.manage"), false);
  assert.equal(hasPermission("inventory", "customers.view"), false);
  assert.equal(hasPermission("manager", "analytics.view"), true);
  assert.equal(hasPermission("manager", "staff.manage"), false);
});

test("percentage coupons respect the cap and minimum order", () => {
  const coupon = { type: "percent", value: 10, maxDiscount: 500, minOrder: 1000, isActive: true };
  assert.deepEqual(evaluateCoupon(coupon, { subtotal: 2000 }), { ok: true, discount: 200 });
  assert.deepEqual(evaluateCoupon(coupon, { subtotal: 20000 }), { ok: true, discount: 500 });
  assert.equal(evaluateCoupon(coupon, { subtotal: 999 }).ok, false);
});

test("fixed coupons never exceed the order value", () => {
  const coupon = { type: "fixed", value: 750, isActive: true };
  assert.equal(evaluateCoupon(coupon, { subtotal: 500 }).discount, 500);
  assert.equal(evaluateCoupon(coupon, { subtotal: 5000 }).discount, 750);
});

test("expired, inactive, not-started and used-up coupons are refused", () => {
  const now = new Date("2026-11-11T00:00:00Z");
  const base = { type: "fixed", value: 100, isActive: true };
  assert.equal(evaluateCoupon(null, { subtotal: 1000 }).ok, false);
  assert.equal(evaluateCoupon({ ...base, isActive: false }, { subtotal: 1000 }).ok, false);
  assert.equal(evaluateCoupon({ ...base, expiresAt: "2026-11-10T00:00:00Z" }, { subtotal: 1000, now }).ok, false);
  assert.equal(evaluateCoupon({ ...base, startsAt: "2026-12-01T00:00:00Z" }, { subtotal: 1000, now }).ok, false);
  assert.equal(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, { subtotal: 1000 }).ok, false);
  assert.equal(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 4 }, { subtotal: 1000 }).ok, true);
  assert.equal(evaluateCoupon({ ...base, perUserLimit: 1 }, { subtotal: 1000, userUses: 1 }).ok, false);
  assert.equal(evaluateCoupon(base, { subtotal: 0 }).ok, false);
  assert.equal(evaluateCoupon(base, { subtotal: "abc" }).ok, false);
});

test("coupon admin input is validated and normalised", () => {
  const good = validateCouponInput({ code: " welcome-10 ", type: "percent", value: "10", minOrder: "500" });
  assert.equal(good.ok, true);
  assert.equal(good.value.code, "WELCOME-10");
  assert.equal(good.value.minOrder, 500);
  assert.equal(validateCouponInput({ code: "X", type: "percent", value: 10 }).ok, false);
  assert.equal(validateCouponInput({ code: "BIG", type: "percent", value: 150 }).ok, false);
  assert.equal(validateCouponInput({ code: "NEG", type: "fixed", value: -5 }).ok, false);
  assert.equal(validateCouponInput({ code: "DATES", type: "fixed", value: 5, startsAt: "2026-12-02", expiresAt: "2026-12-01" }).ok, false);
  assert.equal(validateCouponInput({ code: "LIM", type: "fixed", value: 5, usageLimit: 1.5 }).ok, false);
  assert.equal(normalizeCode("sa ve$10{}"), "SAVE10");
});

test("customers can cancel only before the order is processed", () => {
  assert.equal(canCustomerCancel({ status: "Pending" }), true);
  assert.equal(canCustomerCancel({ status: "Confirmed" }), true);
  assert.equal(canCustomerCancel({ status: "Processing" }), false);
  assert.equal(canCustomerCancel({ status: "Shipped" }), false);
  assert.equal(canCustomerCancel({ status: "Cancelled" }), false);
});

test("returns are allowed only for delivered orders inside the window", () => {
  const deliveredAt = new Date("2026-11-01T10:00:00Z");
  const order = { status: "Delivered", deliveredAt, returnRequest: { status: "None" } };
  assert.equal(canRequestReturn(order, { now: new Date("2026-11-05T10:00:00Z"), windowDays: 7 }).ok, true);
  assert.equal(canRequestReturn(order, { now: new Date("2026-11-09T10:00:00Z"), windowDays: 7 }).ok, false);
  assert.equal(canRequestReturn({ ...order, status: "Shipped" }, { windowDays: 7 }).ok, false);
  assert.equal(canRequestReturn({ ...order, returnRequest: { status: "Requested" } }, { now: deliveredAt, windowDays: 7 }).ok, false);
  assert.equal(canRequestReturn({ status: "Delivered" }, { windowDays: 7 }).ok, false);
  assert.equal(returnDeadline(order, 7).toISOString(), "2026-11-08T10:00:00.000Z");
});

test("return decisions follow Requested -> Approved/Rejected -> Refunded", () => {
  assert.equal(canDecideReturn("Requested", "Approved"), true);
  assert.equal(canDecideReturn("Requested", "Rejected"), true);
  assert.equal(canDecideReturn("Requested", "Refunded"), false);
  assert.equal(canDecideReturn("Approved", "Refunded"), true);
  assert.equal(canDecideReturn("Rejected", "Approved"), false);
  assert.equal(canDecideReturn("None", "Approved"), false);
});

test("activity log never stores passwords or uploaded images", () => {
  const summary = summariseBody({ name: "Meter", password: "secret", image: "data:...", resetToken: "x", price: 10, nested: { a: 1 } });
  assert.deepEqual(summary, { name: "Meter", price: 10 });
});
