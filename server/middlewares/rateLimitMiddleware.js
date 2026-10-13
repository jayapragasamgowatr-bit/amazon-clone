const buckets = new Map();
const MAX_BUCKETS = 20000;

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const key = `${req.ip || "unknown"}:${req.baseUrl || ""}${req.path || ""}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      if (buckets.size >= MAX_BUCKETS) {
        // Evict one old entry to keep this in-process limiter bounded.
        const firstKey = buckets.keys().next().value;
        if (firstKey) buckets.delete(firstKey);
      }
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;

    if (existing.count > max) {
      const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ success: false, message });
    }

    return next();
  };
};

const cleanupRateLimitBuckets = () => {
  const now = Date.now();
  for (const [key, value] of buckets) {
    if (now >= value.resetAt) buckets.delete(key);
  }
};

setInterval(cleanupRateLimitBuckets, 5 * 60 * 1000).unref();

module.exports = { createRateLimiter };
