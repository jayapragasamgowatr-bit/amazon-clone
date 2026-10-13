const Event = require("../models/Event");
const Product = require("../models/Product");
const { chat } = require("../utils/aiProvider");

const clean = (v, max = 120) => typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "";
const norm = (v) => clean(v, 100).toLowerCase();
const STOP = new Set(["show","find","need","want","with","for","the","and","water","product","products","please","give","looking","something","what","which","can","you","me","under","below","less","than"]);

const toIntentWords = (term) => [...new Set(norm(term).replace(/[^a-z0-9₹.\s-]/gi, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)))].slice(0, 5);

const templateFor = (term) => {
  const t = clean(term);
  const lower = t.toLowerCase();
  if (/flow|flowmeter|flow meter/.test(lower)) return `Which flow meter is suitable for ${t.replace(/^(i need|show me|find|need)\s*/i, "")}?`;
  if (/level|tank/.test(lower)) return `What is the best solution for ${t.replace(/^(i need|show me|find|need)\s*/i, "")}?`;
  if (/iot|cloud|connect|remote/.test(lower)) return `Show me water monitoring products with ${t.replace(/^(i need|show me|find|need)\s*/i, "")}.`;
  if (/dn\s*\d+|\d+\s*-?inch|\d+\s*inch/.test(lower)) return `Which product is suitable for ${t}?`;
  return `Show me products related to ${t}.`;
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

const getAssistantSuggestions = async (req, res, next) => {
  try {
    const exclude = Array.isArray(req.query.exclude) ? req.query.exclude : String(req.query.exclude || "").split("||").filter(Boolean);
    const excludeSet = new Set(exclude.map(norm));
    const now = Date.now();
    const recentSince = new Date(now - 7 * 86400000);
    const previousSince = new Date(now - 14 * 86400000);

    const [recent, previous, categories, products] = await Promise.all([
      Event.aggregate([
        { $match: { eventName: "search", searchTerm: { $ne: "" }, createdAt: { $gte: recentSince } } },
        { $group: { _id: "$searchTerm", count: { $sum: 1 }, lastSeen: { $max: "$createdAt" } } },
        { $sort: { count: -1, lastSeen: -1 } }, { $limit: 30 },
      ]),
      Event.aggregate([
        { $match: { eventName: "search", searchTerm: { $ne: "" }, createdAt: { $gte: previousSince, $lt: recentSince } } },
        { $group: { _id: "$searchTerm", count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 50 },
      ]),
      Product.aggregate([
        { $match: { isActive: { $ne: false } } },
        { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
        { $sort: { count: -1 } }, { $limit: 10 },
      ]),
      Product.find({ isActive: { $ne: false } }).select("name category price features applications specifications countInStock rating numReviews").sort({ rating: -1, numReviews: -1 }).limit(12).lean(),
    ]);

    const previousMap = new Map(previous.map(x => [norm(x._id), x.count]));
    const scored = recent.map(x => {
      const key = norm(x._id);
      const old = previousMap.get(key) || 0;
      const growth = old ? (x.count - old) / old : x.count > 0 ? 1 : 0;
      return { term: clean(x._id), hotScore: x.count, growth, old };
    }).sort((a,b) => (b.growth * 10 + b.hotScore) - (a.growth * 10 + a.hotScore));

    const hot = recent.slice(0, 8).map(x => clean(x._id));
    const trending = scored.filter(x => x.growth > 0 || x.old === 0).slice(0, 8).map(x => x.term);

    let suggestions = [];
    for (const term of hot) suggestions.push(templateFor(term));
    for (const term of trending) suggestions.push(templateFor(term));
    for (const c of categories.slice(0, 5)) if (c._id) suggestions.push(`Show me the best ${c._id} products for water monitoring.`);

    const productContext = products.slice(0, 10).map(p => ({ name: p.name, category: p.category, price: p.price, features: p.features, applications: p.applications, specifications: p.specifications }));
    const searchContext = { hot: hot.slice(0, 8), trending: trending.slice(0, 8), categories: categories.map(x => x._id).filter(Boolean).slice(0, 8), topProducts: productContext };

    // Use AI to turn raw search intent into polished questions when the provider is available.
    try {
      const ai = await chat({
        system: `You generate exactly 8 short suggested questions for the Waventra Vetric AI shopping assistant. Use the supplied customer-search and catalogue context. Mix hot searches, trending searches, product discovery, budget, application and technical/specification questions. Do not invent products or specifications. Return ONLY a JSON array of strings. Each question must be natural, useful and different.`,
        user: JSON.stringify(searchContext),
        temperature: 0.7,
        maxTokens: 500,
      });
      const raw = String(ai?.text || "").trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) suggestions = parsed.concat(suggestions);
    } catch (_) {
      // Deterministic catalogue/search fallback below keeps this endpoint useful if AI is unavailable.
    }

    suggestions = unique(suggestions)
      .filter(q => !excludeSet.has(norm(q)))
      .slice(0, 30);

    // If the visitor has already seen most suggestions, rotate the pool deterministically.
    const seed = Math.floor(now / (60 * 60 * 1000));
    suggestions.sort((a,b) => {
      const ha = [...a].reduce((s,c)=>s+c.charCodeAt(0),0) + seed;
      const hb = [...b].reduce((s,c)=>s+c.charCodeAt(0),0) + seed;
      return (ha % 997) - (hb % 997);
    });

    const selected = suggestions.slice(0, 4);
    return res.json({ success: true, suggestions: selected, meta: { hot: hot.slice(0, 5), trending: trending.slice(0, 5), analysedSearches: recent.reduce((n,x)=>n+x.count,0), periodDays: 7 } });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAssistantSuggestions };
