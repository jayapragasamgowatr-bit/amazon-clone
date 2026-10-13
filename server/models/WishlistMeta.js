const mongoose = require("mongoose");

const wishlistMetaSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    addedPrice: { type: Number, required: true, min: 0 },
    addedStock: { type: Number, default: 0, min: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

wishlistMetaSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("WishlistMeta", wishlistMetaSchema);
