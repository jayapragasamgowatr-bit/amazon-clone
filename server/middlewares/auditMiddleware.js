const AdminActivity = require("../models/AdminActivity");

// ============================================================
// ADMIN ACTIVITY LOG
// ============================================================
// audit("product.update", "Product") records the action once the
// request has finished successfully. It never blocks or fails the
// request itself.
// ============================================================

const SENSITIVE_KEYS = /password|token|secret|image|images|subscription/i;

// Keep a small, safe snapshot of what was sent (no passwords, no base64 images).
const summariseBody = (body) => {
  if (!body || typeof body !== "object") return {};
  const result = {};
  for (const [key, value] of Object.entries(body).slice(0, 20)) {
    if (SENSITIVE_KEYS.test(key)) continue;
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      result[key] = typeof value === "string" ? value.slice(0, 120) : value;
    }
  }
  return result;
};

const recordActivity = (req, { action, targetType = "", targetId = "", summary = "", metadata = {} }) => {
  if (!req.user?._id || !action) return Promise.resolve(null);

  return AdminActivity.create({
    actor: req.user._id,
    actorName: req.user.name || "",
    actorRole: req.user.role || "",
    action,
    targetType,
    targetId: String(targetId || "").slice(0, 60),
    summary: String(summary || "").slice(0, 300),
    metadata,
    ip: String(req.ip || "").slice(0, 60),
  }).catch((error) => {
    console.warn("ACTIVITY LOG ERROR:", error?.message || error);
    return null;
  });
};

const audit = (action, targetType = "") => (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;
    recordActivity(req, {
      action,
      targetType,
      targetId: req.params?.id || req.params?.userId || "",
      summary: res.locals?.activitySummary || "",
      metadata: { method: req.method, path: req.originalUrl?.split("?")[0], body: summariseBody(req.body) },
    });
  });
  next();
};

module.exports = { audit, recordActivity, summariseBody };
