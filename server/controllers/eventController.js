const mongoose = require("mongoose");
const Event = require("../models/Event");

const cleanString = (value, max = 100) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const safeMetadata = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const allowed = ["quantity", "sort", "category", "resultCount", "source", "recommendationType", "position"];
  const output = {};

  for (const key of allowed) {
    if (!(key in value)) continue;
    const item = value[key];
    if (typeof item === "string") output[key] = item.slice(0, 100);
    else if (typeof item === "number" && Number.isFinite(item)) output[key] = item;
    else if (typeof item === "boolean") output[key] = item;
  }

  return output;
};

const createEvent = async (req, res, next) => {
  try {
    const { eventName, sessionId, productId, category, searchTerm, path, metadata } = req.body || {};

    if (!Event.EVENT_NAMES.includes(eventName)) {
      return res.status(400).json({ success: false, message: "Unsupported event name." });
    }

    const cleanSessionId = cleanString(sessionId, 80);
    if (!cleanSessionId || !/^[A-Za-z0-9._:-]{8,80}$/.test(cleanSessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session identifier." });
    }

    let product = null;
    if (productId) {
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product identifier." });
      }
      product = productId;
    }

    const event = await Event.create({
      eventName,
      sessionId: cleanSessionId,
      user: req.user?._id || null,
      product,
      category: cleanString(category, 100),
      searchTerm: cleanString(searchTerm, 100),
      path: cleanString(path, 300),
      metadata: safeMetadata(metadata),
    });

    return res.status(201).json({ success: true, eventId: event._id });
  } catch (error) {
    return next(error);
  }
};

const getEventAnalytics = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const match = { createdAt: { $gte: since } };
    const [eventCounts, topProducts, topSearches, dailyEvents, uniqueVisitors] = await Promise.all([
      Event.aggregate([
        { $match: match },
        { $group: { _id: "$eventName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Event.aggregate([
        { $match: { ...match, eventName: "product_view", product: { $ne: null } } },
        { $group: { _id: "$product", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, views: 1, name: "$product.name", category: "$product.category" } },
      ]),
      Event.aggregate([
        { $match: { ...match, eventName: "search", searchTerm: { $ne: "" } } },
        { $group: { _id: "$searchTerm", searches: { $sum: 1 } } },
        { $sort: { searches: -1 } },
        { $limit: 10 },
      ]),
      Event.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, events: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Event.distinct("sessionId", match),
    ]);

    const counts = Object.fromEntries(eventCounts.map((item) => [item._id, item.count]));
    const cartAdds = counts.cart_add || 0;
    const checkoutStarts = counts.checkout_started || 0;
    const checkoutCompleted = counts.checkout_completed || counts.order_created || 0;

    return res.json({
      success: true,
      period: { days, since: since.toISOString() },
      totals: {
        events: eventCounts.reduce((sum, item) => sum + item.count, 0),
        uniqueVisitors: uniqueVisitors.length,
        productViews: counts.product_view || 0,
        searches: counts.search || 0,
        wishlistAdds: counts.wishlist_add || 0,
        cartAdds,
        checkoutStarts,
        checkoutCompleted,
        checkoutConversion: checkoutStarts ? Number(((checkoutCompleted / checkoutStarts) * 100).toFixed(2)) : 0,
      },
      eventCounts,
      topProducts,
      topSearches,
      dailyEvents,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createEvent, getEventAnalytics };
