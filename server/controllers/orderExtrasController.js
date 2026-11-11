const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const InventoryTransaction = require("../models/InventoryTransaction");
const Coupon = require("../models/Coupon");
const {
  RETURN_REASONS,
  getReturnWindowDays,
  canCustomerCancel,
  canRequestReturn,
  canDecideReturn,
  returnDeadline,
} = require("../utils/returnRules");

const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

const fail = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ------------------------------------------------------------
// POST /api/orders/:id/cancel      (the customer's own order)
// Allowed while the order is Pending or Confirmed. Stock goes
// back in the same transaction, the same way an admin cancel works.
// ------------------------------------------------------------
const cancelMyOrder = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid order id." });
  }

  const reason = text(req.body?.reason, 300) || "Cancelled by customer";
  const session = await mongoose.startSession();

  try {
    let cancelled = null;

    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).session(session);
      if (!order) throw fail(404, "Order not found.");
      if (order.status === "Cancelled") throw fail(409, "This order is already cancelled.");
      if (!canCustomerCancel(order)) {
        throw fail(
          400,
          "This order is already being prepared, so it can't be cancelled online. Please contact support."
        );
      }

      // Guard on the status we just read so a simultaneous admin update cannot be overwritten.
      const updated = await Order.findOneAndUpdate(
        { _id: order._id, status: order.status, stockRestored: { $ne: true } },
        {
          $set: {
            status: "Cancelled",
            stockReserved: false,
            stockRestored: true,
            cancelledAt: new Date(),
            cancellationReason: reason,
          },
          $push: {
            statusHistory: { status: "Cancelled", changedAt: new Date(), note: `Customer: ${reason}` },
          },
        },
        { returnDocument: "after", session }
      );
      if (!updated) throw fail(409, "This order was just updated. Please refresh and try again.");

      for (const item of order.items) {
        const product = await Product.findOneAndUpdate(
          { _id: item.product },
          { $inc: { countInStock: item.quantity } },
          { returnDocument: "after", session }
        );
        if (product) {
          await InventoryTransaction.create(
            [
              {
                product: item.product,
                type: "IN",
                quantityChange: Number(item.quantity),
                previousStock: Math.max(0, Number(product.countInStock) - Number(item.quantity)),
                newStock: Number(product.countInStock),
                reason: "Order cancelled",
                referenceType: "Order",
                referenceId: order._id,
                performedBy: req.user._id,
              },
            ],
            { session }
          );
        }
      }

      // Give the coupon use back so the code is not burned by a cancelled order.
      if (order.coupon?.code) {
        await Coupon.updateOne(
          { code: order.coupon.code, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } },
          { session }
        );
      }

      cancelled = updated;
    });

    res.json({ success: true, message: "Your order has been cancelled.", order: cancelled });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

// ------------------------------------------------------------
// POST /api/orders/:id/return   { reason, details }
// ------------------------------------------------------------
const requestReturn = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid order id." });
    }

    const reason = text(req.body?.reason, 100);
    const details = text(req.body?.details, 1000);
    if (!RETURN_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: "Choose a reason for the return." });
    }

    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    const check = canRequestReturn(order);
    if (!check.ok) return res.status(400).json({ success: false, message: check.message });

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, "returnRequest.status": { $in: ["None", null] } },
      {
        $set: {
          returnRequest: {
            status: "Requested",
            reason,
            details,
            requestedAt: new Date(),
            decidedAt: null,
            decidedBy: null,
            adminNote: "",
          },
        },
        $push: {
          statusHistory: { status: "Return requested", changedAt: new Date(), note: reason },
        },
      },
      { returnDocument: "after" }
    );
    if (!updated) {
      return res.status(409).json({ success: false, message: "A return has already been requested for this order." });
    }

    res.status(201).json({
      success: true,
      message: "Your return request has been sent. We'll review it and get back to you.",
      order: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------
// GET /api/orders/meta/return-policy
// ------------------------------------------------------------
const getReturnPolicy = (req, res) => {
  res.json({ success: true, windowDays: getReturnWindowDays(), reasons: RETURN_REASONS });
};

// ------------------------------------------------------------
// GET /api/orders/admin/returns?status=Requested
// ------------------------------------------------------------
const listReturns = async (req, res, next) => {
  try {
    const status = text(String(req.query.status || ""), 20);
    const filter = {
      "returnRequest.status": ["Requested", "Approved", "Rejected", "Refunded"].includes(status)
        ? status
        : { $in: ["Requested", "Approved", "Rejected", "Refunded"] },
    };

    const [orders, counts] = await Promise.all([
      Order.find(filter)
        .sort({ "returnRequest.requestedAt": -1 })
        .limit(200)
        .select("_id customer items totalPrice status deliveredAt createdAt returnRequest paymentMethod")
        .lean(),
      Order.aggregate([
        { $match: { "returnRequest.status": { $in: ["Requested", "Approved", "Rejected", "Refunded"] } } },
        { $group: { _id: "$returnRequest.status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      counts: Object.fromEntries(counts.map((row) => [row._id, row.count])),
      returns: orders.map((order) => ({ ...order, returnDeadline: returnDeadline(order) })),
    });
  } catch (error) {
    next(error);
  }
};

// ------------------------------------------------------------
// PUT /api/orders/admin/returns/:id   { decision, note }
// Requested -> Approved | Rejected,  Approved -> Refunded
// ------------------------------------------------------------
const decideReturn = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid order id." });
    }

    const decision = text(req.body?.decision, 20);
    const note = text(req.body?.note, 500);

    const order = await Order.findById(req.params.id).select("returnRequest");
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    const current = order.returnRequest?.status || "None";
    if (!canDecideReturn(current, decision)) {
      return res.status(400).json({
        success: false,
        message: `A return that is "${current}" cannot be marked "${decision || "?"}".`,
      });
    }
    if (decision === "Rejected" && !note) {
      return res.status(400).json({ success: false, message: "Add a note explaining why the return was rejected." });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, "returnRequest.status": current },
      {
        $set: {
          "returnRequest.status": decision,
          "returnRequest.decidedAt": new Date(),
          "returnRequest.decidedBy": req.user._id,
          "returnRequest.adminNote": note,
        },
        $push: {
          statusHistory: { status: `Return ${decision.toLowerCase()}`, changedAt: new Date(), note },
        },
      },
      { returnDocument: "after" }
    );
    if (!updated) {
      return res.status(409).json({ success: false, message: "This return was just updated by someone else." });
    }

    res.locals.activitySummary = `Return ${decision.toLowerCase()} for order ${String(order._id).slice(-8)}`;
    res.json({ success: true, message: `Return marked ${decision.toLowerCase()}.`, order: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { cancelMyOrder, requestReturn, getReturnPolicy, listReturns, decideReturn };
