const express = require("express");
const { protect, optionalProtect, adminOnly } = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimitMiddleware");
const {
  getTrending,
  getPersonalized,
  getSimilar,
  getFrequentlyBought,
  logRecommendation,
  getRecommendationAnalytics,
} = require("../controllers/recommendationController");

const router = express.Router();

router.get("/trending", getTrending);
router.get("/personalized", optionalProtect, getPersonalized);
router.get("/similar/:id", getSimilar);
router.get("/frequently-bought/:id", getFrequentlyBought);
router.post("/events", optionalProtect, createRateLimiter({ windowMs: 60 * 1000, max: 60, message: "Too many recommendation events." }), logRecommendation);
router.get("/admin/analytics", protect, adminOnly, getRecommendationAnalytics);

module.exports = router;
