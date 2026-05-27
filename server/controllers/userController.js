const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const signup = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    const userExists =
      await User.findOne({
        email,
      });

    if (userExists) {
      res.status(400);
      throw new Error(
        "User already exists"
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const user =
      await User.create({
        name,
        email,
        password:
          hashedPassword,
      });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(
        user._id,
        user.role
      ),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const user =
      await User.findOne({
        email,
      });

    if (
      user &&
      (await bcrypt.compare(
        password,
        user.password
      ))
    ) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(
          user._id,
          user.role
        ),
      });
    } else {
      res.status(401);
      throw new Error(
        "Invalid credentials"
      );
    }
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (
  req,
  res,
  next
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      ).populate(
        "wishlist"
      );

    res.json(user.wishlist);
  } catch (error) {
    next(error);
  }
};

const toggleWishlist = async (
  req,
  res,
  next
) => {
  try {
    const { productId } =
      req.body;

    const user =
      await User.findById(
        req.user._id
      );

    const exists =
      user.wishlist.includes(
        productId
      );

    if (exists) {
      user.wishlist =
        user.wishlist.filter(
          (id) =>
            id.toString() !==
            productId
        );
    } else {
      user.wishlist.push(
        productId
      );
    }

    await user.save();

    const updatedUser =
      await User.findById(
        req.user._id
      ).populate(
        "wishlist"
      );

    res.json(
      updatedUser.wishlist
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getWishlist,
  toggleWishlist,
};