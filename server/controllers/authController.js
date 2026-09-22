const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { EMAIL_RE, validateRegistration } = require("../utils/validation");
const generateToken = require("../utils/generateToken");

// ============================================================
// REGISTER USER
// POST /api/auth/register
// ============================================================

const registerUser = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      res.status(400);
      throw new Error("Request body is missing");
    }

    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    // --------------------------------------------------------
    // CLEAN INPUT
    // --------------------------------------------------------

    name = String(name).trim();
    email = String(email).trim().toLowerCase();
    password = String(password);

    // --------------------------------------------------------
    // VALIDATE REGISTRATION
    // --------------------------------------------------------

    const registrationCheck = validateRegistration({
      name,
      email,
      password,
    });

    if (!registrationCheck.valid) {
      return res.status(400).json({
        success: false,
        message: registrationCheck.message,
      });
    }

    ({ name, email, password } = registrationCheck.value);

    // --------------------------------------------------------
    // CHECK EXISTING USER
    // --------------------------------------------------------

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400);
      throw new Error("User already exists with this email");
    }

    // --------------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // --------------------------------------------------------
    // CREATE USER
    // --------------------------------------------------------

    const user = await User.create({
      name,
      email,
      password: hashedPassword,

      // IMPORTANT:
      // Every newly registered account is a normal user.
      role: "user",
      isAdmin: false,

      wishlist: [],
    });

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(201).json({
      success: true,

      message: "Registration successful",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      },

      // Centralized JWT generator.
      // Token lifetime = 7 days.
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// LOGIN USER
// POST /api/auth/login
// ============================================================

const loginUser = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      res.status(400);
      throw new Error("Request body is missing");
    }

    let { email, password } = req.body;

    // --------------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------------

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    // --------------------------------------------------------
    // CLEAN INPUT
    // --------------------------------------------------------

    email = String(email).trim().toLowerCase();
    password = String(password);

    // --------------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------------

    if (!EMAIL_RE.test(email) || email.length > 254) {
      res.status(400);
      throw new Error("Invalid email address");
    }

    // --------------------------------------------------------
    // PASSWORD LENGTH PROTECTION
    // --------------------------------------------------------

    if (password.length > 128) {
      res.status(400);
      throw new Error("Password is too long");
    }

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // --------------------------------------------------------
    // VERIFY PASSWORD
    // --------------------------------------------------------

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // --------------------------------------------------------
    // SYNCHRONIZE ADMIN FLAG
    // --------------------------------------------------------

    // `role` is the authoritative permission.
    //
    // We keep `isAdmin` synchronized because it may still
    // be used by existing frontend/database code.

    const shouldBeAdmin = user.role === "admin";

    if (user.isAdmin !== shouldBeAdmin) {
      user.isAdmin = shouldBeAdmin;
      await user.save();
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.json({
      success: true,

      message: "Login successful",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: shouldBeAdmin,
      },

      // Centralized JWT generator.
      // Token lifetime = 7 days.
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET ALL USERS
// GET /api/auth/users
// ADMIN ONLY
// ============================================================

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET USER BY ID
// GET /api/auth/users/:id
// ADMIN ONLY
// ============================================================

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE USER PROFILE
// PUT /api/auth/users/:id
// ADMIN ONLY
// ============================================================

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const { name, email } = req.body || {};

    // --------------------------------------------------------
    // UPDATE NAME
    // --------------------------------------------------------

    if (name !== undefined) {
      const cleanName = String(name).trim();

      if (
        cleanName.length < 2 ||
        cleanName.length > 100
      ) {
        res.status(400);
        throw new Error(
          "Name must be between 2 and 100 characters"
        );
      }

      user.name = cleanName;
    }

    // --------------------------------------------------------
    // UPDATE EMAIL
    // --------------------------------------------------------

    if (email !== undefined) {
      const cleanEmail = String(email)
        .trim()
        .toLowerCase();

      // IMPORTANT:
      // Correct regex:
      // /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (
        !EMAIL_RE.test(cleanEmail) ||
        cleanEmail.length > 254
      ) {
        res.status(400);
        throw new Error("Invalid email address");
      }

      const duplicate = await User.findOne({
        email: cleanEmail,
        _id: { $ne: user._id },
      });

      if (duplicate) {
        res.status(409);
        throw new Error(
          "Email address is already in use"
        );
      }

      user.email = cleanEmail;
    }

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    await user.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.json({
      success: true,

      message: "User updated successfully",

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        // Role is authoritative.
        isAdmin: user.role === "admin",

        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE USER ROLE
// PUT /api/auth/users/:id/role
// ADMIN ONLY
// ============================================================

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body || {};

    // --------------------------------------------------------
    // VALIDATE ROLE
    // --------------------------------------------------------

    if (
      role !== "admin" &&
      role !== "user"
    ) {
      res.status(400);

      throw new Error(
        "Invalid role. Use user or admin."
      );
    }

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // --------------------------------------------------------
    // PREVENT SELF ROLE CHANGE
    // --------------------------------------------------------

    if (
      req.user._id.toString() ===
      user._id.toString()
    ) {
      res.status(400);

      throw new Error(
        "You cannot change your own admin access"
      );
    }

    // --------------------------------------------------------
    // UPDATE ROLE
    // --------------------------------------------------------

    user.role = role;

    // Keep legacy flag synchronized.
    user.isAdmin = role === "admin";

    await user.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.json({
      success: true,

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
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE USER
// DELETE /api/auth/users/:id
// ADMIN ONLY
// ============================================================

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // --------------------------------------------------------
    // PROTECT ADMIN ACCOUNTS
    // --------------------------------------------------------

    if (
      user.role === "admin" ||
      user.isAdmin === true
    ) {
      res.status(400);

      throw new Error(
        "Admin users cannot be deleted"
      );
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    await User.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET CURRENT USER
// GET /api/auth/me
// ============================================================

const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,

    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,

      // Role is authoritative.
      isAdmin: req.user.role === "admin",

      createdAt: req.user.createdAt,
    },
  });
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
  getMe,
};