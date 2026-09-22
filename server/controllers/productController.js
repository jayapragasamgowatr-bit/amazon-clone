const Product = require("../models/Product");
const Order = require("../models/Order");
const InventoryTransaction = require("../models/InventoryTransaction");
const { validateSpecifications, validateStringArray, validateReview } = require("../utils/validation");

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ============================================================
// GET ALL PRODUCTS
// GET /api/products
// ============================================================

const getProducts = async (
  req,
  res,
  next
) => {
  try {

    const page =
      Math.max(
        Number(req.query.page) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          Number(req.query.limit) || 12,
          1
        ),
        100
      );

    const skip =
      (page - 1) * limit;

    const search =
      req.query.search || "";

    const category =
      req.query.category || "";

    let minPrice = 0;

    let maxPrice = 999999999;

    if (
      req.query.minPrice !== undefined &&
      req.query.minPrice !== ""
    ) {
      minPrice =
        Number(req.query.minPrice);

      if (Number.isNaN(minPrice)) {
        minPrice = 0;
      }
    }

    if (
      req.query.maxPrice !== undefined &&
      req.query.maxPrice !== ""
    ) {
      maxPrice =
        Number(req.query.maxPrice);

      if (Number.isNaN(maxPrice)) {
        maxPrice = 999999999;
      }
    }

    const sort =
      req.query.sort || "";

    // --------------------------------------------------------
    // QUERY
    // --------------------------------------------------------

    const query =
      req.query.includeInactive === "true"
        ? {}
        : {
            $or: [
              { isActive: true },
              { isActive: { $exists: false } },
            ],
          };

    if (search.trim()) {
      query.name = {
        $regex: escapeRegex(search.trim()).slice(0, 100),
        $options: "i",
      };
    }

    if (
      category &&
      category !== "All"
    ) {
      query.category = category;
    }

    query.price = {
      $gte: minPrice,
      $lte: maxPrice,
    };

    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // PRODUCTS
    // --------------------------------------------------------

    const products =
      await Product.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

    const total =
      await Product.countDocuments(
        query
      );

    if (req.query.includeInactive === "true") {
      res.setHeader("Cache-Control", "private, no-store");
    } else {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    }

    return res.status(200).json({
      success: true,
      products,
      page,
      pages:
        Math.ceil(
          total / limit
        ),
      total,
    });

  } catch (error) {

    console.error(
      "GET PRODUCTS ERROR:",
      error.message
    );

    next(error);
  }
};

// ============================================================
// GET SEARCH SUGGESTIONS
// GET /api/products/suggestions?q=
// ============================================================

const getSuggestions = async (
  req,
  res,
  next
) => {
  try {

    const query =
      req.query.q || "";

    if (!query.trim()) {
      return res.status(200).json([]);
    }

    const products =
      await Product.find({
        name: {
          $regex:
            escapeRegex(query.trim()).slice(0, 100),
          $options: "i",
        },
      })
        .limit(6)
        .select("_id name");

    return res.status(200).json(
      products
    );

  } catch (error) {

    console.error(
      "GET SUGGESTIONS ERROR:",
      error.message
    );

    next(error);
  }
};


// ============================================================
// GET ADMIN PRODUCTS
// GET /api/products/admin/list
// ADMIN
// ============================================================

const getAdminProducts = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const search = String(req.query.search || "").trim().slice(0, 100);
    const category = String(req.query.category || "").trim();
    const status = String(req.query.status || "All").trim();
    const lowStockOnly = req.query.lowStockOnly === "true";
    const thresholdRaw = req.query.lowStockThreshold;
    const lowStockThreshold =
      thresholdRaw === undefined || thresholdRaw === ""
        ? 5
        : Number(thresholdRaw);

    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || lowStockThreshold > 1000000) {
      return res.status(400).json({
        success: false,
        message: "Invalid low-stock threshold.",
      });
    }

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: escapeRegex(search), $options: "i" } },
        { category: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (status === "Active") {
      query.isActive = true;
    } else if (status === "Inactive") {
      query.isActive = false;
    } else if (status === "Out of Stock") {
      query.countInStock = 0;
    } else if (status === "Low Stock") {
      query.countInStock = { $gt: 0, $lte: lowStockThreshold };
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      inStockProducts,
      outOfStockProducts,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({
        $or: [{ isActive: true }, { isActive: { $exists: false } }],
      }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ countInStock: { $gt: 0 } }),
      Product.countDocuments({ countInStock: 0 }),
      Product.countDocuments({
        countInStock: { $gt: 0, $lte: lowStockThreshold },
      }),
    ]);

    res.setHeader("Cache-Control", "private, no-store");

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        totalProducts: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
      summary: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        inStockProducts,
        outOfStockProducts,
        lowStockProducts,
        lowStockThreshold,
      },
    });
  } catch (error) {
    console.error("GET ADMIN PRODUCTS ERROR:", error.message);
    next(error);
  }
};

