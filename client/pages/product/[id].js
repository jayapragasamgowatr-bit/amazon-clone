import SEO from "../../components/SEO";

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

import { apiFetch } from "../../lib/api";
import useCartStore from "../../store/cartStore";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";

function isValidObjectId(value) {
  return (
    typeof value === "string" &&
    /^[a-fA-F0-9]{24}$/.test(value)
  );
}

export default function ProductDetails() {
  const router = useRouter();

  const { id } = router.query;

  const { user } = useAuth();

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const {
    toggleWishlist,
    isWishlisted,
  } = useWishlist();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [similarLoading, setSimilarLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const [imageError, setImageError] = useState(false);

  /*
  ============================================================
  FETCH PRODUCT
  ============================================================
  */

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const productId = Array.isArray(id)
      ? id[0]
      : id;

    console.log(
      "PRODUCT PAGE ID:",
      productId
    );

    if (!productId) {
      setLoading(false);
      return;
    }

    if (!isValidObjectId(productId)) {
      console.error(
        "INVALID PRODUCT ID:",
        productId
      );

      setProduct(null);
      setLoading(false);
      return;
    }

    fetchProduct(productId);
    fetchSimilarProducts(productId);
  }, [router.isReady, id]);

  /*
  ============================================================
  GET SINGLE PRODUCT
  ============================================================
  */

  const fetchProduct = async (productId) => {
    try {
      setLoading(true);

      const data = await apiFetch(
        `/api/products/${productId}`
      );

      console.log(
        "PRODUCT API RESPONSE:",
        data
      );

      const productData =
        data?.product || data;

      if (
        !productData ||
        !productData._id
      ) {
        console.error(
          "INVALID PRODUCT RESPONSE:",
          data
        );

        setProduct(null);
        return;
      }

      setProduct(productData);

      setSelectedImage(0);
      setQuantity(1);
      setImageError(false);
    } catch (error) {
      console.error(
        "FETCH PRODUCT ERROR:",
        error
      );

      setProduct(null);

      toast.error(
        error?.message ||
          "Failed to load product"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  ============================================================
  RELATED PRODUCTS
  ============================================================
  */

  const fetchSimilarProducts = async (
    productId
  ) => {
    try {
      setSimilarLoading(true);

      const data = await apiFetch(
        "/api/products?page=1&limit=8"
      );

      const products = Array.isArray(
        data?.products
      )
        ? data.products
        : Array.isArray(data)
        ? data
        : [];

      setSimilarProducts(
        products.filter(
          (item) =>
            item?._id &&
            item._id !== productId
        )
      );
    } catch (error) {
      console.error(
        "RELATED PRODUCTS ERROR:",
        error
      );

      setSimilarProducts([]);
    } finally {
      setSimilarLoading(false);
    }
  };

  /*
  ============================================================
  PRODUCT IMAGES
  ============================================================
  */

  const productImages = useMemo(() => {
    if (!product) {
      return [];
    }

    let images = [];

    if (Array.isArray(product.images)) {
      images = [...product.images];
    }

    if (
      product.image &&
      !images.includes(product.image)
    ) {
      images.unshift(product.image);
    }

    return images.filter(
      (image) =>
        typeof image === "string" &&
        image.trim() !== ""
    );
  }, [product]);

  const currentImage =
    productImages[selectedImage] ||
    product?.image ||
    "";

  /*
  ============================================================
  STOCK
  ============================================================
  */

  const stock = Number(
    product?.countInStock ?? 0
  );

  const isOutOfStock = stock <= 0;

  const maxQuantity = Math.max(
    stock,
    1
  );

  /*
  ============================================================
  WISHLIST
  ============================================================
  */

  const wishlisted = product
    ? isWishlisted(product._id)
    : false;

  const handleWishlist = async () => {
    if (!product) {
      return;
    }

    if (!user) {
      toast.error(
        "Please login first"
      );
      return;
    }

    try {
      await toggleWishlist(
        product._id
      );

      toast.success(
        wishlisted
          ? "Removed from wishlist"
          : "Added to wishlist ❤️"
      );
    } catch (error) {
      console.error(
        "WISHLIST ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to update wishlist"
      );
    }
  };

  /*
  ============================================================
  QUANTITY
  ============================================================
  */

  const decreaseQuantity = () => {
    setQuantity((prev) =>
      Math.max(1, prev - 1)
    );
  };

  const increaseQuantity = () => {
    if (isOutOfStock) {
      return;
    }

    setQuantity((prev) =>
      Math.min(
        maxQuantity,
        prev + 1
      )
    );
  };

  /*
  ============================================================
  ADD TO CART
  ============================================================
  */

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    if (isOutOfStock) {
      toast.error(
        "Product is out of stock"
      );
      return;
    }

    if (quantity > stock) {
      toast.error(
        `Only ${stock} item${
          stock === 1 ? "" : "s"
        } available`
      );

      setQuantity(stock);
      return;
    }

    try {
      addToCart(
        product,
        quantity
      );

      toast.success(
        `${quantity} ${
          quantity === 1
            ? "item"
            : "items"
        } added to cart`
      );
    } catch (error) {
      console.error(
        "ADD CART ERROR:",
        error
      );

      toast.error(
        "Unable to add product to cart"
      );
    }
  };

  /*
  ============================================================
  REVIEW
  ============================================================
  */

  const submitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(
        "Please login first"
      );
      return;
    }

    if (!product?._id) {
      toast.error(
        "Product information is missing"
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

      await apiFetch(
        `/api/products/${product._id}/reviews`,
        {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            rating: reviewRating,
            comment: comment.trim(),
          }),
        }
      );

      toast.success(
        "Review added ⭐"
      );

      setComment("");
      setRating(5);

      await fetchProduct(
        product._id
      );
    } catch (error) {
      console.error(
        "REVIEW ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to add review"
      );
    } finally {
      setReviewLoading(false);
    }
  };

  /*
  ============================================================
  IMAGE NAVIGATION
  ============================================================
  */

  const previousImage = () => {
    if (productImages.length <= 1) {
      return;
    }

    setSelectedImage((prev) =>
      prev === 0
        ? productImages.length - 1
        : prev - 1
    );

    setImageError(false);
  };

  const nextImage = () => {
    if (productImages.length <= 1) {
      return;
    }

    setSelectedImage((prev) =>
      prev ===
      productImages.length - 1
        ? 0
        : prev + 1
    );

    setImageError(false);
  };

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (
    !router.isReady ||
    loading
  ) {
    return (
      <div className="loading-page">
        <div className="loader" />
        <h3>
          Loading product...
        </h3>

        <style jsx>{`
          .loading-page {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .loader {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            border: 4px solid
              rgba(14, 165, 233, 0.15);
            border-top-color: #0284c7;
            animation: spin 0.8s linear infinite;
            margin-bottom: 18px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  /*
  ============================================================
  INVALID ID
  ============================================================
  */

  const productId = Array.isArray(id)
    ? id[0]
    : id;

  if (
    !isValidObjectId(productId)
  ) {
    return (
      <ErrorPage
        title="Invalid Product"
        message="The product URL is invalid."
      />
    );
  }

  /*
  ============================================================
  PRODUCT NOT FOUND
  ============================================================
  */

  if (!product) {
    return (
      <ErrorPage
        title="Product not found"
        message="The product may have been removed or is unavailable."
      />
    );
  }

  /*
  ============================================================
  PRODUCT DATA
  ============================================================
  */

  const specifications =
    product.specifications ||
    product.specs ||
    {};

  const applications =
    Array.isArray(
      product.applications
    )
      ? product.applications
      : [
          "STP Plants",
          "ETP Plants",
          "WTP Plants",
          "RO Plants",
          "Apartments",
          "Industries",
          "Commercial Buildings",
        ];

  const features =
    Array.isArray(
      product.features
    )
      ? product.features
      : [
          "Real-time monitoring",
          "Reliable measurement",
          "Industrial-grade design",
          "Easy installation",
          "Low maintenance",
          "Suitable for water management applications",
        ];

  /*
  ============================================================
  MAIN PAGE
  ============================================================
  */

  return (
    <>
      <SEO
        title={`${product?.name || "Product"} | Waventra Vetric`}
        description={product?.description || "View product details."}
        path={router.asPath?.split("?")[0] || `/product/${id || ""}`}
      />

      <div className="page">
      <Link
        href="/"
        className="back-link"
      >
        <ArrowLeft size={17} />
        Back to Products
      </Link>

      <motion.section
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="hero"
      >
        {/* IMAGE */}

        <div className="gallery">
          <div className="main-image">
            {currentImage &&
            !imageError ? (
              <img
                src={currentImage}
                alt={
                  product.name ||
                  "Product"
                }
                onError={() =>
                  setImageError(true)
                }
              />
            ) : (
              <div className="no-image">
                <ShoppingCart
                  size={55}
                />
                <p>
                  Image unavailable
                </p>
              </div>
            )}

            {productImages.length >
              1 && (
              <>
                <button
                  type="button"
                  className="image-arrow left"
                  onClick={
                    previousImage
                  }
                >
                  <ChevronLeft
                    size={22}
                  />
                </button>

                <button
                  type="button"
                  className="image-arrow right"
                  onClick={
                    nextImage
                  }
                >
                  <ChevronRight
                    size={22}
                  />
                </button>
              </>
            )}

            <div
              className={`stock-badge ${
                isOutOfStock
                  ? "out"
                  : "in"
              }`}
            >
              {isOutOfStock
                ? "Out of Stock"
                : stock <= 5
                ? `Only ${stock} left`
                : "In Stock"}
            </div>
          </div>

          {productImages.length >
            1 && (
            <div className="thumbnails">
              {productImages.map(
                (image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={
                      selectedImage ===
                      index
                        ? "thumbnail active"
                        : "thumbnail"
                    }
                    onClick={() => {
                      setSelectedImage(
                        index
                      );
                      setImageError(
                        false
                      );
                    }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${
                        index + 1
                      }`}
                    />
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* INFORMATION */}

        <div className="information">
          {product.category && (
            <div className="category">
              {product.category}
            </div>
          )}

          <h1>
            {product.name}
          </h1>

          <p className="description">
            {product.description ||
              "Product description will be available soon."}
          </p>

          <div className="rating">
            <Star
              size={18}
              fill="currentColor"
            />

            <strong>
              {product.rating
                ? Number(
                    product.rating
                  ).toFixed(1)
                : "0.0"}
            </strong>

            <span>
              {product.numReviews ||
                product.reviews
                  ?.length ||
                0}{" "}
              reviews
            </span>
          </div>

          <div className="price">
            <span>
              Price
            </span>

            <strong>
              ₹
              {Number(
                product.price || 0
              ).toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          <div
            className={`stock ${
              isOutOfStock
                ? "stock-out"
                : ""
            }`}
          >
            <strong>
              {isOutOfStock
                ? "Currently unavailable"
                : "✓ Available"}
            </strong>

            {!isOutOfStock && (
              <span>
                {stock} unit
                {stock !== 1
                  ? "s"
                  : ""}{" "}
                available
              </span>
            )}
          </div>

          {!isOutOfStock && (
            <div className="quantity">
              <strong>
                Quantity
              </strong>

              <div className="quantity-control">
                <button
                  type="button"
                  disabled={
                    quantity <= 1
                  }
                  onClick={
                    decreaseQuantity
                  }
                >
                  <Minus
                    size={16}
                  />
                </button>

                <strong>
                  {quantity}
                </strong>

                <button
                  type="button"
                  disabled={
                    quantity >=
                    maxQuantity
                  }
                  onClick={
                    increaseQuantity
                  }
                >
                  <Plus
                    size={16}
                  />
                </button>
              </div>
            </div>
          )}

          <div className="actions">
            <button
              type="button"
              className="cart-button"
              disabled={
                isOutOfStock
              }
              onClick={
                handleAddToCart
              }
            >
              <ShoppingCart
                size={19}
              />

              {isOutOfStock
                ? "Out of Stock"
                : "Add to Cart"}
            </button>

            <button
              type="button"
              className="wishlist-button"
              onClick={
                handleWishlist
              }
            >
              <Heart
                size={20}
                fill={
                  wishlisted
                    ? "#ef4444"
                    : "transparent"
                }
                color={
                  wishlisted
                    ? "#ef4444"
                    : "currentColor"
                }
              />

              {wishlisted
                ? "Wishlisted"
                : "Wishlist"}
            </button>
          </div>

          <div className="benefits">
            <InfoBox
              icon="✓"
              title="Reliable"
              text="Industrial application"
            />

            <InfoBox
              icon="⚡"
              title="Efficient"
              text="Designed for monitoring"
            />

            <InfoBox
              icon="🔧"
              title="Easy Setup"
              text="Simple installation"
            />

            <InfoBox
              icon="💧"
              title="Water Focused"
              text="Built for water systems"
            />
          </div>
        </div>
      </motion.section>

      {/* OVERVIEW */}

      <Section
        title="Product Overview"
        subtitle="Designed for modern water monitoring and management applications."
      >
        <p className="section-text">
          {product.description ||
            "Detailed product information will be available soon."}
        </p>
      </Section>

      {/* SPECIFICATIONS */}

      <Section
        title="Technical Specifications"
        subtitle="Key technical information for installation and system integration."
      >
        {Object.keys(
          specifications
        ).length > 0 ? (
          <div className="spec-grid">
            {Object.entries(
              specifications
            ).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="spec-card"
                >
                  <strong>
                    {formatLabel(
                      key
                    )}
                  </strong>

                  <span>
                    {String(
                      value
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="muted">
            Technical specifications
            will be available soon.
          </p>
        )}
      </Section>

      {/* FEATURES */}

      <Section
        title="Key Features"
        subtitle="Built for reliable and practical water management."
      >
        <div className="feature-grid">
          {features.map(
            (feature, index) => (
              <motion.div
                key={`${feature}-${index}`}
                whileHover={{
                  y: -4,
                }}
                className="feature-card"
              >
                <div>
                  ✓
                </div>

                <strong>
                  {feature}
                </strong>
              </motion.div>
            )
          )}
        </div>
      </Section>

      {/* APPLICATIONS */}

      <Section
        title="Applications"
        subtitle="Suitable for a wide range of water and industrial environments."
      >
        <div className="application-grid">
          {applications.map(
            (
              application,
              index
            ) => (
              <div
                key={`${application}-${index}`}
                className="application-card"
              >
                💧{" "}
                {application}
              </div>
            )
          )}
        </div>
      </Section>

      {/* REVIEWS */}

      <Section
        title="Customer Reviews"
        subtitle="Share your experience with this product."
      >
        {!user ? (
          <div className="login-box">
            <p>
              Please login to
              write a review.
            </p>

            <Link
              href="/login"
              className="login-button"
            >
              Login
            </Link>
          </div>
        ) : (
          <form
            onSubmit={
              submitReview
            }
            className="review-form"
          >
            <label>
              Rating
            </label>

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
            >
              <option value={5}>
                5 Stars ⭐⭐⭐⭐⭐
              </option>

              <option value={4}>
                4 Stars ⭐⭐⭐⭐
              </option>

              <option value={3}>
                3 Stars ⭐⭐⭐
              </option>

              <option value={2}>
                2 Stars ⭐⭐
              </option>

              <option value={1}>
                1 Star ⭐
              </option>
            </select>

            <label>
              Your Review
            </label>

            <textarea
              rows={5}
              placeholder="Write your review..."
              value={comment}
              onChange={(e) =>
                setComment(
                  e.target.value
                )
              }
              disabled={
                reviewLoading
              }
              required
            />

            <button
              type="submit"
              disabled={
                reviewLoading
              }
              className="submit-review"
            >
              {reviewLoading
                ? "Submitting..."
                : "Submit Review ⭐"}
            </button>
          </form>
        )}

        <div className="reviews">
          {!product.reviews ||
          product.reviews.length ===
            0 ? (
            <p className="muted">
              No reviews yet. Be
              the first to review
              this product.
            </p>
          ) : (
            product.reviews.map(
              (
                review,
                index
              ) => (
                <motion.div
                  key={
                    review._id ||
                    `${review.user}-${review.comment}-${index}`
                  }
                  whileHover={{
                    y: -3,
                  }}
                  className="review-card"
                >
                  <div className="review-header">
                    <strong>
                      {review.name ||
                        review.user
                          ?.name ||
                        "Customer"}
                    </strong>

                    <span>
                      {"⭐".repeat(
                        Math.min(
                          5,
                          Math.max(
                            0,
                            Number(
                              review.rating
                            ) || 0
                          )
                        )
                      )}
                    </span>
                  </div>

                  <p>
                    {
                      review.comment
                    }
                  </p>
                </motion.div>
              )
            )
          )}
        </div>
      </Section>

      {/* RELATED PRODUCTS */}

      {!similarLoading &&
        similarProducts.length >
          0 && (
          <Section
            title="Related Products"
            subtitle="Explore other products that may be useful for your application."
          >
            <div className="related-grid">
              {similarProducts.map(
                (item) => (
                  <RelatedProduct
                    key={item._id}
                    product={item}
                  />
                )
              )}
            </div>
          </Section>
        )}

      <style jsx>{`
        .page {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 30px 20px 70px;
          box-sizing: border-box;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 20px;
          color: inherit;
          text-decoration: none;
          opacity: 0.7;
          font-weight: 600;
        }

        .hero {
          display: grid;
          grid-template-columns:
            minmax(0, 1.05fr)
            minmax(0, 1fr);
          gap: 45px;
          padding: 30px;
          border-radius: 28px;
          background: rgba(
            255,
            255,
            255,
            0.07
          );
          border: 1px solid rgba(
            255,
            255,
            255,
            0.12
          );
          backdrop-filter: blur(16px);
        }

        .gallery {
          min-width: 0;
        }

        .main-image {
          height: 520px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(
            255,
            255,
            255,
            0.04
          );
          border-radius: 22px;
          overflow: hidden;
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 30px;
          box-sizing: border-box;
        }

        .no-image {
          text-align: center;
          opacity: 0.5;
        }

        .image-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid
            rgba(255,255,255,0.15);
          background: rgba(
            0,
            0,
            0,
            0.35
          );
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
        }

        .image-arrow.left {
          left: 15px;
        }

        .image-arrow.right {
          right: 15px;
        }

        .stock-badge {
          position: absolute;
          top: 15px;
          left: 15px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .stock-badge.in {
          background: rgba(
            22,
            163,
            74,
            0.15
          );
          color: #22c55e;
        }

        .stock-badge.out {
          background: rgba(
            239,
            68,
            68,
            0.15
          );
          color: #ef4444;
        }

        .thumbnails {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-top: 14px;
        }

        .thumbnail {
          flex: 0 0 75px;
          height: 75px;
          padding: 4px;
          border-radius: 12px;
          border: 2px solid transparent;
          background: rgba(
            255,
            255,
            255,
            0.05
          );
          cursor: pointer;
        }

        .thumbnail.active {
          border-color: #0284c7;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 8px;
        }

        .information {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .category {
          width: fit-content;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(
            59,
            130,
            246,
            0.15
          );
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .information h1 {
          font-size: clamp(
            32px,
            4vw,
            52px
          );
          line-height: 1.1;
          font-weight: 900;
          margin: 0;
        }

        .description {
          margin-top: 18px;
          opacity: 0.78;
          line-height: 1.8;
          font-size: 16px;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
        }

        .rating svg {
          color: #f59e0b;
        }

        .rating span {
          opacity: 0.6;
          margin-left: 8px;
        }

        .price {
          margin-top: 24px;
        }

        .price span {
          display: block;
          font-size: 14px;
          opacity: 0.6;
        }

        .price strong {
          display: block;
          font-size: 34px;
          font-weight: 900;
          margin-top: 4px;
        }

        .stock {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-top: 15px;
          padding: 12px 15px;
          border-radius: 12px;
          background: rgba(
            34,
            197,
            94,
            0.08
          );
        }

        .stock strong {
          color: #22c55e;
        }

        .stock span {
          font-size: 13px;
          opacity: 0.6;
        }

        .stock.stock-out {
          background: rgba(
            239,
            68,
            68,
            0.08
          );
        }

        .stock.stock-out strong {
          color: #ef4444;
        }

        .quantity {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
        }

        .quantity-control {
          display: flex;
          align-items: center;
          gap: 18px;
          border: 1px solid
            rgba(
              148,
              163,
              184,
              0.25
            );
          border-radius: 10px;
          padding: 5px;
        }

        .quantity-control button {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 7px;
          background: rgba(
            255,
            255,
            255,
            0.08
          );
          color: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quantity-control button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .actions {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .actions button {
          min-height: 50px;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .cart-button {
          border: none;
          background: linear-gradient(
            135deg,
            #0284c7,
            #0369a1
          );
          color: white;
        }

        .cart-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .wishlist-button {
          background: rgba(
            255,
            255,
            255,
            0.06
          );
          color: inherit;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
        }

        .benefits {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 12px;
          margin-top: 28px;
        }

        .section-text {
          line-height: 1.9;
          opacity: 0.78;
        }

        .spec-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(280px, 1fr)
            );
          gap: 12px;
        }

        .spec-card {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 18px;
          border-radius: 14px;
          background: rgba(
            255,
            255,
            255,
            0.05
          );
        }

        .spec-card span {
          opacity: 0.75;
          text-align: right;
        }

        .muted {
          opacity: 0.6;
        }

        .feature-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(240px, 1fr)
            );
          gap: 16px;
        }

        .feature-card {
          padding: 20px;
          border-radius: 18px;
          background: rgba(
            255,
            255,
            255,
            0.05
          );
        }

        .feature-card div {
          font-size: 22px;
          color: #22c55e;
          margin-bottom: 10px;
        }

        .application-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(180px, 1fr)
            );
          gap: 14px;
        }

        .application-card {
          padding: 18px;
          border-radius: 16px;
          text-align: center;
          background: rgba(
            59,
            130,
            246,
            0.08
          );
          font-weight: 700;
        }

        .login-box {
          padding: 20px;
          border-radius: 16px;
          background: rgba(
            255,
            255,
            255,
            0.05
          );
        }

        .login-button {
          display: inline-block;
          margin-top: 10px;
          padding: 10px 18px;
          border-radius: 9px;
          background: #0284c7;
          color: white;
          text-decoration: none;
          font-weight: 700;
        }

        .review-form {
          display: flex;
          flex-direction: column;
          max-width: 700px;
        }

        .review-form label {
          margin-bottom: 7px;
          font-weight: 700;
        }

        .review-form select,
        .review-form textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid
            rgba(
              148,
              163,
              184,
              0.25
            );
          background: rgba(
            255,
            255,
            255,
            0.05
          );
          color: inherit;
        }

        .review-form textarea {
          margin-top: 15px;
          resize: vertical;
        }

        .submit-review {
          align-self: flex-start;
          margin-top: 15px;
          padding: 12px 22px;
          border: none;
          border-radius: 10px;
          background: #0284c7;
          color: white;
          font-weight: 800;
          cursor: pointer;
        }

        .reviews {
          display: grid;
          gap: 16px;
          margin-top: 35px;
        }

        .review-card {
          padding: 20px;
          border-radius: 18px;
          background: rgba(
            255,
            255,
            255,
            0.05
          );
        }

        .review-header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .review-card p {
          line-height: 1.7;
          opacity: 0.78;
        }

        .related-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fit,
              minmax(190px, 1fr)
            );
          gap: 18px;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            gap: 30px;
            padding: 20px;
          }

          .main-image {
            height: 430px;
          }
        }

        @media (max-width: 600px) {
          .page {
            padding: 20px 14px 50px;
          }

          .hero {
            padding: 14px;
          }

          .main-image {
            height: 320px;
          }

          .actions {
            grid-template-columns: 1fr;
          }

          .benefits {
            grid-template-columns: 1fr;
          }

          .spec-grid {
            grid-template-columns: 1fr;
          }

          .spec-card {
            flex-direction: column;
          }

          .spec-card span {
            text-align: left;
          }
        }
      `}</style>
      </div>
    </>
  );
}

/*
============================================================
SECTION
============================================================
*/

function Section({
  title,
  subtitle,
  children,
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 15,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.35,
      }}
      style={{
        marginTop: "45px",
        padding: "30px",
        borderRadius: "24px",
        background:
          "rgba(255,255,255,0.06)",
        border:
          "1px solid rgba(255,255,255,0.10)",
        backdropFilter:
          "blur(14px)",
      }}
    >
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "800",
          margin: 0,
        }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          style={{
            marginTop: "8px",
            opacity: 0.6,
            marginBottom: "25px",
          }}
        >
          {subtitle}
        </p>
      )}

      {children}
    </motion.section>
  );
}

