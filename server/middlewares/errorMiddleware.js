const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : err.statusCode || 500;

  if (statusCode >= 500) {
    console.error("SERVER ERROR:", err);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : err.message || "Request failed",
    ...(process.env.NODE_ENV !== "production"
      ? { details: err.stack }
      : {}),
  });
};

module.exports = errorHandler;
