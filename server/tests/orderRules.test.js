const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canTransitionStatus,
  shouldRestoreStockOnCancellation,
  isValidStatus,
} = require("../utils/orderRules");

test("accepts all supported statuses", () => {
  for (const status of ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"]) {
    assert.equal(isValidStatus(status), true);
  }
});

test("allows normal forward transitions", () => {
  assert.equal(canTransitionStatus("Pending", "Confirmed"), true);
  assert.equal(canTransitionStatus("Confirmed", "Processing"), true);
  assert.equal(canTransitionStatus("Processing", "Shipped"), true);
  assert.equal(canTransitionStatus("Shipped", "Delivered"), true);
});

test("allows Delivered to Cancelled", () => {
  assert.equal(canTransitionStatus("Delivered", "Cancelled"), true);
  assert.equal(shouldRestoreStockOnCancellation("Delivered"), false);
});

test("blocks reopening cancelled orders and backwards transitions", () => {
  assert.equal(canTransitionStatus("Cancelled", "Delivered"), false);
  assert.equal(canTransitionStatus("Delivered", "Processing"), false);
  assert.equal(canTransitionStatus("Processing", "Confirmed"), false);
});
