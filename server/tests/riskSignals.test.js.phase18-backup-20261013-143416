const test = require("node:test");
const assert = require("node:assert/strict");
const {
  riskLevel,
  keyFor,
  normalizePhone,
  maskCustomerKey,
  phoneRegexFor,
  scoreRiskGroup,
  scoreCustomerOrders,
} = require("../controllers/riskController");

test("risk levels use documented thresholds", () => {
  assert.equal(riskLevel(0), "Low");
  assert.equal(riskLevel(39), "Low");
  assert.equal(riskLevel(40), "Medium");
  assert.equal(riskLevel(69), "Medium");
  assert.equal(riskLevel(70), "High");
});

test("high value threshold is ₹50,000", () => {
  assert.equal(scoreRiskGroup([{ totalPrice: 50000, status: "Processing" }]).score, 20);
  assert.equal(scoreRiskGroup([{ totalPrice: 49999, status: "Processing" }]).score, 0);
});

test("customer grouping prefers normalized email and otherwise normalized phone", () => {
  assert.equal(keyFor({ customer: { email: " Buyer@Example.com " }, user: "u1" }), "buyer@example.com");
  assert.equal(keyFor({ customer: { phone: "+91 98765-43210" } }), "919876543210");
});

test("phone normalization removes punctuation", () => {
  assert.equal(normalizePhone("+91 (98765)-43210"), "919876543210");
});

test("risk table customer identifiers are masked", () => {
  assert.equal(maskCustomerKey("mansoor@example.com"), "m***@example.com");
  assert.equal(maskCustomerKey("919876543210"), "•••• 3210");
  assert.notEqual(maskCustomerKey("mansoor@example.com"), "mansoor@example.com");
});

test("phone lookup regex matches common punctuation and optional India prefix", () => {
  const regex = phoneRegexFor("9876543210");
  assert.ok(regex.test("+91 98765-43210"));
  assert.ok(regex.test("098765 43210"));
  assert.equal(phoneRegexFor("123"), null);
});

test("five orders trigger frequency signal", () => {
  const orders = Array.from({ length: 5 }, (_, i) => ({
    status: "Processing",
    totalPrice: 100,
    createdAt: new Date(Date.UTC(2026, 0, 1 + i)),
  }));
  const result = scoreRiskGroup(orders, 30);
  assert.equal(result.score, 20);
  assert.ok(result.reasons.some((reason) => reason.includes("5 orders")));
});

test("three cancellations trigger cancellation signal", () => {
  const orders = Array.from({ length: 3 }, (_, i) => ({
    status: "Cancelled",
    totalPrice: 100,
    createdAt: new Date(Date.UTC(2026, 0, 1 + i)),
  }));
  const result = scoreRiskGroup(orders);
  assert.equal(result.cancelledCount, 3);
  assert.equal(result.score, 20);
});

test("two rapid intervals trigger rapid-order signal", () => {
  const start = Date.UTC(2026, 0, 1, 10, 0, 0);
  const orders = [0, 20, 40].map((minutes) => ({
    status: "Processing",
    totalPrice: 100,
    createdAt: new Date(start + minutes * 60000),
  }));
  const result = scoreRiskGroup(orders);
  assert.equal(result.rapidPairs, 2);
  assert.equal(result.score, 15);
});

test("customer lookup score combines frequency, cancellations and high value", () => {
  const orders = [
    { status: "Cancelled", totalPrice: 100 },
    { status: "Cancelled", totalPrice: 100 },
    { status: "Cancelled", totalPrice: 100 },
    { status: "Processing", totalPrice: 50000 },
    { status: "Processing", totalPrice: 200 },
  ];
  const result = scoreCustomerOrders(orders);
  assert.equal(result.score, 75);
  assert.equal(riskLevel(result.score), "High");
  assert.equal(result.reasons.length, 4);
});