/*
============================================================
INFO BOX
============================================================
*/

function InfoBox({
  icon,
  title,
  text,
}) {
  return (
    <div
      style={{


        padding: "14px",
        borderRadius: "14px",
        background:
          "rgba(255,255,255,0.04)",
        border:
          "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: "18px",
        }}
      >
        {icon}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: "5px",
        }}
      >
        {title}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: "3px",
          fontSize: "12px",
          opacity: 0.6,
        }}
      >
        {text}
      </span>
    </div>
  );
}

/*
============================================================
FORMAT LABEL
============================================================
*/

function formatLabel(value) {
  return String(value)
    .replace(
      /([A-Z])/g,
      " $1"
    )
    .replace(
      /[_-]/g,
      " "
    )
    .replace(
      /^./,
      (str) =>
        str.toUpperCase()
    );
}

/*
============================================================
ERROR PAGE
============================================================
*/

function ErrorPage({
  title,
  message,
}) {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div>
        <h2>
          {title}
        </h2>

        <p
          style={{
            opacity: 0.6,
            marginTop: "10px",
          }}
        >
          {message}
        </p>

        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "20px",
            padding: "12px 18px",
            borderRadius: "10px",
            background: "#0284c7",
            color: "#fff",
            textDecoration: "none",
            fontWeight: "700",
          }}
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>
      </div>
      </div>
  );
}

