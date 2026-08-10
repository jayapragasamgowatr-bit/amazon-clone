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
|--------------------------------------------------------------------------
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

    // Category filter
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

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

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

    // Validate name
    if (!name || !name.trim()) {
      res.status(400);
      throw new Error("Product name is required");
    }

    // Validate description
    if (!description || !description.trim()) {
      res.status(400);
      throw new Error("Product description is required");
    }

    // Validate price
    if (
      price === undefined ||
      price === null ||
      price === ""
    ) {
      res.status(400);
      throw new Error("Product price is required");
    }

    const numericPrice = Number(price);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      res.status(400);
      throw new Error("Invalid product price");
    }

    // Validate stock
    let numericStock = 0;

    if (
      countInStock !== undefined &&
      countInStock !== ""
    ) {
      numericStock = Number(countInStock);

      if (
        Number.isNaN(numericStock) ||
        numericStock < 0
      ) {
        res.status(400);
        throw new Error("Invalid stock quantity");
      }
    }

    const product = await Product.create({
      name: name.trim(),
      price: numericPrice,
      description: description.trim(),
      image: image || "",
      category: category || "",
      countInStock: numericStock,
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

    // Name
    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400);
        throw new Error("Product name cannot be empty");
      }

      product.name = name.trim();
    }

    // Price
    if (price !== undefined && price !== "") {
      const numericPrice = Number(price);

      if (
        Number.isNaN(numericPrice) ||
        numericPrice < 0
      ) {
        res.status(400);
        throw new Error("Invalid product price");
      }

      product.price = numericPrice;
    }

    // Description
    if (description !== undefined) {
      product.description = description;
    }

    // Image
    if (image !== undefined) {
      product.image = image;
    }

    // Category
    if (category !== undefined) {
      product.category = category;
    }

    // Stock
    if (
      countInStock !== undefined &&
      countInStock !== ""
    ) {
      const numericStock = Number(countInStock);

      if (
        Number.isNaN(numericStock) ||
        numericStock < 0
      ) {
        res.status(400);
        throw new Error("Invalid stock quantity");
      }

      product.countInStock = numericStock;
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
| CREATE PRODUCT REVIEW
|--------------------------------------------------------------------------
| Logged-in users
|--------------------------------------------------------------------------
*/
const createProductReview = async (req, res, next) => {
  try {
    const {
      rating,
      comment,
    } = req.body;

    // Find product
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    // Validate rating
    const reviewRating = Number(rating);

    if (
      Number.isNaN(reviewRating) ||
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      res.status(400);
      throw new Error(
        "Rating must be between 1 and 5"
      );
    }

    // Make sure reviews array exists
    if (!Array.isArray(product.reviews)) {
      product.reviews = [];
    }

    // Check if user already reviewed
    const alreadyReviewed =
      product.reviews.find(
        (review) =>
          review.user &&
          review.user.toString() ===
            req.user._id.toString()
      );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error(
        "You have already reviewed this product"
      );
    }

    // Create review
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: reviewRating,
      comment: comment
        ? comment.trim()
        : "",
    };

    // Add review
    product.reviews.push(review);

    // Update review count
    product.numReviews =
      product.reviews.length;

    // Calculate average rating
    const totalRating =
      product.reviews.reduce(
        (sum, item) =>
          sum + Number(item.rating),
        0
      );

    product.rating =
      totalRating /
      product.reviews.length;

    // Save product
    await product.save();

    res.status(201).json({
      message: "Review added successfully",
      review,
      rating: product.rating,
      numReviews: product.numReviews,
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
  createProductReview,
};