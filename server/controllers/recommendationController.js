const mongoose = require("mongoose");
const Product = require("../models/Product");
const Event = require("../models/Event");
const Order = require("../models/Order");
const RecommendationLog = require("../models/RecommendationLog");

const cleanSessionId = (value) => {
  const id = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9._:-]{8,80}$/.test(id) ? id : "";
};

const limitValue = (value, fallback = 8, max = 20) =>
  Math.min(Math.max(Number(value) || fallback, 1), max);

const productProjection = {
  name: 1,
  description: 1,
  price: 1,
  image: 1,
  category: 1,
  countInStock: 1,
  rating: 1,
  numReviews: 1,
  features: 1,
  applications: 1,
};

const activeStockMatch = { isActive: { $ne: false }, countInStock: { $gt: 0 } };

const getTrending = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 90);
    const limit = limitValue(req.query.limit);
    const since = new Date(Date.now() - days * 86400000);

    const rows = await Event.aggregate([
      { $match: { createdAt: { $gte: since }, product: { $ne: null }, eventName: { $in: ["product_view", "wishlist_add", "cart_add", "order_created"] } } },
      { $group: { _id: "$product", score: { $sum: { $switch: { branches: [
        { case: { $eq: ["$eventName", "product_view"] }, then: 1 },
        { case: { $eq: ["$eventName", "wishlist_add"] }, then: 4 },
        { case: { $eq: ["$eventName", "cart_add"] }, then: 5 },
        { case: { $eq: ["$eventName", "order_created"] }, then: 8 },
      ], default: 1 } } }, views: { $sum: { $cond: [{ $eq: ["$eventName", "product_view"] }, 1, 0] } } } },
      { $sort: { score: -1, views: -1 } },
      { $limit: limit },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $match: { "product.isActive": { $ne: false }, "product.countInStock": { $gt: 0 } } },
      { $project: { _id: "$product._id", name: "$product.name", description: "$product.description", price: "$product.price", image: "$product.image", category: "$product.category", countInStock: "$product.countInStock", rating: "$product.rating", numReviews: "$product.numReviews", score: 1 } },
    ]);

    if (rows.length < limit) {
      const exclude = rows.map((r) => r._id);
      const fallback = await Product.find({ ...activeStockMatch, _id: { $nin: exclude } }, productProjection).sort({ rating: -1, numReviews: -1, createdAt: -1 }).limit(limit - rows.length).lean();
      rows.push(...fallback.map((p) => ({ ...p, score: 0 })));
    }

    res.json({ success: true, source: "trending", days, products: rows });
  } catch (error) { next(error); }
};

const getPersonalized = async (req, res, next) => {
  try {
    const limit = limitValue(req.query.limit);
    const sessionId = cleanSessionId(req.query.sessionId);
    const userId = req.user?._id || null;

    if (!userId && !sessionId) {
      return getTrending(req, res, next);
    }

    const eventMatch = userId ? { user: userId } : { sessionId };
    const [events, orders] = await Promise.all([
      Event.find({ ...eventMatch, product: { $ne: null }, eventName: { $in: ["product_view", "wishlist_add", "cart_add"] } }).sort({ createdAt: -1 }).limit(200).lean(),
      userId ? Order.find({ user: userId, status: { $ne: "Cancelled" } }).select("items category").sort({ createdAt: -1 }).limit(100).lean() : [],
    ]);

    const scores = new Map();
    const categories = new Map();
    const add = (id, amount) => scores.set(String(id), (scores.get(String(id)) || 0) + amount);
    const addCategory = (category, amount) => { if (category) categories.set(category, (categories.get(category) || 0) + amount); };

    for (const event of events) {
      const weight = event.eventName === "cart_add" ? 5 : event.eventName === "wishlist_add" ? 4 : 1;
      add(event.product, weight);
      addCategory(event.category, weight);
    }
    for (const order of orders) {
      for (const item of order.items || []) {
        add(item.product, 8);
      }
    }

    const seedIds = [...scores.keys()].filter(mongoose.isValidObjectId).map((id) => new mongoose.Types.ObjectId(id));
    const seedProducts = seedIds.length ? await Product.find({ _id: { $in: seedIds } }, { category: 1 }).lean() : [];
    for (const p of seedProducts) addCategory(p.category, 2);

    const candidates = await Product.find({ ...activeStockMatch, ...(seedIds.length ? { _id: { $nin: seedIds } } : {}) }, productProjection).limit(300).lean();
    const categoryMax = Math.max(...categories.values(), 1);
    const ranked = candidates.map((p) => {
      const base = scores.get(String(p._id)) || 0;
      const affinity = ((categories.get(p.category) || 0) / categoryMax) * 10;
      const quality = Math.min(Number(p.rating || 0), 5) * 0.6 + Math.min(Number(p.numReviews || 0), 100) * 0.02;
      return { ...p, score: Number((base + affinity + quality).toFixed(3)) };
    }).sort((a, b) => b.score - a.score).slice(0, limit);

    if (ranked.length < limit) {
      const exclude = ranked.map((p) => p._id).concat(seedIds);
      const fallback = await Product.find({ ...activeStockMatch, _id: { $nin: exclude } }, productProjection).sort({ rating: -1, numReviews: -1, createdAt: -1 }).limit(limit - ranked.length).lean();
      ranked.push(...fallback.map((p) => ({ ...p, score: 0 })));
    }

    res.json({ success: true, source: "personalized", products: ranked, personalized: Boolean(userId || events.length) });
  } catch (error) { next(error); }
};

