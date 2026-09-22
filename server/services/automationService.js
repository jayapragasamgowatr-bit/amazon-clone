const crypto = require("crypto");
const Product = require("../models/Product");
const Order = require("../models/Order");
const AutomationAlert = require("../models/AutomationAlert");
const { getRiskAnalysis } = require("../controllers/riskController");

const sha = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");
const dayStart = (d) => { const x = new Date(d); x.setUTCHours(0,0,0,0); return x; };

async function createAlert(input) {
  const existing = await AutomationAlert.findOne({ fingerprint: input.fingerprint, status: "open" });
  if (existing) return { created: false, alert: existing };
  const alert = await AutomationAlert.create(input);
  return { created: true, alert };
}

async function runAutomationScan() {
  const now = new Date();
  const alerts = [];
  const threshold = Math.max(Number(process.env.AI_LOW_STOCK_THRESHOLD) || 5, 1);

  const products = await Product.find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] })
    .select("name countInStock price category isActive")
    .lean();
  for (const p of products) {
    const stock = Number(p.countInStock || 0);
    if (stock <= 0) {
      alerts.push(await createAlert({ type:"OUT_OF_STOCK", severity:"critical", title:`Out of stock: ${p.name}`, message:`${p.name} has no available stock.`, data:{productId:p._id, stock}, fingerprint:sha(`OUT_OF_STOCK:${p._id}`), detectedAt:now }));
    } else if (stock <= threshold) {
      alerts.push(await createAlert({ type:"LOW_STOCK", severity:"warning", title:`Low stock: ${p.name}`, message:`${p.name} has ${stock} unit${stock===1?"":"s"} remaining.`, data:{productId:p._id, stock, threshold}, fingerprint:sha(`LOW_STOCK:${p._id}:${stock}`), detectedAt:now }));
    }
  }

  const since7 = new Date(Date.now() - 7*86400000);
  const since14 = new Date(Date.now() - 14*86400000);
  const orders = await Order.find({ createdAt: { $gte: since14 } }).select("status totalPrice createdAt").lean();
  const recent = orders.filter(o => new Date(o.createdAt) >= since7);
  const prior = orders.filter(o => new Date(o.createdAt) >= since14 && new Date(o.createdAt) < since7);
  const recentCancelled = recent.filter(o=>o.status==="Cancelled").length;
  const priorCancelled = prior.filter(o=>o.status==="Cancelled").length;
  if (recentCancelled >= 3 && recentCancelled >= priorCancelled * 1.5 + 1) {
    alerts.push(await createAlert({type:"CANCELLATION_SPIKE", severity:"warning", title:"Cancellation activity increased", message:`${recentCancelled} orders were cancelled in the last 7 days versus ${priorCancelled} in the preceding 7 days.`, data:{recentCancelled, priorCancelled}, fingerprint:sha(`CANCELLATION_SPIKE:${dayStart(now).toISOString()}`), detectedAt:now}));
  }
  const revenue = list => list.filter(o=>o.status!=="Cancelled").reduce((s,o)=>s+Number(o.totalPrice||0),0);
  const recentRevenue = revenue(recent), priorRevenue = revenue(prior);
  if (priorRevenue > 0 && recentRevenue < priorRevenue * 0.7) {
    const pct = Math.round((1 - recentRevenue/priorRevenue)*100);
    alerts.push(await createAlert({type:"SALES_DROP", severity:"warning", title:"Sales revenue dropped", message:`Revenue for the last 7 days is ${pct}% below the preceding 7-day period.`, data:{recentRevenue, priorRevenue, dropPercent:pct}, fingerprint:sha(`SALES_DROP:${dayStart(now).toISOString()}`), detectedAt:now}));
  }

  // Use the same existing risk engine logic without duplicating its rules.
  const fakeReq = { query: { days: 30 } };
  let riskPayload = null;
  const fakeRes = { json: (x)=>{ riskPayload=x; } };
  await getRiskAnalysis(fakeReq, fakeRes, (e)=>{ throw e; });
  const highRisk = Number(riskPayload?.summary?.highRisk || 0);
  if (highRisk > 0) {
    alerts.push(await createAlert({type:"HIGH_RISK", severity:"warning", title:"High-risk customer signals detected", message:`${highRisk} customer signal${highRisk===1?"":"s"} currently meet the High risk threshold. Review before taking action.`, data:{highRisk, windowDays:30}, fingerprint:sha(`HIGH_RISK:${dayStart(now).toISOString()}`), detectedAt:now}));
  }

  return { scannedAt: now, created: alerts.filter(x=>x.created).map(x=>x.alert), totalNew: alerts.filter(x=>x.created).length, checkedProducts:products.length };
}

module.exports = { runAutomationScan };
