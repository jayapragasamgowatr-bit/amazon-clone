const Order = require("../models/Order");


// CREATE ORDER
const createOrder = async (
  req,
  res,
  next
) => {
  try {
    const {
      orderItems,
      shippingAddress,
      totalPrice,
    } = req.body;

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      totalPrice,
    });

    res.status(201).json(order);

  } catch (error) {
    next(error);
  }
};


// USER ORDERS
const getMyOrders = async (
  req,
  res,
  next
) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    });

    res.json(orders);

  } catch (error) {
    next(error);
  }
};


// ADMIN ALL ORDERS
const getAllOrders = async (
  req,
  res,
  next
) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email");

    res.json(orders);

  } catch (error) {
    next(error);
  }
};


// UPDATE ORDER STATUS
const updateOrderStatus = async (
  req,
  res,
  next
) => {
  try {
    const { status } = req.body;

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      res.status(404);
      throw new Error(
        "Order not found"
      );
    }

    order.orderStatus = status;

    await order.save();

    res.json({
      message:
        "Order status updated",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};