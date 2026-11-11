const express = require("express");

const {
  optionalProtect,
  protect,
  can,
} = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimitMiddleware");

const {
  getAiStatus,
  postChat,
  getSmartSearch,
  getReviewSummary,
  postAskProduct,
  postCompare,
  postProductCopy,
} = require("../controllers/aiStudioController");

const router = express.Router();

// One shared budget per visitor across every AI tool below,
// so the AI bill cannot be run up by hopping between endpoints.
const aiBudget = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  keyPrefix: "ai-studio",
  message: "You're using the AI tools very quickly. Please wait a minute and try again.",
});

const limit = (max, name) =>
  createRateLimiter({
    windowMs: 60 * 1000,
    max,
    keyPrefix: `ai-studio:${name}`,
    message: "Too many AI requests. Please wait a minute and try again.",
  });

// Public
router.get("/status", getAiStatus);
router.post("/chat", aiBudget, limit(20, "chat"), optionalProtect, postChat);
router.get("/smart-search", aiBudget, limit(30, "search"), optionalProtect, getSmartSearch);
router.get("/products/:id/review-summary", aiBudget, limit(30, "reviews"), getReviewSummary);
router.post("/products/:id/ask", aiBudget, limit(15, "ask"), postAskProduct);
router.post("/compare", aiBudget, limit(10, "compare"), postCompare);

// Admin
router.post("/admin/product-copy", protect, can("products.manage"), limit(20, "copy"), postProductCopy);

module.exports = router;
