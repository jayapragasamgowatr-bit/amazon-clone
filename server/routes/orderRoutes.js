const express = require("express");

const router = express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getAdminAnalytics,
  getAdvancedAnalytics,
} = require("../controllers/orderController");


// ============================================================
// MIDDLEWARE
// ============================================================

const {
  protect,
  adminOnly,
} = require("../middlewares/authMiddleware");


// ============================================================
// CREATE ORDER
// POST /api/orders
// ============================================================

router.post(
  "/",
  protect,
  createOrder
);


// ============================================================
// GET MY ORDERS
// GET /api/orders/myorders
// ============================================================

router.get(
  "/myorders",
  protect,
  getMyOrders
);


// ============================================================
// ADMIN GET ALL ORDERS
// GET /api/orders
// ============================================================

router.get(
  "/",
  protect,
  adminOnly,
  getAllOrders
);



// ============================================================
// ADMIN ANALYTICS
// GET /api/orders/admin/analytics
// ============================================================

router.get(
  "/admin/analytics",
  protect,
  adminOnly,
  getAdminAnalytics
);

// ============================================================
// ADVANCED ADMIN ANALYTICS
// GET /api/orders/admin/advanced-analytics
// ============================================================

router.get(
  "/admin/advanced-analytics",
  protect,
  adminOnly,
  getAdvancedAnalytics
);

// ============================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// ============================================================

router.get(
  "/:id",
  protect,
  getOrderById
);


// ============================================================
// ADMIN UPDATE STATUS
// PUT /api/orders/:id/status
// ============================================================

router.put(
  "/:id/status",
  protect,
  adminOnly,
  updateOrderStatus
);


// ============================================================
// ADMIN DELETE
// DELETE /api/orders/:id
// ============================================================

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteOrder
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;