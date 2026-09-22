require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createRateLimiter } = require("./middlewares/rateLimitMiddleware");
const {
  verifyEmailConnection,
} = require("./utils/emailService");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const eventRoutes = require("./routes/eventRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const customerIntelligenceRoutes = require("./routes/customerIntelligenceRoutes");
const aiRoutes = require("./routes/aiRoutes");
const riskRoutes = require("./routes/riskRoutes");
const imageIntelligenceRoutes = require("./routes/imageIntelligenceRoutes");
const authenticityRoutes = require("./routes/authenticityRoutes");
const automationRoutes = require("./routes/automationRoutes");
const supportRoutes = require("./routes/supportRoutes");
const { runAutomationScan } = require("./services/automationService");

const app = express();

const configuredClientUrl = process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
const allowedOrigins = configuredClientUrl
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (allowedOrigins.includes("*")) {
  throw new Error("CLIENT_URL must contain explicit origins; wildcard CORS is not allowed.");
}

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use("/api/auth/login", createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
}));

app.use("/api/auth/register", createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many registration attempts. Please try again later.",
}));

app.use("/api/orders", createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many order requests. Please try again later.",
}));

app.use("/api", createRateLimiter({
  windowMs: 60 * 1000,
  max: 180,
  message: "Too many API requests. Please try again later.",
}));

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests and local tooling with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Keep request logging useful without logging passwords, tokens or full customer payloads.
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`
    );
  });
  next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend server is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/customer-intelligence", customerIntelligenceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/image-intelligence", imageIntelligenceRoutes);
app.use("/api/authenticity", authenticityRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/support", supportRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (err?.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message || "Request failed." });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
    });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid request data.",
      errors: Object.values(err.errors || {}).map((item) => item.message),
    });
  }

  if (err?.name === "MulterError" || err?.message?.includes("Only JPEG")) {
    return res.status(400).json({
      success: false,
      message: err.message || "Invalid upload.",
    });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource identifier.",
    });
  }

  const status = Number(err?.statusCode || err?.status || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  return res.status(safeStatus).json({
    success: false,
    message: safeStatus === 500 ? "Internal server error" : (err.message || "Request failed"),
  });
});

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
      throw new Error("CLIENT_URL is required in production");
    }
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing in .env");
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing in .env");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const emailOk = await verifyEmailConnection();
      if (!emailOk) console.warn("Email verification failed. Orders can still be created; email notifications may fail.");
    } else {
      console.warn("Email credentials are not configured.");
    }

    const automationEnabled = process.env.AI_AUTOMATION_ENABLED !== "false";
    if (automationEnabled) {
      runAutomationScan().then(r => console.log(`AI automation initial scan: ${r.totalNew} new alert(s)`)).catch(e => console.warn("AI automation scan failed:", e.message));
      setInterval(() => {
        runAutomationScan().then(r => { if (r.totalNew) console.log(`AI automation scan: ${r.totalNew} new alert(s)`); }).catch(e => console.warn("AI automation scan failed:", e.message));
      }, Math.max(Number(process.env.AI_AUTOMATION_INTERVAL_MINUTES) || 60, 60) * 60000);
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("SERVER START ERROR:", error);
    process.exit(1);
  }
};

startServer();
