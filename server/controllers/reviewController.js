const Product = require("../models/Product");

// --------------------------------------------------
// CREATE REVIEW
// --------------------------------------------------

const createProductReview = async (req, res, next) => {
  try {
    const {
      rating,
      comment,
    } = req.body;

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const reviewRating = Number(rating);

    if (
      !reviewRating ||
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      res.status(400);
      throw new Error(
        "Rating must be between 1 and 5"
      );
    }

    // Check duplicate review
    const alreadyReviewed =
      product.reviews.find(
        (review) =>
          review.user.toString() ===
          req.user._id.toString()
      );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error(
        "You have already reviewed this product"
      );
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: reviewRating,
      comment: comment || "",
    };

    product.reviews.push(review);

    product.numReviews =
      product.reviews.length;

    product.rating =
      product.reviews.reduce(
        (sum, item) =>
          sum + Number(item.rating),
        0
      ) / product.numReviews;

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


// --------------------------------------------------
// ADMIN UPDATE REVIEW
// --------------------------------------------------

const updateProductReview = async (
  req,
  res,
  next
) => {
  try {
    const {
      rating,
      comment,
    } = req.body;

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const review = product.reviews.id(
      req.params.reviewId
    );

    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    // Update rating
    if (rating !== undefined) {
      const newRating = Number(rating);

      if (
        !newRating ||
        newRating < 1 ||
        newRating > 5
      ) {
        res.status(400);
        throw new Error(
          "Rating must be between 1 and 5"
        );
      }

      review.rating = newRating;
    }

    // Update comment
    if (comment !== undefined) {
      review.comment = comment;
    }

    // Recalculate rating
    product.numReviews =
      product.reviews.length;

    if (product.numReviews > 0) {
      product.rating =
        product.reviews.reduce(
          (sum, item) =>
            sum + Number(item.rating),
          0
        ) / product.numReviews;
    } else {
      product.rating = 0;
    }

    await product.save();

    res.status(200).json({
      message: "Review updated successfully",
      review,
      rating: product.rating,
      numReviews: product.numReviews,
    });

  } catch (error) {
    next(error);
  }
};


// --------------------------------------------------
// ADMIN DELETE REVIEW
// --------------------------------------------------

const deleteProductReview = async (
  req,
  res,
  next
) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const review = product.reviews.id(
      req.params.reviewId
    );

    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    // Remove review
    review.deleteOne();

    // Recalculate review count
    product.numReviews =
      product.reviews.length;

    // Recalculate rating
    if (product.numReviews > 0) {
      product.rating =
        product.reviews.reduce(
          (sum, item) =>
            sum + Number(item.rating),
          0
        ) / product.numReviews;
    } else {
      product.rating = 0;
    }

    await product.save();

    res.status(200).json({
      message: "Review deleted successfully",
      rating: product.rating,
      numReviews: product.numReviews,
    });

  } catch (error) {
    next(error);
  }
};


// --------------------------------------------------
// EXPORT
// --------------------------------------------------

module.exports = {
  createProductReview,
  updateProductReview,
  deleteProductReview,
};