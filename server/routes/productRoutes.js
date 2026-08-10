const express = require("express");

const router = express.Router();

const {
  getProducts,
  getSuggestions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const {
  createProductReview,
  updateProductReview,
  deleteProductReview,
} = require("../controllers/reviewController");

const protect = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// --------------------------------------------------
// PUBLIC PRODUCT ROUTES
// --------------------------------------------------

router.get("/suggestions", getSuggestions);

router.get("/", getProducts);

router.get("/:id", getProductById);


// --------------------------------------------------
// USER REVIEW
// Logged-in users can add reviews
// --------------------------------------------------

router.post(
  "/:id/reviews",
  protect,
  createProductReview
);


// --------------------------------------------------
// ADMIN REVIEW MANAGEMENT
// --------------------------------------------------

// Admin edit review
router.put(
  "/:id/reviews/:reviewId",
  protect,
  adminMiddleware,
  updateProductReview
);

// Admin delete review
router.delete(
  "/:id/reviews/:reviewId",
  protect,
  adminMiddleware,
  deleteProductReview
);


// --------------------------------------------------
// ADMIN PRODUCT MANAGEMENT
// --------------------------------------------------

router.post(
  "/",
  protect,
  adminMiddleware,
  createProduct
);

router.put(
  "/:id",
  protect,
  adminMiddleware,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  adminMiddleware,
  deleteProduct
);

module.exports = router;