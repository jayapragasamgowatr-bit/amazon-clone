const mongoose = require("mongoose");
const Product = require("../models/Product");
const InventoryTransaction = require("../models/InventoryTransaction");

const parseDate = (value, endOfDay = false) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getInventory = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const search = String(req.query.search || "").trim().slice(0, 100);
    const status = String(req.query.status || "All").trim();
    const threshold = req.query.lowStockThreshold === undefined || req.query.lowStockThreshold === ""
      ? 5 : Number(req.query.lowStockThreshold);

    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 1000000) {
      return res.status(400).json({ success: false, message: "Invalid low-stock threshold." });
    }

    const query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
      ];
    }

    if (status === "In Stock") query.countInStock = { $gt: 0 };
    else if (status === "Low Stock") query.countInStock = { $gt: 0, $lte: threshold };
    else if (status === "Out of Stock") query.countInStock = 0;
    else if (status === "Active") query.$or = [{ ...(query.$or ? { } : {}) }];

    const [products, total] = await Promise.all([
      Product.find(query).select("name category price image countInStock isActive updatedAt").sort({ countInStock: 1, name: 1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    const [totalProducts, inStockProducts, outOfStockProducts, lowStockProducts, inactiveProducts] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ countInStock: { $gt: 0 } }),
      Product.countDocuments({ countInStock: 0 }),
      Product.countDocuments({ countInStock: { $gt: 0, $lte: threshold } }),
      Product.countDocuments({ isActive: false }),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page, limit, totalProducts: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
      summary: { totalProducts, inStockProducts, outOfStockProducts, lowStockProducts, inactiveProducts, lowStockThreshold: threshold },
    });
  } catch (error) { next(error); }
};

const getInventoryHistory = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const productId = String(req.query.productId || "").trim();
    const type = String(req.query.type || "All").trim();
    const search = String(req.query.search || "").trim().slice(0, 100);
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const query = {};
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ success: false, message: "Invalid product ID." });
      query.product = productId;
    }
    if (["IN", "OUT", "ADJUSTMENT"].includes(type)) query.type = type;
    if (search) query.reason = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    if (from || to) {
      const start = from ? parseDate(from) : null;
      const end = to ? parseDate(to, true) : null;
      if (from && !start) return res.status(400).json({ success: false, message: "Invalid from date." });
      if (to && !end) return res.status(400).json({ success: false, message: "Invalid to date." });
      if (start && end && start > end) return res.status(400).json({ success: false, message: "from date cannot be after to date." });
      query.createdAt = {};
      if (start) query.createdAt.$gte = start;
      if (end) query.createdAt.$lte = end;
    }

    const [history, total] = await Promise.all([
      InventoryTransaction.find(query)
        .populate("product", "name category image")
        .populate("performedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryTransaction.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    return res.status(200).json({
      success: true,
      history,
      pagination: { page, limit, totalTransactions: total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    });
  } catch (error) { next(error); }
};

module.exports = { getInventory, getInventoryHistory };
