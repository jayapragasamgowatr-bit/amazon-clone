const jwt = require("jsonwebtoken");

// ============================================================
// GENERATE JWT
// ============================================================

const generateToken = (id, role = "user") => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: String(id),
      role,
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "7d",
    }
  );
};

module.exports = generateToken;