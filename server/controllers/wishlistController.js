const User = require("../models/User");
const Product = require("../models/Product");
const WishlistMeta = require("../models/WishlistMeta");
const Event = require("../models/Event");

const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    if (!user) return res.status(404).json({ message: "User not found" });

    const products = Array.isArray(user.wishlist) ? user.wishlist : [];
    const ids = products.map((p) => p?._id).filter(Boolean);
    const metas = await WishlistMeta.find({ user: req.user._id, product: { $in: ids } }).lean();
    const metaMap = new Map(metas.map((m) => [String(m.product), m]));

    const viewCounts = await Event.aggregate([
      { $match: { user: user._id, eventName: "product_view", product: { $in: ids } } },
      { $group: { _id: "$product", count: { $sum: 1 } } },
    ]);
    const viewsMap = new Map(viewCounts.map((v) => [String(v._id), v.count]));

    const wishlist = products.map((product) => {
      const item = product.toObject ? product.toObject() : product;
      const meta = metaMap.get(String(item._id));
      const currentPrice = Number(item.price || 0);
      const addedPrice = Number(meta?.addedPrice ?? currentPrice);
      const priceDrop = Math.max(0, addedPrice - currentPrice);
      const currentStock = Number(item.countInStock || 0);
      const wasOutOfStock = Number(meta?.addedStock || 0) <= 0;

      return {
        ...item,
        wishlistInsights: {
          addedPrice,
          priceDrop,
          priceDropPercent: addedPrice > 0 ? Math.round((priceDrop / addedPrice) * 100) : 0,
          backInStock: wasOutOfStock && currentStock > 0,
          lowStock: currentStock > 0 && currentStock <= 5,
          viewCount: Number(viewsMap.get(String(item._id)) || 0),
        },
      };
    });

    res.status(200).json({ wishlist });
  } catch (error) { next(error); }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "Product ID is required" });
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!Array.isArray(user.wishlist)) user.wishlist = [];

    const alreadyExists = user.wishlist.some((id) => id.toString() === productId.toString());
    if (!alreadyExists) {
      user.wishlist.push(productId);
      await user.save();
    }

    await WishlistMeta.findOneAndUpdate(
      { user: req.user._id, product: productId },
      { $setOnInsert: { addedPrice: Number(product.price || 0), addedStock: Number(product.countInStock || 0), addedAt: new Date() } },
      { upsert: true, new: true }
    );

    const updatedUser = await User.findById(req.user._id).populate("wishlist");
    res.status(200).json({
      message: alreadyExists ? "Product already in wishlist" : "Product added to wishlist",
      wishlist: updatedUser.wishlist,
    });
  } catch (error) { next(error); }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!productId) return res.status(400).json({ message: "Product ID is required" });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.wishlist = Array.isArray(user.wishlist) ? user.wishlist.filter((id) => id.toString() !== productId.toString()) : [];
    await user.save();
    await WishlistMeta.deleteOne({ user: req.user._id, product: productId });
    const updatedUser = await User.findById(req.user._id).populate("wishlist");
    res.status(200).json({ message: "Product removed from wishlist", wishlist: updatedUser.wishlist });
  } catch (error) { next(error); }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
