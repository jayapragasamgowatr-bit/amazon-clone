const test = require("node:test");
const assert = require("node:assert/strict");

const NEXT = {
  Pending: ["Pending", "Confirmed", "Cancelled"],
  Confirmed: ["Confirmed", "Processing", "Cancelled"],
  Processing: ["Processing", "Shipped", "Cancelled"],
  Shipped: ["Shipped", "Delivered", "Cancelled"],
  Delivered: ["Delivered", "Cancelled"],
  Cancelled: ["Cancelled"],
};

function valid(from, to) {
  return Boolean(NEXT[from]?.includes(to));
}

test("normal order progression", () => {
  assert.equal(valid("Pending", "Confirmed"), true);
  assert.equal(valid("Confirmed", "Processing"), true);
  assert.equal(valid("Processing", "Shipped"), true);
  assert.equal(valid("Shipped", "Delivered"), true);
});

test("Delivered can be cancelled", () => {
  assert.equal(valid("Delivered", "Cancelled"), true);
});

test("Cancelled cannot be reopened", () => {
  for (const status of ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"]) {
    assert.equal(valid("Cancelled", status), false);
  }
});

test("invalid backward transitions are blocked", () => {
  assert.equal(valid("Delivered", "Processing"), false);
  assert.equal(valid("Shipped", "Confirmed"), false);
  assert.equal(valid("Processing", "Pending"), false);
});
