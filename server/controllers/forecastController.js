const Product = require("../models/Product");
const Order = require("../models/Order");

const DAY = 24 * 60 * 60 * 1000;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const round = (value, digits = 2) => Number(Number(value).toFixed(digits));

const buildForecast = ({ currentStock, recent14, recent30, recent90, horizonDays = 30, leadTimeDays = 7 }) => {
  const velocity14 = recent14 / 14;
  const velocity30 = recent30 / 30;
  const velocity90 = recent90 / 90;

  // Transparent baseline: recent velocity is blended with longer history,
  // then adjusted for a bounded recent-vs-history trend. This is intentionally
  // deterministic and ML-ready until enough historical data exists for a trained model.
  const baseVelocity = velocity14 * 0.5 + velocity30 * 0.3 + velocity90 * 0.2;
  const historyVelocity = Math.max(velocity90, 0.0001);
  const trendFactor = clamp(velocity14 / historyVelocity, 0.7, 1.3);
  const dailyDemand = Math.max(0, baseVelocity * (0.65 + trendFactor * 0.35));
  const forecast = dailyDemand * horizonDays;
  const safetyStock = dailyDemand * leadTimeDays * 1.25;
  const reorderPoint = dailyDemand * leadTimeDays + safetyStock;
  const projectedStock = currentStock - forecast;
  const daysOfCover = dailyDemand > 0 ? currentStock / dailyDemand : null;
  const reorderQuantity = Math.max(0, Math.ceil(forecast + safetyStock - currentStock));

  let risk = "Healthy";
  if (currentStock <= 0) risk = "Out of Stock";
  else if (dailyDemand > 0 && daysOfCover <= leadTimeDays) risk = "Critical";
  else if (dailyDemand > 0 && daysOfCover <= leadTimeDays * 2) risk = "High";
  else if (dailyDemand > 0 && daysOfCover <= horizonDays) risk = "Medium";

  return {
    dailyDemand: round(dailyDemand),
    forecastUnits: Math.ceil(forecast),
    projectedStock: Math.floor(projectedStock),
    daysOfCover: daysOfCover === null ? null : round(daysOfCover),
    safetyStock: Math.ceil(safetyStock),
    reorderPoint: Math.ceil(reorderPoint),
    reorderQuantity,
    risk,
  };
};

const getDemandForecast = async (req, res, next) => {
  try {
    const horizonDays = clamp(Number(req.query.horizonDays) || 30, 7, 90);
    const historyDays = clamp(Number(req.query.historyDays) || 90, 30, 365);
    const leadTimeDays = clamp(Number(req.query.leadTimeDays) || 7, 1, 60);
    const riskFilter = String(req.query.risk || "All").trim();
    const search = String(req.query.search || "").trim().slice(0, 100);

    const now = new Date();
    const historyStart = new Date(now.getTime() - historyDays * DAY);
    const recent30Start = new Date(now.getTime() - 30 * DAY);
    const recent14Start = new Date(now.getTime() - 14 * DAY);

    const productQuery = { isActive: { $ne: false } };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      productQuery.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
      ];
    }

    const products = await Product.find(productQuery)
      .select("name category price image countInStock isActive")
      .sort({ name: 1 })
      .lean();

    const orderRows = await Order.aggregate([
      { $match: { createdAt: { $gte: historyStart }, status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      { $group: { _id: { product: "$items.product", day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }, quantity: { $sum: "$items.quantity" } } },
      { $sort: { "_id.day": 1 } },
    ]);

    const demand = new Map();
    for (const row of orderRows) {
      const productId = String(row._id.product);
      const day = new Date(`${row._id.day}T00:00:00.000Z`);
      const quantity = Number(row.quantity || 0);
      if (!demand.has(productId)) demand.set(productId, { recent14: 0, recent30: 0, recent90: 0, history: 0 });
      const target = demand.get(productId);
      target.history += quantity;
      if (day >= recent30Start) target.recent30 += quantity;
      if (day >= recent14Start) target.recent14 += quantity;
      if (day >= new Date(now.getTime() - 90 * DAY)) target.recent90 += quantity;
    }

    const rows = products.map((product) => {
      const stats = demand.get(String(product._id)) || { recent14: 0, recent30: 0, recent90: 0, history: 0 };
      const forecast = buildForecast({ currentStock: Number(product.countInStock || 0), ...stats, horizonDays, leadTimeDays });
      return {
        product: { _id: product._id, name: product.name, category: product.category, price: product.price, image: product.image, countInStock: product.countInStock },
        sales: { last14Days: stats.recent14, last30Days: stats.recent30, historyDays, historyUnits: stats.history },
        forecast,
      };
    });

    const filtered = riskFilter === "All" ? rows : rows.filter((row) => row.forecast.risk === riskFilter);
    const summary = {
      products: filtered.length,
      critical: rows.filter((r) => r.forecast.risk === "Critical").length,
      high: rows.filter((r) => r.forecast.risk === "High").length,
      medium: rows.filter((r) => r.forecast.risk === "Medium").length,
      outOfStock: rows.filter((r) => r.forecast.risk === "Out of Stock").length,
      reorderUnits: rows.reduce((sum, r) => sum + r.forecast.reorderQuantity, 0),
      forecastUnits: rows.reduce((sum, r) => sum + r.forecast.forecastUnits, 0),
    };

    filtered.sort((a, b) => {
      const rank = { "Out of Stock": 0, Critical: 1, High: 2, Medium: 3, Healthy: 4 };
      return rank[a.forecast.risk] - rank[b.forecast.risk] || b.forecast.reorderQuantity - a.forecast.reorderQuantity;
    });

    res.json({
      success: true,
      method: "hybrid_velocity_forecast_v1",
      horizonDays,
      historyDays,
      leadTimeDays,
      generatedAt: new Date().toISOString(),
      summary,
      forecasts: filtered,
    });
  } catch (error) { next(error); }
};

module.exports = { getDemandForecast, buildForecast };