// ============================================================
// UPDATE PRODUCT STOCK
// PUT /api/products/admin/:id/stock
// ADMIN
// ============================================================

const updateProductStock = async (req, res, next) => {
  try {
    const { countInStock } = req.body || {};

    if (
      countInStock === undefined ||
      countInStock === "" ||
      !Number.isInteger(Number(countInStock)) ||
      Number(countInStock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative whole number.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const previousStock = Number(product.countInStock) || 0;
    const newStock = Number(countInStock);

    product.countInStock = newStock;
    await product.save();

    if (previousStock !== newStock) {
      try {
        await InventoryTransaction.create({
          product: product._id,
          type: newStock > previousStock ? "IN" : newStock < previousStock ? "OUT" : "ADJUSTMENT",
          quantityChange: newStock - previousStock,
          previousStock,
          newStock,
          reason: "Manual adjustment",
          notes: String(req.body?.notes || "").trim().slice(0, 500),
          referenceType: "Manual",
          performedBy: req.user?._id || null,
        });
      } catch (auditError) {
        console.error("INVENTORY AUDIT ERROR:", auditError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Stock updated successfully.",
      product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT STOCK ERROR:", error.message);
    next(error);
  }
};

// ============================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// ============================================================

const getProductById = async (
  req,
  res,
  next
) => {
  try {

    const product =
      await Product.findOne({
        _id: req.params.id,
        $or: [
          { isActive: true },
          { isActive: { $exists: false } },
        ],
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    return res.status(200).json(
      product
    );

  } catch (error) {

    console.error(
      "GET PRODUCT ERROR:",
      error.message
    );

    next(error);
  }
};

// ============================================================
// CREATE PRODUCT
// POST /api/products
// ADMIN
// ============================================================

const createProduct = async (
  req,
  res,
  next
) => {
  try {

    const {
      name,
      price,
      description,
      image,
      category,
      countInStock,
      specifications,
      features,
      applications,
      isActive,
    } = req.body;

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Product name is required.",
      });
    }

    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

    if (
      !description ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product description is required.",
      });
    }

    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    if (
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product price is required.",
      });
    }

    if (String(name).trim().length > 150) {
      return res.status(400).json({ success: false, message: "Product name cannot exceed 150 characters." });
    }

    const numericPrice =
      Number(price);

    if (
      Number.isNaN(
        numericPrice
      ) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product price.",
      });
    }

    // --------------------------------------------------------
    // STOCK
    // --------------------------------------------------------

    let numericStock = 0;

    if (
      countInStock !== undefined &&
      countInStock !== ""
    ) {
      numericStock =
        Number(countInStock);

      if (
        Number.isNaN(numericStock) ||
        !Number.isInteger(numericStock) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid stock quantity.",
        });
      }
    }

    const specificationCheck = validateSpecifications(specifications);
    if (!specificationCheck.valid) {
      return res.status(400).json({ success: false, message: specificationCheck.message });
    }

    const featureCheck = validateStringArray(features || [], "Features");
    if (!featureCheck.valid) {
      return res.status(400).json({ success: false, message: featureCheck.message });
    }

    const applicationCheck = validateStringArray(applications || [], "Applications");
    if (!applicationCheck.valid) {
      return res.status(400).json({ success: false, message: applicationCheck.message });
    }

    // --------------------------------------------------------
    // PRODUCT
    // --------------------------------------------------------

    const product =
      await Product.create({
        name: name.trim(),

        price: numericPrice,

        description:
          description.trim(),

        image:
          image || "",

        category:
          String(category || "").trim(),

        isActive: true,

        countInStock:
          numericStock,

        specifications: specificationCheck.value,

        features: featureCheck.value,

        applications: applicationCheck.value,
      });

    return res.status(201).json({
      success: true,
      product,
    });

  } catch (error) {

    console.error(
      "CREATE PRODUCT ERROR:",
      error.message
    );

    next(error);
  }
};

