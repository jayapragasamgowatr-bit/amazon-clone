const express = require("express");
const router = express.Router();

const {
  getProducts,
  getSuggestions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const protect = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.get("/suggestions", getSuggestions);

router.get("/", getProducts);

router.get("/:id", getProductById);

router.post(
  "/",
  protect,
  adminMiddleware,
  createProduct
);

router.put(
  "/:id",
  protect,
  adminMiddleware,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  adminMiddleware,
  deleteProduct
);

module.exports = router;