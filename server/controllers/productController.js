const Product = require("../models/Product");

/*
|--------------------------------------------------------------------------
| GET ALL PRODUCTS
|--------------------------------------------------------------------------
| Supports:
| search
| category
| minPrice
| maxPrice
| sort
| page
| limit
*/
const getProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const category = req.query.category || "";

    const minPrice =
      req.query.minPrice !== undefined &&
      req.query.minPrice !== ""
        ? Number(req.query.minPrice)
        : 0;

    const maxPrice =
      req.query.maxPrice !== undefined &&
      req.query.maxPrice !== ""
        ? Number(req.query.maxPrice)
        : 999999999;

    const sort = req.query.sort || "";

    let query = {};

    // Search by product name
    if (search.trim()) {
      query.name = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    // Filter by category
    if (category && category !== "All") {
      query.category = category;
    }

    // Price filter
    query.price = {
      $gte: minPrice,
      $lte: maxPrice,
    };

    // Sorting
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

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    if (sort === "newest") {
      sortOption = {
        createdAt: -1,
      };
    }

    // Get products
    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    // Total products
    const total = await Product.countDocuments(query);

    res.status(200).json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET SEARCH SUGGESTIONS
|--------------------------------------------------------------------------
*/
const getSuggestions = async (req, res, next) => {
  try {
    const query = req.query.q || "";

    if (!query.trim()) {
      return res.status(200).json([]);
    }

    const products = await Product.find({
      name: {
        $regex: query.trim(),
        $options: "i",
      },
    })
      .limit(6)
      .select("_id name");

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET SINGLE PRODUCT
|--------------------------------------------------------------------------
*/
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      price,
      description,
      image,
      category,
      countInStock,
    } = req.body;

    // Basic validation
    if (!name || !description) {
      res.status(400);
      throw new Error(
        "Product name and description are required"
      );
    }

    if (
      price === undefined ||
      price === null ||
      price === ""
    ) {
      res.status(400);
      throw new Error("Product price is required");
    }

    const product = await Product.create({
      name,
      price: Number(price),
      description,
      image: image || "",
      category: category || "",
      countInStock:
        countInStock !== undefined &&
        countInStock !== ""
          ? Number(countInStock)
          : 0,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const {
      name,
      price,
      description,
      image,
      category,
      countInStock,
    } = req.body;

    // Update only fields that are supplied
    if (name !== undefined) {
      product.name = name;
    }

    if (price !== undefined && price !== "") {
      product.price = Number(price);
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (image !== undefined) {
      product.image = image;
    }

    if (category !== undefined) {
      product.category = category;
    }

    if (
      countInStock !== undefined &&
      countInStock !== ""
    ) {
      product.countInStock = Number(countInStock);
    }

    const updatedProduct = await product.save();

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
| Admin only
|--------------------------------------------------------------------------
*/
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    await product.deleteOne();

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/
module.exports = {
  getProducts,
  getSuggestions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};