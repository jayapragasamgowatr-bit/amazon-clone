const express = require("express");

const { protect } = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimitMiddleware");
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateProfile,
  changePassword,
} = require("../controllers/accountController");

const router = express.Router();

// Mounted at /api/account
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:id", protect, updateAddress);
router.delete("/addresses/:id", protect, deleteAddress);

router.put("/profile", protect, updateProfile);
router.put(
  "/password",
  protect,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 8, keyPrefix: "change-password", message: "Too many password attempts. Please try again later." }),
  changePassword
);

module.exports = router;
