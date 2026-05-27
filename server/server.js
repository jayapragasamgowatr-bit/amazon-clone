const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const errorHandler = require("./middlewares/errorMiddleware");

const app = express();

/* CORS FIX FOR LOCAL + VERCEL */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://amazon-clone-gamma-eight-26.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* ROUTES */
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);

/* ROOT TEST ROUTE */
app.get("/", (req, res) => {
  res.send("API Running...");
});

/* ERROR HANDLER */
app.use(errorHandler);

/* DATABASE */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

/* SERVER START */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();