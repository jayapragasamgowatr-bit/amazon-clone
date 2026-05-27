const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getWishlist,
  toggleWishlist,
} = require("../controllers/userController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.post(
  "/signup",
  signup
);

router.post(
  "/login",
  login
);

router.get(
  "/wishlist",
  protect,
  getWishlist
);

router.post(
  "/wishlist",
  protect,
  toggleWishlist
);

module.exports = router;