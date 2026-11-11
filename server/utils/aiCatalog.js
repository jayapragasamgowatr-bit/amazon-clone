// ============================================================
// AI CATALOG HELPERS
// ============================================================
// Pure helpers shared by the AI endpoints: text cleaning, query
// parsing, product scoring and a small in-memory TTL cache.
// Nothing in this file talks to the database or the AI provider,
// so it can be unit-tested on its own.
// ============================================================

const STOP_WORDS = new Set([
  "a", "an", "and", "any", "are", "available", "best", "below", "between",
  "buy", "can", "cheap", "do", "does", "find", "for", "from", "get", "give",
  "good", "has", "have", "help", "how", "i", "in", "inr", "is", "it", "less",
  "looking", "me", "more", "my", "need", "of", "on", "or", "over", "please",
  "price", "product", "products", "recommend", "rs", "rupees", "show",
  "some", "something", "stock", "suggest", "than", "that", "the", "to",
  "under", "upto", "up", "want", "what", "which", "with", "within", "you",
  "above", "around", "about", "budget",
]);

const clean = (value, max = 500) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tokenize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .split(/\s+/)
    .map((word) => word.replace(/^[.-]+|[.-]+$/g, ""))
    .filter(Boolean);

const keywordsFrom = (value, limit = 8) => [
  ...new Set(
    tokenize(value).filter(
      (word) => word.length > 1 && !STOP_WORDS.has(word) && !/^\d+k?$/.test(word)
    )
  ),
].slice(0, limit);

// "20,000" -> 20000, "20k" -> 20000, "1.5 lakh" -> 150000
const parseAmount = (raw, unit = "") => {
  const number = Number(String(raw || "").replace(/,/g, ""));
  if (!Number.isFinite(number) || number < 0) return null;
  const u = String(unit || "").toLowerCase();
  if (u === "k") return Math.round(number * 1000);
  if (u.startsWith("lakh") || u === "lac" || u === "l") return Math.round(number * 100000);
  return Math.round(number);
};

const AMOUNT = "(?:₹|rs\\.?|inr)?\\s*([\\d,]+(?:\\.\\d+)?)\\s*(k|lakhs?|lac)?";

// Deterministic fallback used when the AI provider is unavailable.
const parseSearchQuery = (query) => {
  const text = clean(query, 200);
  const lower = text.toLowerCase();
  let minPrice = null;
  let maxPrice = null;

  const between = lower.match(new RegExp(`between\\s*${AMOUNT}\\s*(?:and|to|-)\\s*${AMOUNT}`, "i"));
  if (between) {
    const a = parseAmount(between[1], between[2]);
    const b = parseAmount(between[3], between[4]);
    if (a !== null && b !== null) {
      minPrice = Math.min(a, b);
      maxPrice = Math.max(a, b);
    }
  } else {
    const max = lower.match(new RegExp(`(?:under|below|less than|upto|up to|within|max(?:imum)?)\\s*${AMOUNT}`, "i"));
    const min = lower.match(new RegExp(`(?:above|over|more than|at least|min(?:imum)?)\\s*${AMOUNT}`, "i"));
    if (max) maxPrice = parseAmount(max[1], max[2]);
    if (min) minPrice = parseAmount(min[1], min[2]);
  }

  let sort = "relevance";
  if (/cheapest|lowest price|low to high/.test(lower)) sort = "price_asc";
  else if (/most expensive|premium|high to low/.test(lower)) sort = "price_desc";
  else if (/top rated|best rated|highest rated/.test(lower)) sort = "rating";

  return {
    keywords: keywordsFrom(text),
    category: "",
    minPrice,
    maxPrice,
    inStockOnly: /in stock|available now|ready to ship/.test(lower),
    sort,
  };
};

// Validate / normalise whatever the model returned for a search plan.
const normalizeSearchPlan = (plan, categories = []) => {
  const source = plan && typeof plan === "object" ? plan : {};
  const number = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  };
  const category = clean(source.category, 100);
  const knownCategory = categories.find(
    (item) => item.toLowerCase() === category.toLowerCase()
  );
  const sort = ["relevance", "price_asc", "price_desc", "rating"].includes(source.sort)
    ? source.sort
    : "relevance";

  let minPrice = number(source.minPrice);
  let maxPrice = number(source.maxPrice);
  if (maxPrice === 0) maxPrice = null;
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return {
    keywords: Array.isArray(source.keywords)
      ? [...new Set(source.keywords.flatMap((k) => tokenize(k)))]
          .filter((word) => word.length > 1)
          .slice(0, 10)
      : [],
    category: knownCategory || "",
    minPrice,
    maxPrice,
    inStockOnly: source.inStockOnly === true,
    sort,
  };
};