// ============================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ADMIN
// ============================================================

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
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const {
      name,
      price,
      description,
      image,
      category,
      countInStock,
      specifications,
      features,
      applications,
      isActive,
    } = req.body;

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    if (
      name !== undefined
    ) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Product name cannot be empty.",
        });
      }

      product.name =
        String(name).trim();
    }

    // --------------------------------------------------------
    // PRICE
    // --------------------------------------------------------

    if (
      price !== undefined &&
      price !== ""
    ) {
      const numericPrice =
        Number(price);

      if (
        Number.isNaN(
          numericPrice
        ) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product price.",
        });
      }

      product.price =
        numericPrice;
    }

    // --------------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------------

    if (description !== undefined) {
      const cleanDescription = String(description).trim();
      if (!cleanDescription || cleanDescription.length > 5000) {
        return res.status(400).json({ success: false, message: "Description must be between 1 and 5000 characters." });
      }
      product.description = cleanDescription;
    }

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    if (
      image !== undefined
    ) {
      product.image =
        String(image);
    }

    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (
      category !== undefined
    ) {
      const cleanCategory = String(category).trim();
      if (cleanCategory.length > 100) {
        return res.status(400).json({ success: false, message: "Category is too long." });
      }
      product.category = cleanCategory;
    }

    // --------------------------------------------------------
    // STOCK
    // --------------------------------------------------------

    if (
      countInStock !== undefined &&
      countInStock !== ""
    ) {
      const numericStock =
        Number(countInStock);

      if (
        Number.isNaN(numericStock) ||
        !Number.isInteger(numericStock) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid stock quantity.",
        });
      }

      product.countInStock =
        numericStock;
    }

    // --------------------------------------------------------
    // FEATURES
    // --------------------------------------------------------

    if (features !== undefined) {
      if (!Array.isArray(features)) {
        return res.status(400).json({
          success: false,
          message: "Features must be an array",
        });
      }

      const featureCheck = validateStringArray(features, "Features", 50, 200);
      if (!featureCheck.valid) return res.status(400).json({ success: false, message: featureCheck.message });
      product.features = featureCheck.value;
    }

    // --------------------------------------------------------
    // APPLICATIONS
    // --------------------------------------------------------

    if (applications !== undefined) {
      if (!Array.isArray(applications)) {
        return res.status(400).json({
          success: false,
          message: "Applications must be an array",
        });
      }

      const applicationCheck = validateStringArray(applications, "Applications", 50, 200);
      if (!applicationCheck.valid) return res.status(400).json({ success: false, message: applicationCheck.message });
      product.applications = applicationCheck.value;
    }

    // --------------------------------------------------------
    // ACTIVE STATUS
    // --------------------------------------------------------

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ success: false, message: "isActive must be a boolean." });
      }
      product.isActive = isActive;
    }

    // --------------------------------------------------------
    // SPECIFICATIONS
    // --------------------------------------------------------

    if (specifications !== undefined) {
      const specificationCheck = validateSpecifications(specifications);
      if (!specificationCheck.valid) {
        return res.status(400).json({ success: false, message: specificationCheck.message });
      }
      product.specifications = specificationCheck.value;
    }

    const updatedProduct =
      await product.save();

    return res.status(200).json({
      success: true,
      product:
        updatedProduct,
    });

  } catch (error) {

    console.error(
      "UPDATE PRODUCT ERROR:",
      error.message
    );

    next(error);
  }
};

// ============================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ADMIN
// ============================================================

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
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const referencedOrder = await Order.exists({
      "items.product": product._id,
    });

    if (referencedOrder) {
      product.isActive = false;
      await product.save();

      return res.status(200).json({
        success: true,
        message:
          "Product has existing order history and was archived instead of permanently deleted.",
        archived: true,
        product,
      });
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully.",
    });

  } catch (error) {

    console.error(
      "DELETE PRODUCT ERROR:",
      error.message
    );

    next(error);
  }
};

// ============================================================
// CREATE PRODUCT REVIEW
// POST /api/products/:id/reviews
// LOGIN REQUIRED
// ============================================================

