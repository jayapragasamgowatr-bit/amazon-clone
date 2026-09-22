const test = require("node:test");
const assert = require("node:assert/strict");
const { buildForecast } = require("../controllers/forecastController");

test("forecast calculates demand and reorder quantity", () => {
  const result = buildForecast({ currentStock: 50, recent14: 140, recent30: 240, recent90: 540, horizonDays: 30, leadTimeDays: 7 });
  assert.ok(result.dailyDemand > 0);
  assert.ok(result.forecastUnits > 0);
  assert.ok(result.reorderQuantity >= 0);
  assert.ok(["Healthy", "Medium", "High", "Critical", "Out of Stock"].includes(result.risk));
});

test("zero sales do not create a reorder recommendation", () => {
  const result = buildForecast({ currentStock: 100, recent14: 0, recent30: 0, recent90: 0, horizonDays: 30, leadTimeDays: 7 });
  assert.equal(result.dailyDemand, 0);
  assert.equal(result.forecastUnits, 0);
  assert.equal(result.reorderQuantity, 0);
  assert.equal(result.daysOfCover, null);
});

test("out of stock is flagged even with no historical demand", () => {
  const result = buildForecast({ currentStock: 0, recent14: 0, recent30: 0, recent90: 0, horizonDays: 30, leadTimeDays: 7 });
  assert.equal(result.risk, "Out of Stock");
});
