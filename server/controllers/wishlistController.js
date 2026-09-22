const User = require("../models/User");
const Product = require("../models/Product");


/*
|--------------------------------------------------------------------------
| GET WISHLIST
|--------------------------------------------------------------------------
| GET /api/wishlist
|--------------------------------------------------------------------------
*/
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("wishlist");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const wishlist = Array.isArray(user.wishlist)
      ? user.wishlist
      : [];

    return res.status(200).json({
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| ADD TO WISHLIST
|--------------------------------------------------------------------------
| POST /api/wishlist
|--------------------------------------------------------------------------
*/
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    const alreadyExists = user.wishlist.some(
      (id) => id.toString() === productId.toString()
    );

    if (alreadyExists) {
      return res.status(200).json({
        message: "Product already in wishlist",
        wishlist: user.wishlist,
      });
    }

    user.wishlist.push(productId);

    await user.save();

    const updatedUser = await User.findById(
      req.user._id
    ).populate("wishlist");

    return res.status(200).json({
      message: "Product added to wishlist",
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| REMOVE FROM WISHLIST
|--------------------------------------------------------------------------
| DELETE /api/wishlist/:productId
|--------------------------------------------------------------------------
*/
const removeFromWishlist = async (
  req,
  res,
  next
) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    user.wishlist = user.wishlist.filter(
      (id) =>
        id.toString() !== productId.toString()
    );

    await user.save();

    const updatedUser = await User.findById(
      req.user._id
    ).populate("wishlist");

    return res.status(200).json({
      message: "Product removed from wishlist",
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};