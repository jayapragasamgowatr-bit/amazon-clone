const buckets = new Map();

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now >= existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;

    if (existing.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    return next();
  };
};

const cleanupRateLimitBuckets = () => {
  const now = Date.now();

  for (const [key, value] of buckets) {
    if (now >= value.resetAt) {
      buckets.delete(key);
    }
  }
};

setInterval(cleanupRateLimitBuckets, 10 * 60 * 1000).unref();

module.exports = { createRateLimiter };
