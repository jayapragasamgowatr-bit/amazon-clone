const mongoose = require("mongoose");

// ============================================================
// USER SCHEMA
// ============================================================

const userSchema = new mongoose.Schema(
  {
    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    name: {
      type: String,

      required: true,

      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    email: {
      type: String,

      required: true,

      unique: true,

      index: true,

      lowercase: true,

      trim: true,
      maxlength: 254,
    },

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    password: {
      type: String,

      required: true,
    },

    // --------------------------------------------------------
    // PASSWORD RESET
    // --------------------------------------------------------

    resetPasswordToken: {
      type: String,
      default: null,
      index: true,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    role: {
      type: String,

      // Staff roles are described in utils/permissions.js
      enum: [
        "user",
        "support",
        "inventory",
        "manager",
        "admin",
      ],

      default: "user",
      index: true,
    },

    // --------------------------------------------------------
    // ACCOUNT SUSPENSION
    // --------------------------------------------------------

    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },

    blockedAt: {
      type: Date,
      default: null,
    },

    blockedReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    // --------------------------------------------------------
    // SAVED ADDRESSES
    // --------------------------------------------------------

    addresses: {
      type: [
        new mongoose.Schema(
          {
            label: { type: String, default: "Home", trim: true, maxlength: 40 },
            name: { type: String, required: true, trim: true, maxlength: 100 },
            phone: { type: String, required: true, trim: true, maxlength: 20 },
            address: { type: String, required: true, trim: true, maxlength: 500 },
            city: { type: String, required: true, trim: true, maxlength: 100 },
            state: { type: String, required: true, trim: true, maxlength: 100 },
            postalCode: { type: String, required: true, trim: true, maxlength: 10 },
            isDefault: { type: Boolean, default: false },
          },
          { timestamps: true }
        ),
      ],
      default: [],
    },

    // --------------------------------------------------------
    // ADMIN FLAG
    // --------------------------------------------------------

    isAdmin: {
      type: Boolean,

      default: false,
    },

    // --------------------------------------------------------
    // WISHLIST
    // --------------------------------------------------------

    wishlist: [
      {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Product",
      },
    ],

    pushSubscriptions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
    },
  },

  {
    timestamps: true,
  }
);

// ============================================================
// MODEL
// ============================================================

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );

module.exports = User;