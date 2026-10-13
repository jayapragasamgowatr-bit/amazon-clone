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
      name: { type: String, default: "", trim: true, maxlength: 100 },
      email: { type: String, default: "", trim: true, lowercase: true, maxlength: 254 },
      phone: { type: String, default: "", trim: true, maxlength: 20 },
      address: { type: String, required: true, trim: true, maxlength: 500 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      state: { type: String, required: true, trim: true, maxlength: 100 },
      postalCode: { type: String, default: "", trim: true, maxlength: 10 },
      pincode: { type: String, required: true, trim: true, maxlength: 10 },
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

    totalPrice: {
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
        "COD",
        "Cash",
        "Manual",
      ],

      default: "Pending",
    },

    stockReserved: {
      type: Boolean,
      default: false,
    },

    stockRestored: {
      type: Boolean,
      default: false,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    statusHistory: {
      type: [{
        status: { type: String, trim: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true, maxlength: 500 },
      }],
      default: [],
    },

    shipment: {
      carrier: { type: String, default: "", trim: true, maxlength: 100 },
      trackingNumber: { type: String, default: "", trim: true, maxlength: 150 },
      trackingUrl: { type: String, default: "", trim: true, maxlength: 500 },
      currentLocation: { type: String, default: "", trim: true, maxlength: 200 },
      packageWeight: { type: String, default: "", trim: true, maxlength: 50 },
      shippingStatus: { type: String, default: "Pending", trim: true, maxlength: 80 },
      notes: { type: String, default: "", trim: true, maxlength: 1000 },
      estimatedDeliveryAt: { type: Date, default: null },
      shippedAt: { type: Date, default: null },
      lastUpdatedAt: { type: Date, default: null },
    },

    shipmentUpdates: {
      type: [{
        status: { type: String, trim: true, maxlength: 80 },
        location: { type: String, trim: true, maxlength: 200 },
        note: { type: String, trim: true, maxlength: 1000 },
        updatedAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
  },

  {
    timestamps: true,
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "shipment.trackingNumber": 1 });

// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.model(
    "Order",
    orderSchema
  );