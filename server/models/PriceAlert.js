const mongoose = require("mongoose");

const priceAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    targetPrice: { type: Number, required: true, min: 0 },
    createdPrice: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

priceAlertSchema.index({ user: 1, product: 1, active: 1 });

module.exports = mongoose.model("PriceAlert", priceAlertSchema);
