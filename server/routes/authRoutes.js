const express = require("express");

const router = express.Router();

// ============================================================
// CONTROLLERS
// ============================================================

const {
  registerUser,
  loginUser,
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
} = require("../middlewares/authMiddleware");

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
  adminOnly,
  getUsers
);

router.get(
  "/users/:id",
  protect,
  adminOnly,
  getUserById
);

router.put(
  "/users/:id",
  protect,
  adminOnly,
  updateUser
);

router.put(
  "/users/:id/role",
  protect,
  adminOnly,
  updateUserRole
);

router.delete(
  "/users/:id",
  protect,
  adminOnly,
  deleteUser
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;