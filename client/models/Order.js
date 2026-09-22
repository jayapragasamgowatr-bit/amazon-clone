const mongoose = require("mongoose");

// ============================================================
// ORDER ITEM SCHEMA
// ============================================================

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// ORDER SCHEMA
// ============================================================

const orderSchema = new mongoose.Schema(
  {
    // --------------------------------------------------------
    // LOGGED-IN USER
    // --------------------------------------------------------

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --------------------------------------------------------
    // CUSTOMER DETAILS
    //
    // IMPORTANT:
    // This email is the email entered on checkout.
    // It does NOT need to match the login email.
    // --------------------------------------------------------

    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // --------------------------------------------------------
    // SHIPPING ADDRESS
    // --------------------------------------------------------

    shippingAddress: {
      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      pincode: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // --------------------------------------------------------
    // ORDER ITEMS
    // --------------------------------------------------------

    items: {
      type: [orderItemSchema],

      required: true,

      validate: {
        validator: function (items) {
          return (
            Array.isArray(items) &&
            items.length > 0
          );
        },

        message:
          "Order must contain at least one item",
      },
    },

    // --------------------------------------------------------
    // PRICING
    // --------------------------------------------------------

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // --------------------------------------------------------
    // ORDER STATUS
    // --------------------------------------------------------

    status: {
      type: String,

      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],

      default: "Pending",
    },

    // --------------------------------------------------------
    // PAYMENT STATUS
    // --------------------------------------------------------

    paymentStatus: {
      type: String,

      enum: [
        "Pending",
        "Paid",
        "Failed",
      ],

      default: "Pending",
    },

    // --------------------------------------------------------
    // PAYMENT METHOD
    // --------------------------------------------------------

    paymentMethod: {
      type: String,

      enum: [
        "Pending",
        "Razorpay",
        "Cash",
        "Manual",
      ],

      default: "Pending",
    },
  },

  {
    timestamps: true,
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.model(
    "Order",
    orderSchema
  );