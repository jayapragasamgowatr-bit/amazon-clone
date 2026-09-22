const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Event = require("../models/Event");
const { chat } = require("../utils/aiProvider");

const parseDate = (value, end = false) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const d = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const rangeFromQuery = (query = {}) => {
  const now = new Date();
  const to = parseDate(query.to, true) || now;
  const from = parseDate(query.from) || new Date(to.getTime() - 29 * 86400000);
  if (from > to) { const e = new Error("from date cannot be after to date"); e.statusCode = 400; throw e; }
  return { from, to };
};

const buildSnapshot = async ({ from, to }) => {
  const priorDays = Math.max(1, Math.ceil((to - from) / 86400000) + 1);
  const priorTo = new Date(from.getTime() - 1);
  const priorFrom = new Date(priorTo.getTime() - (priorDays - 1) * 86400000);
  const currentMatch = { createdAt: { $gte: from, $lte: to } };
  const priorMatch = { createdAt: { $gte: priorFrom, $lte: priorTo } };
  const active = { $or: [{ isActive: true }, { isActive: { $exists: false } }] };

  const [cur, prev, daily, top, categories, inventory, customers, events, products] = await Promise.all([
    Order.aggregate([{ $match: currentMatch }, { $group: { _id: null, orders: { $sum: 1 }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$totalPrice", 0] } }, units: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, { $sum: "$items.quantity" }, 0] } } } }]),
    Order.aggregate([{ $match: priorMatch }, { $group: { _id: null, orders: { $sum: 1 }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } }, revenue: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$totalPrice", 0] } } } }]),
    Order.aggregate([{ $match: currentMatch }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, orders: { $sum: 1 }, revenue: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$totalPrice", 0] } }, cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([{ $match: currentMatch }, { $unwind: "$items" }, { $group: { _id: "$items.product", name: { $first: "$items.name" }, units: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } }, }, { $sort: { units: -1 } }, { $limit: 10 }]),
    Order.aggregate([{ $match: { ...currentMatch, status: { $ne: "Cancelled" } } }, { $unwind: "$items" }, { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "product" } }, { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } }, { $group: { _id: { $ifNull: ["$product.category", "Uncategorized"] }, units: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } }, { $sort: { revenue: -1 } }, { $limit: 12 }]),
    Product.aggregate([{ $match: active }, { $group: { _id: null, products: { $sum: 1 }, stockUnits: { $sum: "$countInStock" }, inventoryValue: { $sum: { $multiply: ["$countInStock", "$price"] } }, lowStock: { $sum: { $cond: [{ $and: [{ $gt: ["$countInStock", 0] }, { $lte: ["$countInStock", 5] }] }, 1, 0] } }, outOfStock: { $sum: { $cond: [{ $lte: ["$countInStock", 0] }, 1, 0] } } } }]),
    Order.aggregate([{ $match: { ...currentMatch, status: { $ne: "Cancelled" } } }, { $group: { _id: "$user", orders: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } }, { $group: { _id: null, uniqueCustomers: { $sum: 1 }, repeatCustomers: { $sum: { $cond: [{ $gt: ["$orders", 1] }, 1, 0] } }, averageRevenue: { $avg: "$revenue" } } }]),
    Event.countDocuments({ createdAt: { $gte: from, $lte: to } }),
    Product.countDocuments(active),
  ]);

  const c = cur[0] || {}, p = prev[0] || {}, inv = inventory[0] || {}, cust = customers[0] || {};
  const revenue = Number(c.revenue || 0), priorRevenue = Number(p.revenue || 0);
  const revenueChangePct = priorRevenue ? Number((((revenue - priorRevenue) / priorRevenue) * 100).toFixed(2)) : null;
  const orderChangePct = Number(p.orders || 0) ? Number((((Number(c.orders || 0) - Number(p.orders || 0)) / Number(p.orders || 0)) * 100).toFixed(2)) : null;

  return {
    period: { from: from.toISOString(), to: to.toISOString(), days: priorDays },
    current: { orders: Number(c.orders || 0), cancelledOrders: Number(c.cancelled || 0), cancellationRate: c.orders ? Number(((c.cancelled / c.orders) * 100).toFixed(2)) : 0, revenue: Number(revenue.toFixed(2)), unitsSold: Number(c.units || 0), averageOrderValue: Number(c.orders - c.cancelled > 0 ? (revenue / (c.orders - c.cancelled)).toFixed(2) : 0) },
    previous: { orders: Number(p.orders || 0), cancelledOrders: Number(p.cancelled || 0), revenue: Number(priorRevenue.toFixed(2)) },
    change: { revenuePct: revenueChangePct, ordersPct: orderChangePct },
    dailySales: daily.map(x => ({ date: x._id, orders: x.orders, revenue: Number(x.revenue || 0), cancelled: x.cancelled })),
    topProducts: top.map(x => ({ id: x._id, name: x.name, units: x.units, revenue: Number(x.revenue || 0) })),
    categories: categories.map(x => ({ category: x._id, units: x.units, revenue: Number(x.revenue || 0) })),
    inventory: { activeProducts: Number(inv.products || 0), stockUnits: Number(inv.stockUnits || 0), inventoryValue: Number(inv.inventoryValue || 0), lowStock: Number(inv.lowStock || 0), outOfStock: Number(inv.outOfStock || 0) },
    customers: { uniqueCustomers: Number(cust.uniqueCustomers || 0), repeatCustomers: Number(cust.repeatCustomers || 0), repeatRate: cust.uniqueCustomers ? Number(((cust.repeatCustomers / cust.uniqueCustomers) * 100).toFixed(2)) : 0, averageRevenue: Number(cust.averageRevenue || 0) },
    events: Number(events || 0), activeCatalogProducts: products,
  };
};

const aiPrompt = (snapshot, question) => `You are the real Waventra Vetric business intelligence analyst. Use ONLY the supplied live MongoDB snapshot. Never invent facts, causes, customers, products, figures or trends. Calculate only from supplied values. If the data is insufficient, say so. Distinguish observations from inferences. Do not claim you executed any business action. ${question ? `Answer this admin question: ${question}` : "Provide an executive summary, key changes versus the previous period, sales trends, inventory risks, customer observations, and 5 concrete areas for admin review."}\n\nLIVE SNAPSHOT:\n${JSON.stringify(snapshot)}`;

const getBusinessIntelligence = async (req, res, next) => {
  try {
    const range = rangeFromQuery(req.query);
    const snapshot = await buildSnapshot(range);
    const ai = await chat({ system: aiPrompt(snapshot), user: "Analyze the live snapshot and return a concise, structured management report.", temperature: 0.1, maxTokens: 1400 });
    res.json({ success: true, provider: ai.provider, model: ai.model, generatedAt: new Date().toISOString(), snapshot, analysis: ai.text });
  } catch (e) { next(e); }
};

const askBusinessIntelligence = async (req, res, next) => {
  try {
    const question = String(req.body?.question || "").trim();
    if (!question || question.length > 1000) return res.status(400).json({ success: false, message: "Question is required and must be 1000 characters or less." });
    const range = rangeFromQuery(req.query);
    const snapshot = await buildSnapshot(range);
    const ai = await chat({ system: aiPrompt(snapshot, question), user: question, temperature: 0.1, maxTokens: 1200 });
    res.json({ success: true, provider: ai.provider, model: ai.model, generatedAt: new Date().toISOString(), snapshot, answer: ai.text });
  } catch (e) { next(e); }
};

module.exports = { getBusinessIntelligence, askBusinessIntelligence };
