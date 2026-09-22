const test = require("node:test");
const assert = require("node:assert/strict");

const EVENT_NAMES = [
  "page_view",
  "product_view",
  "search",
  "wishlist_add",
  "wishlist_remove",
  "cart_add",
  "cart_remove",
  "checkout_started",
  "checkout_completed",
  "order_created",
];

test("event contract contains the core customer journey", () => {
  for (const name of ["page_view", "product_view", "search", "cart_add", "checkout_started", "order_created"]) {
    assert.ok(EVENT_NAMES.includes(name));
  }
});

test("event contract excludes sensitive credential events", () => {
  assert.equal(EVENT_NAMES.includes("password_entered"), false);
  assert.equal(EVENT_NAMES.includes("payment_card_entered"), false);
});
