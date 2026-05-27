const Product = require("../models/Product");

/* GET PRODUCTS */
const getProducts = async (
  req,
  res,
  next
) => {
  try {
    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 12;

    const skip =
      (page - 1) * limit;

    const search =
      req.query.search || "";

    const category =
      req.query.category || "";

    const minPrice =
      Number(req.query.minPrice) || 0;

    const maxPrice =
      Number(req.query.maxPrice) ||
      999999999;

    const sort =
      req.query.sort || "";

    let query = {};

    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (
      category &&
      category !== "All"
    ) {
      query.category =
        category;
    }

    query.price = {
      $gte: minPrice,
      $lte: maxPrice,
    };

    let sortOption = {
      createdAt: -1,
    };

    if (sort === "lowToHigh") {
      sortOption = {
        price: 1,
      };
    }

    if (sort === "highToLow") {
      sortOption = {
        price: -1,
      };
    }

    const products =
      await Product.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

    const total =
      await Product.countDocuments(
        query
      );

    res.json({
      products,
      page,
      pages: Math.ceil(
        total / limit
      ),
      total,
    });

  } catch (error) {
    next(error);
  }
};

/* SEARCH SUGGESTIONS */
const getSuggestions = async (
  req,
  res,
  next
) => {
  try {
    const query =
      req.query.q || "";

    if (!query) {
      return res.json([]);
    }

    const products =
      await Product.find({
        name: {
          $regex: query,
          $options: "i",
        },
      })
        .limit(6)
        .select("name");

    res.json(products);

  } catch (error) {
    next(error);
  }
};

const getProductById = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      res.status(404);
      throw new Error(
        "Product not found"
      );
    }

    res.json(product);

  } catch (error) {
    next(error);
  }
};

const createProduct = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await Product.create(
        req.body
      );

    res.status(201).json(
      product
    );

  } catch (error) {
    next(error);
  }
};

const updateProduct = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      res.status(404);
      throw new Error(
        "Product not found"
      );
    }

    Object.assign(
      product,
      req.body
    );

    const updated =
      await product.save();

    res.json(updated);

  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (
  req,
  res,
  next
) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      res.status(404);
      throw new Error(
        "Product not found"
      );
    }

    await product.deleteOne();

    res.json({
      message:
        "Product deleted",
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getSuggestions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};