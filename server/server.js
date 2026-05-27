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

/* CORS */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://wateros.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

/* Routes */
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);

/* Root test */
app.get("/", (req, res) => {
  res.send("API Running...");
});

/* Error middleware */
app.use(errorHandler);

/* DB connection */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

/* Start server */
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();