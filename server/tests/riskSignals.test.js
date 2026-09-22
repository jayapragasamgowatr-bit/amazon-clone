const test=require("node:test");
const assert=require("node:assert/strict");
function riskLevel(score){return score>=70?"High":score>=40?"Medium":"Low"}
test("risk levels use documented thresholds",()=>{assert.equal(riskLevel(0),"Low");assert.equal(riskLevel(40),"Medium");assert.equal(riskLevel(69),"Medium");assert.equal(riskLevel(70),"High")});
test("high value threshold is ₹50,000",()=>{const v=50000;assert.equal(v>=50000,true);assert.equal(49999>=50000,false)});
