const User = require("../models/User");
const Order = require("../models/Order");

// ======================================================
// GET ALL USERS
// GET /api/auth/users
// ======================================================
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// ======================================================
// GET ONE USER
// GET /api/auth/users/:id
// ======================================================
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .lean();

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Get orders belonging to this customer
    let orders = [];

    try {
      orders = await Order.find({
        user: req.params.id,
      })
        .sort({ createdAt: -1 })
        .lean();
    } catch (orderError) {
      console.error(
        "ORDER FETCH ERROR:",
        orderError.message
      );
    }

    res.json({
      user,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// UPDATE USER
// PUT /api/auth/users/:id
// ======================================================
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const {
      name,
      email,
    } = req.body;

    if (name !== undefined) {
      user.name = name;
    }

    if (email !== undefined) {
      user.email = email;
    }

    await user.save();

    res.json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// UPDATE USER ROLE
// PUT /api/auth/users/:id/role
// ======================================================
const updateUserRole = async (req, res, next) => {
  try {
    const {
      role,
    } = req.body;

    // Validate role
    if (!["user", "admin"].includes(role)) {
      res.status(400);
      throw new Error("Invalid role");
    }

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Prevent admin from removing own admin access
    if (
      req.user._id.toString() ===
        user._id.toString() &&
      role !== "admin"
    ) {
      res.status(400);
      throw new Error(
        "You cannot remove your own admin access"
      );
    }

    // Update role
    user.role = role;

    // Keep isAdmin synchronized
    user.isAdmin =
      role === "admin";

    await user.save();

    res.json({
      message:
        role === "admin"
          ? "Admin access granted successfully"
          : "Admin access removed successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// DELETE USER
// DELETE /api/auth/users/:id
// ======================================================
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Prevent deleting yourself
    if (
      req.user._id.toString() ===
      user._id.toString()
    ) {
      res.status(400);
      throw new Error(
        "You cannot delete your own account"
      );
    }

    // Prevent deleting another admin
    if (
      user.role === "admin" ||
      user.isAdmin === true
    ) {
      res.status(400);
      throw new Error(
        "Admin accounts cannot be deleted from customer management"
      );
    }

    await User.findByIdAndDelete(
      req.params.id
    );

    // Optional: delete customer's orders
    // Only enable this if you want orders deleted
    // together with the customer.
    //
    // await Order.deleteMany({
    //   user: req.params.id,
    // });

    res.json({
      message:
        "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// EXPORT
// ======================================================
module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
};