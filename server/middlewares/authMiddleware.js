const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================

const protect = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");

      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured.",
      });
    }

    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please login again.",
        });
      }

      if (
        error.name === "JsonWebTokenError" ||
        error.name === "NotBeforeError"
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid authentication token.",
        });
      }

      console.error("JWT VERIFICATION ERROR:", error);

      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const userId = decoded?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Role is the authoritative admin permission.
    // Keep isAdmin synchronized for legacy compatibility.
    const shouldBeAdmin = user.role === "admin";

    if (user.isAdmin !== shouldBeAdmin) {
      user.isAdmin = shouldBeAdmin;
      await user.save();
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication service error.",
    });
  }
};


// Optional authentication for analytics/event collection.
// Invalid or expired tokens are ignored so anonymous tracking still works.
const optionalProtect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ") || !process.env.JWT_SECRET) return next();

    const token = authorization.slice(7).trim();
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded?.id) return next();

    const user = await User.findById(decoded.id).select("-password");
    if (user) req.user = user;
  } catch {
    // Analytics must never turn an anonymous/customer request into an auth failure.
  }
  next();
};

// ============================================================
// ADMIN ONLY
// ============================================================

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Please login.",
    });
  }

  // Role is the single source of truth.
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  protect,
  optionalProtect,
  adminOnly,
};