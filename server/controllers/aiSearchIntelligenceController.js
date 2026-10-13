const Event = require("../models/Event");

const clampDays = (value) => Math.min(Math.max(Number(value) || 30, 1), 365);

const normalizeTerm = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);

const getAiSearchIntelligence = async (req, res, next) => {
  try {
    const days = clampDays(req.query.days);
    const now = new Date();
    const currentSince = new Date(now.getTime() - days * 86400000);
    const previousSince = new Date(currentSince.getTime() - days * 86400000);

    const aiMatch = {
      eventName: "assistant_query",
      createdAt: { $gte: previousSince },
    };

    const [totals, topQueries, intents, categories, budgets, unanswered, trending] = await Promise.all([
      Event.aggregate([
        { $match: { ...aiMatch, createdAt: { $gte: currentSince } } },
        { $group: {
          _id: null,
          queries: { $sum: 1 },
          sessions: { $addToSet: "$sessionId" },
          matched: { $sum: { $cond: [{ $gt: [{ $ifNull: ["$metadata.resultCount", 0] }, 0] }, 1, 0] } },
        } },
        { $project: { _id: 0, queries: 1, uniqueSessions: { $size: "$sessions" }, matched: 1 } },
      ]),
      Event.aggregate([
        { $match: { ...aiMatch, createdAt: { $gte: currentSince }, searchTerm: { $ne: "" } } },
        { $group: { _id: "$searchTerm", searches: { $sum: 1 }, avgResults: { $avg: { $ifNull: ["$metadata.resultCount", 0] } } } },
        { $sort: { searches: -1, _id: 1 } },
        { $limit: 15 },
        { $project: { _id: 0, query: "$_id", searches: 1, avgResults: { $round: ["$avgResults", 1] } } },
      ]),
      Event.aggregate([
        { $match: { ...aiMatch, createdAt: { $gte: currentSince }, "metadata.intent": { $ne: "" } } },
        { $group: { _id: "$metadata.intent", searches: { $sum: 1 } } },
        { $sort: { searches: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, intent: "$_id", searches: 1 } },
      ]),
      Event.aggregate([
        { $match: { ...aiMatch, createdAt: { $gte: currentSince }, "metadata.category": { $ne: "" } } },
        { $group: { _id: "$metadata.category", searches: { $sum: 1 } } },
        { $sort: { searches: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, category: "$_id", searches: 1 } },
      ]),
      Event.aggregate([
        { $match: { ...aiMatch, createdAt: { $gte: currentSince }, "metadata.budgetBucket": { $ne: "" } } },
        { $group: { _id: "$metadata.budgetBucket", searches: { $sum: 1 } } },
        { $sort: { searches: -1 } },
        { $project: { _id: 0, budgetBucket: "$_id", searches: 1 } },
      ]),
      Event.aggregate([
        { $match: { ...aiMatch, createdAt: { $gte: currentSince }, "metadata.resultCount": { $eq: 0 }, searchTerm: { $ne: "" } } },
        { $group: { _id: "$searchTerm", searches: { $sum: 1 } } },
        { $sort: { searches: -1 } },
        { $limit: 15 },
        { $project: { _id: 0, query: "$_id", searches: 1 } },
      ]),
      Event.aggregate([
        { $match: { ...aiMatch, searchTerm: { $ne: "" } } },
        { $project: { term: { $toLower: "$searchTerm" }, period: { $cond: [{ $gte: ["$createdAt", currentSince] }, "current", "previous"] } } },
        { $group: { _id: "$term", current: { $sum: { $cond: [{ $eq: ["$period", "current"] }, 1, 0] } }, previous: { $sum: { $cond: [{ $eq: ["$period", "previous"] }, 1, 0] } } } },
        { $match: { current: { $gt: 0 } } },
        { $project: {
          _id: 0,
          query: "$_id",
          current: 1,
          previous: 1,
          growth: {
            $cond: [
              { $gt: ["$previous", 0] },
              { $round: [{ $multiply: [{ $divide: [{ $subtract: ["$current", "$previous"] }, "$previous"] }, 100] }, 1] },
              100,
            ],
          },
        } },
        { $sort: { growth: -1, current: -1 } },
        { $limit: 15 },
      ]),
    ]);

    const summary = totals[0] || { queries: 0, uniqueSessions: 0, matched: 0 };
    const matchRate = summary.queries ? Number(((summary.matched / summary.queries) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      period: { days, currentSince: currentSince.toISOString(), previousSince: previousSince.toISOString() },
      summary: {
        queries: summary.queries || 0,
        uniqueSessions: summary.uniqueSessions || 0,
        matchedQueries: summary.matched || 0,
        matchRate,
        unansweredQueries: unanswered.reduce((sum, item) => sum + item.searches, 0),
      },
      topQueries,
      trending,
      intents,
      categories,
      budgets,
      unanswered,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAiSearchIntelligence };
