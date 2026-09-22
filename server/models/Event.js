const mongoose = require("mongoose");

const EVENT_NAMES = [
  "page_view",
  "product_view",
  "search",
  "wishlist_add",
  "wishlist_remove",
  "cart_add",
  "cart_remove",
  "checkout_started",
  "checkout_completed",
  "order_created",
  "recommendation_impression",
  "recommendation_click",
];

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      enum: EVENT_NAMES,
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    searchTerm: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    path: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true, versionKey: false }
);

eventSchema.index({ createdAt: -1, eventName: 1 });
eventSchema.index({ product: 1, eventName: 1, createdAt: -1 });

eventSchema.statics.EVENT_NAMES = EVENT_NAMES;

module.exports = mongoose.model("Event", eventSchema);
