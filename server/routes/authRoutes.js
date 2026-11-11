const express = require("express");

const router = express.Router();

// ============================================================
// CONTROLLERS
// ============================================================

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
  getMe,
} = require("../controllers/authController");

// ============================================================
// MIDDLEWARE
// ============================================================

const {
  protect,
  adminOnly,
  can,
} = require("../middlewares/authMiddleware");
const { audit } = require("../middlewares/auditMiddleware");

// ============================================================
// PUBLIC
// ============================================================

router.post(
  "/register",
  registerUser
);

router.post(
  "/login",
  loginUser
);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPassword
);



// ============================================================
// CURRENT USER
// GET /api/auth/me
// ============================================================

router.get(
  "/me",
  protect,
  getMe
);

// ============================================================
// ADMIN USERS
// ============================================================

router.get(
  "/users",
  protect,
  can("customers.view"),
  getUsers
);

router.get(
  "/users/:id",
  protect,
  can("customers.view"),
  getUserById
);

router.put(
  "/users/:id",
  protect,
  adminOnly,
  audit("user.update", "User"),
  updateUser
);

router.put(
  "/users/:id/role",
  protect,
  adminOnly,
  audit("user.role", "User"),
  updateUserRole
);

router.delete(
  "/users/:id",
  protect,
  adminOnly,
  audit("user.delete", "User"),
  deleteUser
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;