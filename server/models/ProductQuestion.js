const mongoose = require("mongoose");

// Questions customers ask on a product page, answered publicly by staff.
const productQuestionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // First name only is shown publicly.
    askedBy: { type: String, default: "Customer", trim: true, maxlength: 40 },
    question: { type: String, required: true, trim: true, minlength: 8, maxlength: 400 },
    answer: { type: String, default: "", trim: true, maxlength: 1500 },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    answeredAt: { type: Date, default: null },
    // Pending questions are visible only to the person who asked and to staff.
    status: { type: String, enum: ["Pending", "Answered", "Hidden"], default: "Pending", index: true },
  },
  { timestamps: true, versionKey: false }
);

productQuestionSchema.index({ product: 1, status: 1, createdAt: -1 });

module.exports =
  mongoose.models.ProductQuestion || mongoose.model("ProductQuestion", productQuestionSchema);
