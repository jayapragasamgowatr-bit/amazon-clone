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

const protect = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// --------------------------------------------------
// PUBLIC ROUTES
// --------------------------------------------------

// Search suggestions
router.get(
  "/suggestions",
  getSuggestions
);

// Get all products
router.get(
  "/",
  getProducts
);

// Get single product
router.get(
  "/:id",
  getProductById
);


// --------------------------------------------------
// ADMIN ROUTES
// --------------------------------------------------

// Create product
router.post(
  "/",
  protect,
  adminMiddleware,
  createProduct
);

// Update product
router.put(
  "/:id",
  protect,
  adminMiddleware,
  updateProduct
);

// Delete product
router.delete(
  "/:id",
  protect,
  adminMiddleware,
  deleteProduct
);

module.exports = router;