const getSimilar = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid product identifier." });
    const limit = limitValue(req.query.limit);
    const source = await Product.findById(id, productProjection).lean();
    if (!source) return res.status(404).json({ success: false, message: "Product not found." });

    const sourceTerms = new Set(`${source.name || ""} ${(source.features || []).join(" ")} ${(source.applications || []).join(" ")}`.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 3));
    const candidates = await Product.find({ ...activeStockMatch, _id: { $ne: id }, ...(source.category ? { category: source.category } : {}) }, productProjection).limit(100).lean();
    const ranked = candidates.map((p) => {
      const terms = `${p.name || ""} ${(p.features || []).join(" ")} ${(p.applications || []).join(" ")}`.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 3);
      const overlap = terms.reduce((n, t) => n + (sourceTerms.has(t) ? 1 : 0), 0);
      return { ...p, score: overlap * 3 + Number(p.rating || 0) * 0.5 };
    }).sort((a, b) => b.score - a.score).slice(0, limit);

    res.json({ success: true, source: "similar", products: ranked });
  } catch (error) { next(error); }
};

const getFrequentlyBought = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid product identifier." });
    const limit = limitValue(req.query.limit);
    const rows = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" }, "items.product": new mongoose.Types.ObjectId(id) } },
      { $unwind: "$items" },
      { $match: { "items.product": { $ne: new mongoose.Types.ObjectId(id) } } },
      { $group: { _id: "$items.product", purchases: { $sum: "$items.quantity" } } },
      { $sort: { purchases: -1 } },
      { $limit: limit },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
      { $unwind: "$product" },
      { $match: { "product.isActive": { $ne: false }, "product.countInStock": { $gt: 0 } } },
      { $project: { _id: "$product._id", name: "$product.name", description: "$product.description", price: "$product.price", image: "$product.image", category: "$product.category", countInStock: "$product.countInStock", rating: "$product.rating", numReviews: "$product.numReviews", purchases: 1 } },
    ]);
    res.json({ success: true, source: "frequently_bought", products: rows });
  } catch (error) { next(error); }
};

const logRecommendation = async (req, res, next) => {
  try {
    const { source, productId, action, sessionId, position } = req.body || {};
    const validSources = ["personalized", "trending", "similar", "frequently_bought"];
    if (!validSources.includes(source) || !["impression", "click"].includes(action) || !mongoose.isValidObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid recommendation event." });
    const clean = cleanSessionId(sessionId);
    if (!clean) return res.status(400).json({ success: false, message: "Invalid session identifier." });
    await RecommendationLog.create({ user: req.user?._id || null, sessionId: clean, source, product: productId, action, position: Number.isFinite(Number(position)) ? Number(position) : 0 });
    res.status(201).json({ success: true });
  } catch (error) { next(error); }
};

const getRecommendationAnalytics = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const since = new Date(Date.now() - days * 86400000);
    const rows = await RecommendationLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { source: "$source", action: "$action" }, count: { $sum: 1 } } },
      { $sort: { "_id.source": 1 } },
    ]);
    const bySource = {};
    for (const row of rows) {
      bySource[row._id.source] ||= { impressions: 0, clicks: 0, ctr: 0 };
      bySource[row._id.source][row._id.action === "click" ? "clicks" : "impressions"] = row.count;
    }
    for (const value of Object.values(bySource)) value.ctr = value.impressions ? Number(((value.clicks / value.impressions) * 100).toFixed(2)) : 0;
    res.json({ success: true, days, bySource });
  } catch (error) { next(error); }
};

module.exports = { getTrending, getPersonalized, getSimilar, getFrequentlyBought, logRecommendation, getRecommendationAnalytics };
