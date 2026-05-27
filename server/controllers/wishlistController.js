const Wishlist =
  require("../models/Wishlist");

const getWishlist =
  async (
    req,
    res,
    next
  ) => {
    try {
      const wishlist =
        await Wishlist.findOne({
          user:
            req.user._id,
        }).populate(
          "products"
        );

      res.json(
        wishlist
          ? wishlist.products
          : []
      );
    } catch (error) {
      next(error);
    }
  };

const addToWishlist =
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        productId,
      } = req.body;

      let wishlist =
        await Wishlist.findOne({
          user:
            req.user._id,
        });

      if (!wishlist) {
        wishlist =
          await Wishlist.create({
            user:
              req.user._id,
            products: [
              productId,
            ],
          });
      } else {
        if (
          !wishlist.products.some(
            (id) =>
              id.toString() ===
              productId
          )
        ) {
          wishlist.products.push(
            productId
          );

          await wishlist.save();
        }
      }

      const updated =
        await Wishlist.findOne({
          user:
            req.user._id,
        }).populate(
          "products"
        );

      res.json(
        updated.products
      );
    } catch (error) {
      next(error);
    }
  };

const removeFromWishlist =
  async (
    req,
    res,
    next
  ) => {
    try {
      const wishlist =
        await Wishlist.findOne({
          user:
            req.user._id,
        });

      if (!wishlist) {
        return res.json([]);
      }

      wishlist.products =
        wishlist.products.filter(
          (id) =>
            id.toString() !==
            req.params
              .productId
        );

      await wishlist.save();

      const updated =
        await Wishlist.findOne({
          user:
            req.user._id,
        }).populate(
          "products"
        );

      res.json(
        updated.products
      );
    } catch (error) {
      next(error);
    }
  };

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};