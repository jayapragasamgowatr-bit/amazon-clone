const Event = require("../models/Event");
const Product = require("../models/Product");
const { chat } = require("../utils/aiProvider");

const clean = (value, max = 120) =>
  typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";

const norm = (value) => clean(value, 160).toLowerCase();

const STOP = new Set([
  "show", "find", "need", "want", "with", "for", "the", "and",
  "water", "product", "products", "please", "give", "looking",
  "something", "what", "which", "can", "you", "me", "under",
  "below", "less", "than",
]);

const toIntentWords = (term) =>
  [...new Set(
    norm(term)
      .replace(/[^a-z0-9₹.\s-]/gi, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP.has(word))
  )].slice(0, 5);

const templateFor = (term) => {
  const value = clean(term, 100).replace(/[?.!]+$/, "");
  if (!value) return "";
  const lower = value.toLowerCase();

  if (/flow|flowmeter|flow meter/.test(lower)) {
    return `What specifications should I check for ${value}?`;
  }
  if (/level|tank/.test(lower)) {
    return `Which level-monitoring option fits ${value}?`;
  }
  if (/iot|cloud|connect|remote/.test(lower)) {
    return `Which products support ${value}?`;
  }
  if (/dn\s*\d+|\d+\s*-?inch|\d+\s*inch/.test(lower)) {
    return `Which product matches ${value}?`;
  }
  return `Which products best match ${value}?`;
};

const unique = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = norm(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseExcluded = (value) => {
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((item) => typeof item === "string")
    .flatMap((item) => item.split("||"))
    .map((item) => norm(item))
    .filter(Boolean)
    .slice(-12);
};

const getAssistantSuggestions = async (req, res, next) => {
  try {
    const excludeSet = new Set(parseExcluded(req.query.exclude));
    const contextTerm = clean(req.query.context, 120);
    const now = Date.now();
    const recentSince = new Date(now - 7 * 86400000);
    const previousSince = new Date(now - 14 * 86400000);

    const eventMatch = {
      eventName: { $in: ["search", "assistant_query"] },
      searchTerm: { $ne: "" },
    };

    const [recent, previous, categories, products] = await Promise.all([
      Event.aggregate([
        { $match: { ...eventMatch, createdAt: { $gte: recentSince } } },
        { $group: { _id: "$searchTerm", count: { $sum: 1 }, lastSeen: { $max: "$createdAt" } } },
        { $sort: { count: -1, lastSeen: -1 } },
        { $limit: 30 },
      ]),
      Event.aggregate([
        { $match: { ...eventMatch, createdAt: { $gte: previousSince, $lt: recentSince } } },
        { $group: { _id: "$searchTerm", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
      Product.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Product.find({ isActive: { $ne: false } })
        .select("name category price features applications specifications countInStock rating numReviews")
        .sort({ rating: -1, numReviews: -1 })
        .limit(12)
        .lean(),
    ]);

    const previousMap = new Map(previous.map((item) => [norm(item._id), item.count]));
    const scored = recent.map((item) => {
      const key = norm(item._id);
      const old = previousMap.get(key) || 0;
      const growth = old ? (item.count - old) / old : item.count > 0 ? 1 : 0;
      return { term: clean(item._id), hotScore: item.count, growth, old };
    }).sort((a, b) => (b.growth * 10 + b.hotScore) - (a.growth * 10 + a.hotScore));

    const hot = recent.slice(0, 8).map((item) => clean(item._id)).filter(Boolean);
    const trending = scored
      .filter((item) => item.growth > 0 || item.old === 0)
      .slice(0, 8)
      .map((item) => item.term)
      .filter(Boolean);

    let suggestions = [];
    if (contextTerm) suggestions.push(templateFor(contextTerm));
    for (const term of hot) suggestions.push(templateFor(term));
    for (const term of trending) suggestions.push(templateFor(term));
    for (const category of categories.slice(0, 5)) {
      const name = clean(category._id, 60);
      if (name) suggestions.push(`Which ${name} products are suitable for my requirements?`);
    }

    const productContext = products.slice(0, 10).map((product) => ({
      name: clean(product.name, 100),
      category: clean(product.category, 60),
      price: Number(product.price) || 0,
      inStock: Number(product.countInStock) > 0,
      features: Array.isArray(product.features) ? product.features.slice(0, 6) : [],
      applications: Array.isArray(product.applications) ? product.applications.slice(0, 6) : [],
      specifications: product.specifications || {},
    }));

    const searchContext = {
      currentCustomerIntent: contextTerm,
      hotSearches: hot.slice(0, 8),
      trendingSearches: trending.slice(0, 8),
      categories: categories.map((item) => clean(item._id, 60)).filter(Boolean).slice(0, 8),
      topProducts: productContext,
    };

    // AI suggestions are optional; the catalogue/search-derived fallback remains available.
    let aiEnhanced = false;
    try {
      const ai = await chat({
        system: [
          "Generate exactly 8 short suggested questions for the Waventra Vetric shopping assistant.",
          "Use the supplied customer intent, recent searches, and live catalogue context.",
          "Mix product discovery, budget, application, comparison, stock, and technical questions.",
          "Do not invent product names, prices, stock levels, features, or specifications.",
          "Each item must be a useful customer question or request, no more than 150 characters.",
          "Return ONLY a JSON array of strings.",
        ].join(" "),
        user: JSON.stringify(searchContext),
        temperature: 0.7,
        maxTokens: 500,
      });

      const raw = String(ai?.text || "")
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        const aiQuestions = parsed
          .filter((item) => typeof item === "string")
          .map((item) => clean(item, 150))
          .filter(Boolean);
        if (aiQuestions.length) {
          suggestions = aiQuestions.concat(suggestions);
          aiEnhanced = true;
        }
      }
    } catch (_) {
      // Keep catalogue/search-derived suggestions if AI is unavailable.
    }

    const fallback = [
      "Show me products under ₹2,000.",
      "Which products are currently in stock?",
      "Help me compare products by specifications.",
      "Which product best suits my application?",
      "Show me products with IoT or cloud monitoring.",
      "What should I check before choosing a product?",
    ];

    let candidates = unique([...suggestions, ...fallback])
      .filter((question) => !excludeSet.has(norm(question)));

    // When the visitor has exhausted the current pool, allow the fallback pool to rotate again.
    if (!candidates.length) {
      candidates = unique([...suggestions, ...fallback]);
    }

    const seed = Math.floor(now / (60 * 60 * 1000));
    candidates.sort((a, b) => {
      const score = (value) =>
        [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) + seed;
      return (score(a) % 997) - (score(b) % 997);
    });

    return res.json({
      success: true,
      suggestions: candidates.slice(0, 4),
      meta: {
        hot: hot.slice(0, 5),
        trending: trending.slice(0, 5),
        analysedSearches: recent.reduce((sum, item) => sum + item.count, 0),
        periodDays: 7,
        aiEnhanced,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAssistantSuggestions,
  templateFor,
  unique,
  parseExcluded,
};
