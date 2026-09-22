const express = require("express");

const router =
  express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const {
  protect,
} = require("../middlewares/authMiddleware");

// ============================================================
// GET WISHLIST
// GET /api/wishlist
// ============================================================

router.get(
  "/",
  protect,
  getWishlist
);

// ============================================================
// ADD WISHLIST
// POST /api/wishlist
// ============================================================

router.post(
  "/",
  protect,
  addToWishlist
);

// ============================================================
// REMOVE WISHLIST
// DELETE /api/wishlist/:productId
// ============================================================

router.delete(
  "/:productId",
  protect,
  removeFromWishlist
);

module.exports = router;