/*
============================================================
RELATED PRODUCT
============================================================
*/

function RelatedProduct({
  product,
}) {
  if (
    !product ||
    !isValidObjectId(product._id)
  ) {
    return null;
  }

  return (
    <Link
      href={`/product/${product._id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <motion.div
        whileHover={{
          y: -6,
        }}
        style={{
          height: "100%",
          padding: "14px",
          borderRadius: "18px",
          background:
            "rgba(255,255,255,0.05)",
          border:
            "1px solid rgba(255,255,255,0.08)",
          boxSizing: "border-box",
        }}
      >
        <img
          src={product.image || ""}
          alt={
            product.name ||
            "Product"
          }
          style={{
            width: "100%",
            height: "180px",
            objectFit: "contain",
            borderRadius: "12px",
            background:
              "rgba(255,255,255,0.04)",
          }}
        />

        <h4
          style={{
            marginTop: "14px",
            lineHeight: "1.4",
            marginBottom: "7px",
          }}
        >
          {product.name}
        </h4>

        <p
          style={{
            fontWeight: "800",
            margin: 0,
          }}
        >
          ₹
          {Number(
            product.price || 0
          ).toLocaleString(
            "en-IN"
          )}
        </p>

        {Number(
          product.countInStock || 0
        ) > 0 ? (
          <small
            style={{
              display: "block",
              marginTop: "7px",
              color: "#22c55e",
            }}
          >
            In Stock
          </small>
        ) : (
          <small
            style={{
              display: "block",
              marginTop: "7px",
              color: "#ef4444",
            }}
          >
            Out of Stock
          </small>
        )}
      </motion.div>
    </Link>
  );
}