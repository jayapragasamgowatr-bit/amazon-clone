import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { apiFetch } from "../../lib/api";
import useCartStore from "../../store/cartStore";
import { useAuth } from "../../context/AuthContext";

export default function ProductDetails() {
  const router = useRouter();
  const { id } = router.query;

  const { user } = useAuth();

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const [product, setProduct] = useState(null);

  const [similarProducts, setSimilarProducts] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState("");

  const [reviewLoading, setReviewLoading] =
    useState(false);

  // ==================================================
  // FETCH PRODUCT
  // ==================================================

  useEffect(() => {
    if (!id) return;

    fetchProduct();
    fetchSimilarProducts();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      const data = await apiFetch(
        `/api/products/${id}`
      );

      setProduct(data);
    } catch (error) {
      console.error(
        "FETCH PRODUCT ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Failed to load product"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // FETCH SIMILAR PRODUCTS
  // ==================================================

  const fetchSimilarProducts = async () => {
    try {
      const data = await apiFetch(
        "/api/products?page=1&limit=5"
      );

      const products = data.products || [];

      setSimilarProducts(
        products.filter(
          (item) => item._id !== id
        )
      );
    } catch (error) {
      console.error(
        "SIMILAR PRODUCTS ERROR:",
        error
      );
    }
  };

  // ==================================================
  // ADD TO WISHLIST
  // ==================================================

  const addWishlist = async () => {
    if (!user) {
      toast.error(
        "Please login first"
      );

      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    if (!token) {
      toast.error(
        "Session expired. Please login again."
      );

      return;
    }

    try {
      await apiFetch(
        `/api/wishlist/${product._id}`,
        {
          method: "POST",

          // apiFetch already adds the token.
          // This header is included explicitly
          // to make the request clear.
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      toast.success(
        "Added to wishlist ❤️"
      );
    } catch (error) {
      console.error(
        "WISHLIST ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Failed to add to wishlist"
      );
    }
  };

  // ==================================================
  // SUBMIT REVIEW
  // ==================================================

  const submitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(
        "Please login first"
      );

      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    if (!token) {
      toast.error(
        "Please login again"
      );

      return;
    }

    if (!comment.trim()) {
      toast.error(
        "Please write a review"
      );

      return;
    }

    const reviewRating =
      Number(rating);

    if (
      reviewRating < 1 ||
      reviewRating > 5
    ) {
      toast.error(
        "Rating must be between 1 and 5"
      );

      return;
    }

    try {
      setReviewLoading(true);

      console.log(
        "Submitting review..."
      );

      console.log(
        "Token exists:",
        !!token
      );

      console.log(
        "Token parts:",
        token.split(".").length
      );

      console.log(
        "Product ID:",
        id
      );

      const response =
        await apiFetch(
          `/api/products/${id}/reviews`,
          {
            method: "POST",

            /*
             * IMPORTANT:
             *
             * apiFetch() already reads:
             * localStorage.getItem("token")
             *
             * and automatically sends:
             *
             * Authorization: Bearer <token>
             */

            body: JSON.stringify({
              rating: reviewRating,
              comment:
                comment.trim(),
            }),
          }
        );

      console.log(
        "REVIEW RESPONSE:",
        response
      );

      toast.success(
        "Review added ⭐"
      );

      // Reset form
      setComment("");
      setRating(5);

      // Reload product to show
      // the newly added review
      await fetchProduct();
    } catch (error) {
      console.error(
        "REVIEW ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Failed to add review"
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px",
        }}
      >
        Loading product...
      </div>
    );
  }

  // ==================================================
  // PRODUCT NOT FOUND
  // ==================================================

  if (!product) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px",
        }}
      >
        Product not found
      </div>
    );
  }

  // ==================================================
  // MAIN PAGE
  // ==================================================

  return (
    <div
      style={{
        maxWidth: "1500px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      {/* ==========================================
          PRODUCT DETAILS
      ========================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.1fr 1fr",
          gap: "40px",
          padding: "30px",
          borderRadius: "24px",
          background:
            "rgba(255,255,255,0.08)",
          border:
            "1px solid rgba(255,255,255,0.15)",
          backdropFilter:
            "blur(14px)",
        }}
      >
        {/* ======================================
            IMAGE
        ====================================== */}

        <motion.div
          whileHover={{
            scale: 1.03,
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: "100%",
              height: "500px",
              objectFit: "contain",
              padding: "20px",
              background:
                "rgba(255,255,255,0.05)",
              borderRadius: "20px",
            }}
          />
        </motion.div>

        {/* ======================================
            PRODUCT INFO
        ====================================== */}

        <div>
          <h1
            style={{
              fontSize: "42px",
              marginBottom: "14px",
            }}
          >
            {product.name}
          </h1>

          <p
            style={{
              opacity: 0.8,
              lineHeight: "1.7",
            }}
          >
            {product.description}
          </p>

          {/* PRICE / RATING */}

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "20px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <h2>
              ₹{product.price}
            </h2>

            <span>
              ⭐{" "}
              {product.rating
                ? Number(
                    product.rating
                  ).toFixed(1)
                : "0.0"}
            </span>

            <span>
              (
              {product.numReviews ||
                0}{" "}
              reviews)
            </span>
          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "30px",
              flexWrap: "wrap",
            }}
          >
            {/* ADD TO CART */}

            <button
              onClick={() => {
                addToCart(product);

                toast.success(
                  "Added to cart"
                );
              }}
            >
              Add to Cart 🛒
            </button>

            {/* WISHLIST */}

            <button
              onClick={addWishlist}
            >
              Wishlist ❤️
            </button>
          </div>
        </div>
      </motion.div>

      {/* ==========================================
          REVIEW FORM
      ========================================== */}

      <div
        style={{
          marginTop: "50px",
          padding: "30px",
          borderRadius: "24px",
          background:
            "rgba(255,255,255,0.08)",
          border:
            "1px solid rgba(255,255,255,0.15)",
          backdropFilter:
            "blur(14px)",
        }}
      >
        <h2>
          Leave a Review
        </h2>

        {!user ? (
          <p
            style={{
              marginTop: "20px",
              opacity: 0.8,
            }}
          >
            Please login to write a
            review.
          </p>
        ) : (
          <form
            onSubmit={submitReview}
            style={{
              marginTop: "20px",
            }}
          >
            {/* RATING */}

            <select
              value={rating}
              onChange={(e) =>
                setRating(
                  Number(
                    e.target.value
                  )
                )
              }
              disabled={
                reviewLoading
              }
              style={{
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              <option value="5">
                5 Stars ⭐⭐⭐⭐⭐
              </option>

              <option value="4">
                4 Stars ⭐⭐⭐⭐
              </option>

              <option value="3">
                3 Stars ⭐⭐⭐
              </option>

              <option value="2">
                2 Stars ⭐⭐
              </option>

              <option value="1">
                1 Star ⭐
              </option>
            </select>

            {/* COMMENT */}

            <textarea
              rows="5"
              placeholder="Write your review..."
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
              required
              disabled={
                reviewLoading
              }
              style={{
                marginTop: "15px",
                width: "100%",
                padding: "15px",
                borderRadius: "10px",
                resize: "vertical",
              }}
            />

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                reviewLoading
              }
              style={{
                marginTop: "15px",
                opacity:
                  reviewLoading
                    ? 0.6
                    : 1,
              }}
            >
              {reviewLoading
                ? "Submitting..."
                : "Submit Review ⭐"}
            </button>
          </form>
        )}
      </div>

      {/* ==========================================
          CUSTOMER REVIEWS
      ========================================== */}

      <div
        style={{
          marginTop: "50px",
        }}
      >
        <h2>
          Customer Reviews
        </h2>

        {(!product.reviews ||
          product.reviews.length ===
            0) && (
          <p
            style={{
              marginTop: "20px",
              opacity: 0.7,
            }}
          >
            No reviews yet. Be the
            first to review this
            product.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {product.reviews?.map(
            (review) => (
              <motion.div
                key={
                  review._id ||
                  `${review.user}-${review.comment}`
                }
                whileHover={{
                  y: -4,
                }}
                className="glass-card"
                style={{
                  padding: "20px",
                }}
              >
                <h4>
                  {review.name}
                </h4>

                <p>
                  ⭐{" "}
                  {review.rating}
                </p>

                <p
                  style={{
                    opacity: 0.8,
                  }}
                >
                  {review.comment}
                </p>
              </motion.div>
            )
          )}
        </div>
      </div>

      {/* ==========================================
          SIMILAR PRODUCTS
      ========================================== */}

      <div
        style={{
          marginTop: "70px",
        }}
      >
        <h2>
          Similar Products
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5, 1fr)",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {similarProducts.map(
            (item) => (
              <LinkCard
                key={item._id}
                product={item}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ==================================================
// SIMILAR PRODUCT CARD
// ==================================================

function LinkCard({ product }) {
  return (
    <motion.a
      whileHover={{
        y: -8,
      }}
      href={`/product/${product._id}`}
      className="product-card"
      style={{
        padding: "18px",
        display: "block",
      }}
    >
      <img
        src={product.image}
        alt={product.name}
        style={{
          height: "180px",
          width: "100%",
          objectFit: "contain",
          background:
            "rgba(255,255,255,0.05)",
          padding: "10px",
        }}
      />

      <h4
        style={{
          marginTop: "14px",
        }}
      >
        {product.name}
      </h4>

      <p>
        ₹{product.price}
      </p>
    </motion.a>
  );
}