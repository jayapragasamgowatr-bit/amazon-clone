const crypto = require("crypto");

const securityHeaders = (req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = String(requestId).slice(0, 100);
  res.setHeader("X-Request-ID", req.requestId);

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("X-DNS-Prefetch-Control", "off");

  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store");
  }

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
};

module.exports = { securityHeaders };