const specText = (specifications) => {
  if (!specifications || typeof specifications !== "object") return "";
  try {
    return Object.entries(specifications)
      .map(([key, value]) => `${key} ${typeof value === "object" ? JSON.stringify(value) : value}`)
      .join(" ");
  } catch {
    return "";
  }
};

// Relevance score for one product against a list of keywords.
const scoreProduct = (product, keywords = [], category = "") => {
  const name = String(product?.name || "").toLowerCase();
  const cat = String(product?.category || "").toLowerCase();
  const tags = [
    ...(Array.isArray(product?.features) ? product.features : []),
    ...(Array.isArray(product?.applications) ? product.applications : []),
  ]
    .join(" ")
    .toLowerCase();
  const specs = specText(product?.specifications).toLowerCase();
  const description = String(product?.description || "").toLowerCase();

  let score = 0;
  for (const word of keywords) {
    if (name.includes(word)) score += 6;
    if (cat.includes(word)) score += 4;
    if (tags.includes(word)) score += 3;
    if (specs.includes(word)) score += 2;
    if (description.includes(word)) score += 1;
  }
  if (category && cat === category.toLowerCase()) score += 5;
  return score;
};

const sortProducts = (products, sort) => {
  const list = [...products];
  if (sort === "price_asc") return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  if (sort === "price_desc") return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  if (sort === "rating") {
    return list.sort(
      (a, b) =>
        Number(b.rating || 0) - Number(a.rating || 0) ||
        Number(b.numReviews || 0) - Number(a.numReviews || 0)
    );
  }
  return list.sort(
    (a, b) =>
      Number(b.relevance || 0) - Number(a.relevance || 0) ||
      Number(b.rating || 0) - Number(a.rating || 0)
  );
};

// Compact, token-friendly view of a product for prompts.
const toPromptProduct = (product, { descriptionLength = 400 } = {}) => ({
  id: String(product._id),
  name: product.name,
  category: product.category || "",
  price: product.price,
  stock: product.countInStock,
  rating: product.rating,
  reviews: product.numReviews,
  features: (product.features || []).slice(0, 12),
  applications: (product.applications || []).slice(0, 12),
  specifications: product.specifications || {},
  description: String(product.description || "").slice(0, descriptionLength),
});

// What the browser needs to draw a product card.
const toCard = (product) => ({
  _id: String(product._id),
  name: product.name,
  category: product.category || "",
  price: product.price,
  image: product.image || "",
  images: Array.isArray(product.images) ? product.images.slice(0, 1) : [],
  countInStock: product.countInStock,
  rating: product.rating,
  numReviews: product.numReviews,
});

const sanitizeHistory = (history, { turns = 8, length = 600 } = {}) =>
  (Array.isArray(history) ? history : [])
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof (item.text ?? item.content) === "string"
    )
    .slice(-turns)
    .map((item) => ({
      role: item.role,
      text: String(item.text ?? item.content).trim().slice(0, length),
    }))
    .filter((item) => item.text);

// ------------------------------------------------------------
// Small in-memory TTL cache (bounded). Good enough for a single
// server process; swap for Redis if you scale to several instances.
// ------------------------------------------------------------
const createCache = ({ ttlMs = 10 * 60 * 1000, maxEntries = 500 } = {}) => {
  const store = new Map();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() >= entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      if (store.size >= maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest !== undefined) store.delete(oldest);
      }
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    },
    get size() {
      return store.size;
    },
  };
};

module.exports = {
  clean,
  escapeRegex,
  tokenize,
  keywordsFrom,
  parseAmount,
  parseSearchQuery,
  normalizeSearchPlan,
  scoreProduct,
  sortProducts,
  toPromptProduct,
  toCard,
  sanitizeHistory,
  createCache,
};