const createProductReview = async (
  req,
  res,
  next
) => {
  try {

    const {
      rating,
      comment,
    } = req.body;
    const reviewCheck = validateReview({ rating, comment });
    if (!reviewCheck.valid) {
      return res.status(400).json({ success: false, message: reviewCheck.message });
    }

    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const reviewRating =
      reviewCheck.value.rating;

    if (
      Number.isNaN(
        reviewRating
      ) ||
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rating must be between 1 and 5.",
      });
    }

    if (!Array.isArray(product.reviews)) {
      product.reviews = [];
    }

    const hasPurchased = await Order.exists({
      user: req.user._id,
      status: "Delivered",
      "items.product": product._id,
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message:
          "You can review a product only after a delivered purchase.",
      });
    }

    const alreadyReviewed =
      product.reviews.find(
        (review) =>
          review.user &&
          review.user.toString() ===
            req.user._id.toString()
      );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message:
          "You have already reviewed this product.",
      });
    }

    const cleanComment = reviewCheck.value.comment;

    const review = {
      user: req.user._id,
      name: String(req.user.name || "User").trim().slice(0, 100),
      rating: reviewRating,
      comment: cleanComment,
    };

    product.reviews.push(
      review
    );

    product.numReviews =
      product.reviews.length;

    const totalRating =
      product.reviews.reduce(
        (sum, item) =>
          sum +
          Number(item.rating),
        0
      );

    product.rating =
      totalRating /
      product.reviews.length;

    await product.save();

    return res.status(201).json({
      success: true,
      message:
        "Review added successfully.",
      review:
        product.reviews[
          product.reviews.length - 1
        ],
      rating:
        product.rating,
      numReviews:
        product.numReviews,
    });

  } catch (error) {

    console.error(
      "CREATE REVIEW ERROR:",
      error.message
    );

    next(error);
  }
};

// ============================================================
// UPDATE PRODUCT REVIEW
// PUT /api/products/:id/reviews/:reviewId
// LOGIN REQUIRED
// ============================================================

const updateProductReview = async (
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
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const review =
      product.reviews.id(
        req.params.reviewId
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message:
          "Review not found.",
      });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own review.",
      });
    }

    const {
      rating,
      comment,
    } = req.body || {};

    if (rating !== undefined) {
      const newRating =
        Number(rating);

      if (
        !Number.isInteger(newRating) ||
        newRating < 1 ||
        newRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 1 and 5.",
        });
      }

      review.rating =
        newRating;
    }

    if (comment !== undefined) {
      const cleanComment = String(comment).trim();
      if (cleanComment.length > 1000) {
        return res.status(400).json({ success: false, message: "Review comment cannot exceed 1000 characters." });
      }
      review.comment = cleanComment;
    }

    // Recalculate
    const totalRating =
      product.reviews.reduce(
        (sum, item) =>
          sum +
          Number(item.rating),
        0
      );

    product.numReviews =
      product.reviews.length;

    product.rating =
      product.numReviews > 0
        ? totalRating /
          product.numReviews
        : 0;

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Review updated successfully.",
      review,
      rating:
        product.rating,
      numReviews:
        product.numReviews,
    });

  } catch (error) {

    console.error(
      "UPDATE REVIEW ERROR:",
      error.message
    );

    next(error);
  }
};

// ============================================================
// DELETE PRODUCT REVIEW
// DELETE /api/products/:id/reviews/:reviewId
// LOGIN REQUIRED
// ============================================================

const deleteProductReview = async (
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
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const review =
      product.reviews.id(
        req.params.reviewId
      );

    if (!review) {
      return res.status(404).json({
        success: false,
        message:
          "Review not found.",
      });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review.",
      });
    }

    product.reviews.pull(
      req.params.reviewId
    );

    product.numReviews =
      product.reviews.length;

    if (
      product.numReviews > 0
    ) {

      const totalRating =
        product.reviews.reduce(
          (sum, item) =>
            sum +
            Number(item.rating),
          0
        );

      product.rating =
        totalRating /
        product.numReviews;

    } else {

      product.rating = 0;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Review deleted successfully.",
      rating:
        product.rating,
      numReviews:
        product.numReviews,
    });

  } catch (error) {

    console.error(
      "DELETE REVIEW ERROR:",
      error.message
    );

    next(error);
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getProducts,
  getAdminProducts,
  updateProductStock,
  getSuggestions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  updateProductReview,
  deleteProductReview,
};