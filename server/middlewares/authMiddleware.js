const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No token
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find user
    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);

    res.status(401);
    next(error);
  }
};

module.exports = protect;