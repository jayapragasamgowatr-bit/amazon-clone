const express = require("express");

const { protect, optionalProtect, can } = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimitMiddleware");
const {
  listForProduct,
  askQuestion,
  listForStaff,
  answerQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

const router = express.Router();

// Mounted at /api/questions
router.get("/admin", protect, can("questions.manage"), listForStaff);
router.put("/admin/:id", protect, can("questions.manage"), audit("question.answer", "ProductQuestion"), answerQuestion);
router.delete("/admin/:id", protect, can("questions.manage"), audit("question.delete", "ProductQuestion"), deleteQuestion);

router.get("/product/:productId", optionalProtect, listForProduct);
router.post(
  "/product/:productId",
  protect,
  createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: "ask-question", message: "You've asked a lot of questions. Please try again later." }),
  askQuestion
);

module.exports = router;
