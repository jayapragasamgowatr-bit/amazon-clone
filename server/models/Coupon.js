const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 3, maxlength: 30 },
    description: { type: String, default: "", trim: true, maxlength: 200 },
    // percent: value is 1-100. fixed: value is rupees.
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0, min: 0 },
    // Cap for percentage coupons (0 = no cap).
    maxDiscount: { type: Number, default: 0, min: 0 },
    // 0 = unlimited.
    usageLimit: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
