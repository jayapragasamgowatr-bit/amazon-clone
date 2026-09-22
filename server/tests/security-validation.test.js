const test = require("node:test");
const assert = require("node:assert/strict");
const {
  EMAIL_RE,
  validateSpecifications,
  validateStringArray,
  validateRegistration,
  validateReview,
} = require("../utils/validation");
const { canTransitionStatus } = require("../utils/orderRules");

test("accepts valid email format", () => {
  assert.equal(EMAIL_RE.test("customer@example.com"), true);
});

test("rejects malformed email format", () => {
  assert.equal(EMAIL_RE.test("customer@example"), false);
});

test("limits product specifications", () => {
  const specs = Object.fromEntries(Array.from({ length: 51 }, (_, i) => [`k${i}`, "v"]));
  assert.equal(validateSpecifications(specs).valid, false);
});

test("normalizes product string arrays", () => {
  const result = validateStringArray([" A ", "", "B"], "Features");
  assert.deepEqual(result.value, ["A", "B"]);
});

test("prevents cancelled orders from reopening", () => {
  assert.equal(canTransitionStatus("Cancelled", "Pending"), false);
});

test("allows delivered orders to be cancelled", () => {
  assert.equal(canTransitionStatus("Delivered", "Cancelled"), true);
});

test("registration validation rejects weak passwords", () => {
  assert.equal(
    validateRegistration({ name: "Test User", email: "test@example.com", password: "password" }).valid,
    false
  );
});

test("registration validation accepts a strong password", () => {
  assert.equal(
    validateRegistration({ name: "Test User", email: "test@example.com", password: "Password123" }).valid,
    true
  );
});

test("review validation rejects non-integer ratings", () => {
  assert.equal(validateReview({ rating: 4.5, comment: "Good" }).valid, false);
});

test("review validation accepts a valid review", () => {
  assert.equal(validateReview({ rating: 5, comment: "Excellent product" }).valid, true);
});
