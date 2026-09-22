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
  adminOnly,
} = require("../middlewares/authMiddleware");

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
  adminOnly,
  getAdminProducts
);

// PUT /api/products/admin/:id/stock
router.put(
  "/admin/:id/stock",
  protect,
  adminOnly,
  updateProductStock
);

// GET /api/products/admin/demand-forecast
router.get(
  "/admin/demand-forecast",
  protect,
  adminOnly,
  getDemandForecast
);

// GET /api/products/admin/inventory
router.get(
  "/admin/inventory",
  protect,
  adminOnly,
  getInventory
);

// GET /api/products/admin/inventory/history
router.get(
  "/admin/inventory/history",
  protect,
  adminOnly,
  getInventoryHistory
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
  adminOnly,
  createProduct
);

// PUT /api/products/:id
router.put(
  "/:id",
  protect,
  adminOnly,
  updateProduct
);

// DELETE /api/products/:id
router.delete(
  "/:id",
  protect,
  adminOnly,
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
  adminOnly,
  updateProductReview
);

// DELETE /api/products/:id/reviews/:reviewId
router.delete(
  "/:id/reviews/:reviewId",
  protect,
  adminOnly,
  deleteProductReview
);

// ============================================================
// EXPORT
// ============================================================

module.exports =
  router;