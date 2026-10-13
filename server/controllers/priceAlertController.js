const Product = require("../models/Product");
const PriceAlert = require("../models/PriceAlert");

const getPriceAlerts = async (req, res, next) => {
  try {
    const alerts = await PriceAlert.find({ user: req.user._id, active: true })
      .populate("product", "name price image images countInStock category")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, alerts });
  } catch (error) { next(error); }
};

const createPriceAlert = async (req, res, next) => {
  try {
    const { productId, targetPrice } = req.body;
    const target = Number(targetPrice);
    if (!productId || !Number.isFinite(target) || target < 0) {
      return res.status(400).json({ success: false, message: "Product ID and a valid target price are required." });
    }
    const product = await Product.findById(productId).select("name price countInStock image images category").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    if (target >= Number(product.price)) {
      return res.status(400).json({ success: false, message: "Target price must be lower than the current price." });
    }

    const alert = await PriceAlert.findOneAndUpdate(
      { user: req.user._id, product: productId },
      { $set: { targetPrice: target, createdPrice: Number(product.price), active: true, notifiedAt: null } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("product", "name price image images countInStock category");

    res.status(200).json({ success: true, message: "Price-drop alert saved.", alert });
  } catch (error) { next(error); }
};

const deletePriceAlert = async (req, res, next) => {
  try {
    const alert = await PriceAlert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { active: false } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: "Price alert not found." });
    res.json({ success: true, message: "Price alert removed." });
  } catch (error) { next(error); }
};

module.exports = { getPriceAlerts, createPriceAlert, deletePriceAlert };
