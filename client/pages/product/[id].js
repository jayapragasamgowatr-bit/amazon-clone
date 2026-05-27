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

  const [product, setProduct] =
    useState(null);

  const [similarProducts, setSimilarProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState("");

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchSimilarProducts();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await apiFetch(
        `/api/products/${id}`
      );

      setProduct(data);

    } catch (error) {
      toast.error(
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts =
    async () => {
      try {
        const data =
          await apiFetch(
            "/api/products?page=1&limit=5"
          );

        setSimilarProducts(
          data.products.filter(
            (item) =>
              item._id !== id
          )
        );

      } catch (error) {
        console.log(error);
      }
    };

  const addWishlist = async () => {
    if (!user) {
      toast.error(
        "Please login first"
      );
      return;
    }

    try {
      await apiFetch(
        `/api/wishlist/${product._id}`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${user.token}`,
          },
        }
      );

      toast.success(
        "Added to wishlist ❤️"
      );

    } catch (error) {
      toast.error(
        error.message
      );
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(
        "Please login first"
      );
      return;
    }

    try {
      await apiFetch(
        `/api/products/${id}/reviews`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            rating,
            comment,
          }),
        }
      );

      toast.success(
        "Review added ⭐"
      );

      setComment("");
      setRating(5);

      fetchProduct();

    } catch (error) {
      toast.error(
        error.message
      );
    }
  };

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

  return (
    <div
      style={{
        maxWidth: "1500px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      {/* TOP */}
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
        {/* IMAGE */}
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

        {/* INFO */}
        <div>
          <h1
            style={{
              fontSize: "42px",
              marginBottom:
                "14px",
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

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "20px",
              alignItems:
                "center",
            }}
          >
            <h2>
              ₹{product.price}
            </h2>

            <span>
              ⭐{" "}
              {product.rating?.toFixed(
                1
              ) || "0.0"}
            </span>

            <span>
              (
              {product.numReviews ||
                0}{" "}
              reviews)
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "30px",
            }}
          >
            <button
              onClick={() => {
                addToCart(
                  product
                );
                toast.success(
                  "Added to cart"
                );
              }}
            >
              Add to Cart
            </button>

            <button
              onClick={
                addWishlist
              }
            >
              Wishlist ❤️
            </button>
          </div>
        </div>
      </motion.div>

      {/* REVIEW FORM */}
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

        <form
          onSubmit={
            submitReview
          }
          style={{
            marginTop: "20px",
          }}
        >
          <select
            value={rating}
            onChange={(e) =>
              setRating(
                Number(
                  e.target.value
                )
              )
            }
          >
            <option value="5">
              5 Stars
            </option>
            <option value="4">
              4 Stars
            </option>
            <option value="3">
              3 Stars
            </option>
            <option value="2">
              2 Stars
            </option>
            <option value="1">
              1 Star
            </option>
          </select>

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
            style={{
              marginTop:
                "15px",
            }}
          />

          <button
            type="submit"
            style={{
              marginTop:
                "15px",
            }}
          >
            Submit Review
          </button>
        </form>
      </div>

      {/* REVIEWS */}
      <div
        style={{
          marginTop: "50px",
        }}
      >
        <h2>
          Customer Reviews
        </h2>

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
                  review._id
                }
                whileHover={{
                  y: -4,
                }}
                className="glass-card"
                style={{
                  padding:
                    "20px",
                }}
              >
                <h4>
                  {
                    review.name
                  }
                </h4>

                <p>
                  ⭐{" "}
                  {
                    review.rating
                  }
                </p>

                <p
                  style={{
                    opacity:
                      0.8,
                  }}
                >
                  {
                    review.comment
                  }
                </p>
              </motion.div>
            )
          )}
        </div>
      </div>

      {/* SIMILAR */}
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
              "repeat(5,1fr)",
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

function LinkCard({
  product,
}) {
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
          objectFit:
            "contain",
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