const express = require("express");
const { createRateLimiter } = require("../middlewares/rateLimitMiddleware");
const { protect, optionalProtect, can } = require("../middlewares/authMiddleware");
const { createEvent, getEventAnalytics } = require("../controllers/eventController");

const router = express.Router();

router.post(
  "/",
  optionalProtect,
  createRateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    message: "Too many tracking events. Please try again later.",
  }),
  createEvent
);

router.get("/admin/analytics", protect, can("analytics.view"), getEventAnalytics);

module.exports = router;
