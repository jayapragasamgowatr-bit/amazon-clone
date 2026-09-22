const express = require("express");

const router = express.Router();


// ======================================================
// MIDDLEWARE
// ======================================================

const {
  protect,
  adminOnly,
} = require("../middlewares/authMiddleware");


// ======================================================
// CONTROLLERS
// ======================================================

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
} = require("../controllers/userController");


// ======================================================
// GET ALL USERS
// GET /api/users
// ======================================================

router.get(
  "/",
  protect,
  adminOnly,
  getUsers
);


// ======================================================
// GET ONE USER
// GET /api/users/:id
// ======================================================

router.get(
  "/:id",
  protect,
  adminOnly,
  getUserById
);


// ======================================================
// UPDATE USER
// PUT /api/users/:id
// ======================================================

router.put(
  "/:id",
  protect,
  adminOnly,
  updateUser
);


// ======================================================
// UPDATE USER ROLE
// PUT /api/users/:id/role
// ======================================================

router.put(
  "/:id/role",
  protect,
  adminOnly,
  updateUserRole
);


// ======================================================
// DELETE USER
// DELETE /api/users/:id
// ======================================================

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteUser
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;