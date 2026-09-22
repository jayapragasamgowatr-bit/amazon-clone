const express = require("express");
const { optionalProtect } = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimitMiddleware");
const { getSupport } = require("../controllers/supportController");
const router = express.Router();
router.post("/", optionalProtect, createRateLimiter({ windowMs: 60000, max: 20, message: "Too many support requests." }), getSupport);
module.exports = router;
