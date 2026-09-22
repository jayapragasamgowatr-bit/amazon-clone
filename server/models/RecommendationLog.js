const mongoose = require("mongoose");

const recommendationLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    sessionId: { type: String, required: true, trim: true, maxlength: 80, index: true },
    source: { type: String, enum: ["personalized", "trending", "similar", "frequently_bought"], required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    position: { type: Number, min: 0, max: 100, default: 0 },
    action: { type: String, enum: ["impression", "click"], required: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

recommendationLogSchema.index({ createdAt: -1, source: 1, action: 1 });

module.exports = mongoose.model("RecommendationLog", recommendationLogSchema);
