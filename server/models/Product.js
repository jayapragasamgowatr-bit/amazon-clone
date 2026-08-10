const mongoose = require("mongoose");

// --------------------------------------------------
// REVIEW SCHEMA
// --------------------------------------------------

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
    },
  },
  {
    timestamps: true,
  }
);


// --------------------------------------------------
// PRODUCT SCHEMA
// --------------------------------------------------

const productSchema = new mongoose.Schema(
  {
    // Product name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Product description
    description: {
      type: String,
      required: true,
    },

    // Product price
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Product image
    image: {
      type: String,
      default: "",
    },

    // Product category
    category: {
      type: String,
      default: "",
      trim: true,
    },

    // Stock quantity
    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // --------------------------------------------------
    // PRODUCT RATING
    // --------------------------------------------------

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Number of reviews
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --------------------------------------------------
    // REVIEWS
    // --------------------------------------------------

    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },

  {
    timestamps: true,
  }
);


// --------------------------------------------------
// EXPORT MODEL
// --------------------------------------------------

const Product =
  mongoose.models.Product ||
  mongoose.model(
    "Product",
    productSchema
  );

module.exports = Product;