const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const Event = require("../models/Event");
const Product = require("../models/Product");

const safeDays = (value) => Math.min(Math.max(Number(value) || 90, 7), 365);

const getCustomerIntelligence = async (req, res, next) => {
  try {
    const days = safeDays(req.query.days);
    const since = new Date(Date.now() - days * 86400000);
    const userId = req.query.userId;
    if (!userId || !mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: "Valid userId is required." });

    const [user, orders, events] = await Promise.all([
      User.findById(userId).select("name email role createdAt").lean(),
      Order.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean(),
      Event.find({ user: userId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(500).lean(),
    ]);
    if (!user) return res.status(404).json({ success: false, message: "Customer not found." });

    const validOrders = orders.filter((o) => o.status !== "Cancelled");
    const spent = validOrders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const delivered = validOrders.filter((o) => o.status === "Delivered");
    const cancelled = orders.filter((o) => o.status === "Cancelled");
    const productScores = new Map();
    const categoryScores = new Map();
    const add = (id, score) => productScores.set(String(id), (productScores.get(String(id)) || 0) + score);
    const addCat = (cat, score) => { if (cat) categoryScores.set(cat, (categoryScores.get(cat) || 0) + score); };
    for (const e of events) {
      const w = e.eventName === "cart_add" ? 5 : e.eventName === "wishlist_add" ? 4 : e.eventName === "product_view" ? 1 : 0;
      if (w) { if (e.product) add(e.product, w); addCat(e.category, w); }
    }
    for (const o of validOrders) for (const item of o.items || []) add(item.product, 8 * Number(item.quantity || 1));

    const topProductIds = [...productScores.entries()].sort((a,b) => b[1]-a[1]).slice(0, 8).map(([id]) => id).filter(mongoose.isValidObjectId);
    const topProducts = topProductIds.length ? await Product.find({ _id: { $in: topProductIds } }).select("name category price image countInStock rating").lean() : [];
    const productMap = new Map(topProducts.map(p => [String(p._id), p]));
    const interests = [...categoryScores.entries()].sort((a,b) => b[1]-a[1]).slice(0, 5).map(([category, score]) => ({ category, score }));
    const lastOrder = orders[0] || null;
    const lastEvent = events[0] || null;
    const avgOrderValue = validOrders.length ? Number((spent / validOrders.length).toFixed(2)) : 0;
    const recencyDays = lastOrder ? Math.max(0, Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / 86400000)) : null;
    let segment = "New / Unclassified";
    if (validOrders.length >= 5 && recencyDays !== null && recencyDays <= 60) segment = "Loyal / Active";
    else if (spent >= 10000 && recencyDays !== null && recencyDays <= 120) segment = "High Value";
    else if (validOrders.length > 0 && recencyDays !== null && recencyDays <= 120) segment = "Active Customer";
    else if (validOrders.length > 0) segment = "At Risk / Inactive";

    res.json({ success: true, period: { days, since: since.toISOString() }, customer: user, metrics: { orders: orders.length, validOrders: validOrders.length, deliveredOrders: delivered.length, cancelledOrders: cancelled.length, totalSpent: Number(spent.toFixed(2)), averageOrderValue: avgOrderValue, recencyDays, events: events.length }, segment, interests, topProducts: topProductIds.map(id => ({ ...productMap.get(id), score: productScores.get(id) })).filter(Boolean), lastOrder, lastEvent });
  } catch (error) { next(error); }
};

const getCustomerIntelligenceSummary = async (req, res, next) => {
  try {
    const days = safeDays(req.query.days);
    const since = new Date(Date.now() - days * 86400000);
    const [users, orders, events] = await Promise.all([
      User.find({ role: "user" }).select("name email createdAt").sort({ createdAt: -1 }).limit(5000).lean(),
      Order.find({ createdAt: { $gte: since } }).select("user totalPrice status createdAt").lean(),
      Event.find({ createdAt: { $gte: since }, user: { $ne: null } }).select("user eventName createdAt").lean(),
    ]);
    const map = new Map(users.map(u => [String(u._id), { ...u, orders: 0, spent: 0, events: 0, lastOrderAt: null }]));
    for (const o of orders) { const r = map.get(String(o.user)); if (!r) continue; if (o.status !== "Cancelled") { r.orders += 1; r.spent += Number(o.totalPrice || 0); } if (!r.lastOrderAt || new Date(o.createdAt) > new Date(r.lastOrderAt)) r.lastOrderAt = o.createdAt; }
    for (const e of events) { const r = map.get(String(e.user)); if (r) r.events += 1; }
    const rows = [...map.values()].map(r => ({ ...r, spent: Number(r.spent.toFixed(2)), averageOrderValue: r.orders ? Number((r.spent/r.orders).toFixed(2)) : 0 })).sort((a,b) => b.spent-a.spent);
    res.json({ success: true, period: { days, since: since.toISOString() }, totals: { customers: rows.length, activeCustomers: rows.filter(r => r.events > 0 || r.orders > 0).length, repeatCustomers: rows.filter(r => r.orders >= 2).length, revenue: Number(rows.reduce((s,r)=>s+r.spent,0).toFixed(2)) }, customers: rows.slice(0, 100) });
  } catch (error) { next(error); }
};

module.exports = { getCustomerIntelligence, getCustomerIntelligenceSummary };
