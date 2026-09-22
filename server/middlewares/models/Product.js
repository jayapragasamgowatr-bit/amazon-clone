const mongoose = require("mongoose");

// ============================================================
// REVIEW SCHEMA
// ============================================================

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// PRODUCT SCHEMA
// ============================================================

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    features: {
      type: [String],
      default: [],
    },

    applications: {
      type: [String],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// MODEL
// ============================================================

const Product =
  mongoose.models.Product ||
  mongoose.model(
    "Product",
    productSchema
  );

module.exports = Product;

productSchema.index({ name: 1 });
productSchema.index({ createdAt: -1 });
