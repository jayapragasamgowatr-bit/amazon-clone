const express = require("express");
const router = express.Router();

const protect =
  require("../middlewares/authMiddleware");

const {
  createOrder,
  getMyOrders,
  getAllOrders,
} = require(
  "../controllers/orderController"
);

router.post("/", protect, createOrder);

router.get("/my", protect, getMyOrders);

router.get("/", protect, getAllOrders);

module.exports = router;