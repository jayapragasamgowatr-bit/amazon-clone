const express = require("express");

const { protect, can } = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");
const {
  cancelMyOrder,
  requestReturn,
  getReturnPolicy,
  listReturns,
  decideReturn,
} = require("../controllers/orderExtrasController");

const router = express.Router();

// Mounted at /api/orders, before the main order routes.
router.get("/meta/return-policy", getReturnPolicy);
router.get("/admin/returns", protect, can("returns.manage"), listReturns);
router.put("/admin/returns/:id", protect, can("returns.manage"), audit("return.decide", "Order"), decideReturn);
router.post("/:id/cancel", protect, cancelMyOrder);
router.post("/:id/return", protect, requestReturn);

module.exports = router;
