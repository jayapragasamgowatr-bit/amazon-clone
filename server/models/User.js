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

      enum: [
        "user",
        "admin",
      ],

      default: "user",
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