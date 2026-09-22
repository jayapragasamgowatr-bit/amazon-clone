const mongoose = require("mongoose");

const inventoryTransactionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT", "ADJUSTMENT"],
      required: true,
      index: true,
    },
    quantityChange: {
      type: Number,
      required: true,
      min: -1000000000,
      max: 1000000000,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      enum: [
        "Order placed",
        "Order cancelled",
        "Order deleted",
        "Manual adjustment",
      ],
      required: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    referenceType: {
      type: String,
      enum: ["Order", "Manual"],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ createdAt: -1 });
inventoryTransactionSchema.index({ product: 1, createdAt: -1 });

const InventoryTransaction =
  mongoose.models.InventoryTransaction ||
  mongoose.model("InventoryTransaction", inventoryTransactionSchema);

module.exports = InventoryTransaction;
