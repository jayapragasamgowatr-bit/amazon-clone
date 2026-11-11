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
  getAdminShippingOrders,
  updateShippingDetails,
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
  can,
} = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");


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
  can("orders.view"),
  getAllOrders
);



// ============================================================
// ADMIN ANALYTICS
// GET /api/orders/admin/analytics
// ============================================================

router.get(
  "/admin/analytics",
  protect,
  can("analytics.view"),
  getAdminAnalytics
);

// ============================================================
// ADVANCED ADMIN ANALYTICS
// GET /api/orders/admin/advanced-analytics
// ============================================================

router.get(
  "/admin/advanced-analytics",
  protect,
  can("analytics.view"),
  getAdvancedAnalytics
);

// ============================================================
// ADMIN SHIPPING MANAGEMENT
// ============================================================
router.get(
  "/admin/shipping",
  protect,
  can("orders.view"),
  getAdminShippingOrders
);

router.put(
  "/admin/shipping/:id",
  protect,
  can("orders.manage"),
  audit("order.shipping", "Order"),
  updateShippingDetails
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
  can("orders.manage"),
  audit("order.status", "Order"),
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
  audit("order.delete", "Order"),
  deleteOrder
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;