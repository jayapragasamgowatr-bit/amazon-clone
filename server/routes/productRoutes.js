const express = require("express");

const router =
  express.Router();

// ============================================================
// CONTROLLER
// ============================================================

const {
  getProducts,
  getAdminProducts,
  updateProductStock,
  getSuggestions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  uploadProductImages: uploadProductImagesController,
} = require("../controllers/productController");
const {
  getInventory,
  getInventoryHistory,
} = require("../controllers/inventoryController");
const { getDemandForecast } = require("../controllers/forecastController");


// ============================================================
// MIDDLEWARE
// ============================================================

const {
  protect,
  can,
} = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");
const { uploadProductImages, validateImageSignature } = require("../middlewares/uploadMiddleware");

// ============================================================
// PUBLIC
// ============================================================

// GET /api/products
router.get(
  "/",
  getProducts
);

// GET /api/products/suggestions
router.get(
  "/suggestions",
  getSuggestions
);

// GET /api/products/admin/list
router.get(
  "/admin/list",
  protect,
  can("products.manage"),
  getAdminProducts
);

// PUT /api/products/admin/:id/stock
router.put(
  "/admin/:id/stock",
  protect,
  can("inventory.manage"),
  audit("inventory.adjust", "Product"),
  updateProductStock
);

// GET /api/products/admin/demand-forecast
router.get(
  "/admin/demand-forecast",
  protect,
  can("analytics.view"),
  getDemandForecast
);

// GET /api/products/admin/inventory
router.get(
  "/admin/inventory",
  protect,
  can("inventory.manage"),
  getInventory
);

// GET /api/products/admin/inventory/history
router.get(
  "/admin/inventory/history",
  protect,
  can("inventory.manage"),
  getInventoryHistory
);

// POST /api/products/:id/images
// Upload multiple product images to Cloudinary.
router.post(
  "/:id/images",
  protect,
  can("products.manage"),
  audit("product.images", "Product"),
  uploadProductImages,
  validateImageSignature,
  uploadProductImagesController
);

// GET /api/products/:id
router.get(
  "/:id",
  getProductById
);

// ============================================================
// ADMIN
// ============================================================

// POST /api/products
router.post(
  "/",
  protect,
  can("products.manage"),
  audit("product.create", "Product"),
  createProduct
);

// PUT /api/products/:id
router.put(
  "/:id",
  protect,
  can("products.manage"),
  audit("product.update", "Product"),
  updateProduct
);

// DELETE /api/products/:id
router.delete(
  "/:id",
  protect,
  can("products.manage"),
  audit("product.delete", "Product"),
  deleteProduct
);

// ============================================================
// REVIEWS
// ============================================================

// POST /api/products/:id/reviews
router.post(
  "/:id/reviews",
  protect,
  createProductReview
);

// PUT /api/products/:id/reviews/:reviewId
router.put(
  "/:id/reviews/:reviewId",
  protect,
  can("products.manage"),
  audit("review.update", "Product"),
  updateProductReview
);

// DELETE /api/products/:id/reviews/:reviewId
router.delete(
  "/:id/reviews/:reviewId",
  protect,
  can("products.manage"),
  audit("review.delete", "Product"),
  deleteProductReview
);

// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;