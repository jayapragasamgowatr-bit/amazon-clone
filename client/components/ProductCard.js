"use client";

import Link from "next/link";

import {
  motion,
} from "framer-motion";

import {
  Heart,
  ShoppingCart,
  Star,
} from "lucide-react";

import toast from "react-hot-toast";
import { trackEvent } from "../lib/eventTracker";

import useCartStore from "../store/cartStore";

import {
  useWishlist,
} from "../context/WishlistContext";

export default function ProductCard({
  product,
}) {

  const addToCart =
    useCartStore(
      (state) =>
        state.addToCart
    );

  const {
    toggleWishlist,
    isWishlisted,
  } = useWishlist();

  if (!product) {
    return null;
  }

  const productId =
    product._id ||
    product.id;

  const stock =
    Number(
      product.countInStock ?? 0
    );

  const isOutOfStock =
    stock <= 0;

  const wishlisted =
    typeof isWishlisted ===
    "function"
      ? isWishlisted(
          productId
        )
      : false;

  const rating =
    Number(
      product.rating || 0
    );

  const reviewCount =
    Number(
      product.numReviews ??
        product.reviews
          ?.length ??
        0
    );

  // ==========================================================
  // CART
  // ==========================================================

  const handleAddToCart =
    (e) => {

      e.preventDefault();
      e.stopPropagation();

      if (isOutOfStock) {
        toast.error(
          "Product is out of stock"
        );

        return;
      }

      try {

        addToCart(product);

        trackEvent("cart_add", { productId, category: product.category, metadata: { quantity: 1, source: "product_card" } });

        toast.success(
          "Added to cart 🛒"
        );

      } catch (error) {

        console.error(
          "ADD TO CART ERROR:",
          error
        );

        toast.error(
          "Unable to add to cart"
        );
      }
    };

  // ==========================================================
  // WISHLIST
  // ==========================================================

  const handleWishlist =
    async (e) => {

      e.preventDefault();
      e.stopPropagation();

      try {

        const wasWishlisted =
          wishlisted;

        await toggleWishlist(
          productId
        );

        trackEvent(wasWishlisted ? "wishlist_remove" : "wishlist_add", { productId, category: product.category, metadata: { source: "product_card" } });

        toast.success(
          wasWishlisted
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

  return (
    <motion.article
      whileHover={{
        y: -6,
        scale: 1.01,
      }}
      transition={{
        duration: 0.2,
      }}
      className="product-card glass-card"
      style={{
        position:
          "relative",
        overflow:
          "hidden",
        width:
          "100%",
        height:
          "100%",
        boxSizing:
          "border-box",
        padding:
          "12px",
      }}
    >

      {/* =====================================================
          WISHLIST BUTTON
      ===================================================== */}

      <button
        type="button"
        onClick={
          handleWishlist
        }
        aria-label={
          wishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        style={{
          position:
            "absolute",
          top:
            "10px",
          right:
            "10px",
          width:
            "40px",
          height:
            "40px",
          borderRadius:
            "50%",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          background:
            "rgba(0,0,0,0.35)",
          backdropFilter:
            "blur(10px)",
          border:
            "1px solid rgba(255,255,255,0.12)",
          zIndex:
            20,
          cursor:
            "pointer",
          padding:
            0,
        }}
      >
        <Heart
          size={20}
          strokeWidth={2}
          fill={
            wishlisted
              ? "#ef4444"
              : "transparent"
          }
          color={
            wishlisted
              ? "#ef4444"
              : "white"
          }
        />
      </button>

      {/* =====================================================
          PRODUCT
      ===================================================== */}

      <Link
        href={`/product/${productId}`}
        onClick={() => trackEvent("product_view", { productId, category: product.category, metadata: { source: "product_card" } })}
        style={{
          display:
            "block",
          color:
            "inherit",
          textDecoration:
            "none",
        }}
      >

        {/* IMAGE */}

        <div
          style={{
            position:
              "relative",
            width:
              "100%",
          }}
        >
          <img
            src={
              product.image
            }
            alt={
              product.name ||
              "Product"
            }
            loading="lazy"
            style={{
              width:
                "100%",
              height:
                "170px",
              objectFit:
                "contain",
              padding:
                "8px",
              boxSizing:
                "border-box",
              background:
                "rgba(255,255,255,0.04)",
              borderRadius:
                "12px",
            }}
          />

          {/* STOCK */}

          <span
            style={{
              position:
                "absolute",
              left:
                "8px",
              bottom:
                "8px",
              padding:
                "5px 8px",
              borderRadius:
                "999px",
              fontSize:
                "10px",
              fontWeight:
                "800",
              background:
                isOutOfStock
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(34,197,94,0.12)",
              color:
                isOutOfStock
                  ? "#ef4444"
                  : "#22c55e",
              border:
                isOutOfStock
                  ? "1px solid rgba(239,68,68,0.18)"
                  : "1px solid rgba(34,197,94,0.18)",
            }}
          >
            {isOutOfStock
              ? "Out of Stock"
              : stock <= 5
              ? `${stock} left`
              : "In Stock"}
          </span>
        </div>

        {/* CATEGORY */}

        {product.category && (
          <div
            style={{
              marginTop:
                "11px",
              fontSize:
                "11px",
              fontWeight:
                "700",
              opacity:
                0.55,
            }}
          >
            {
              product.category
            }
          </div>
        )}

        {/* NAME */}

        <h3
          style={{
            marginTop:
              "6px",
            fontSize:
              "15px",
            fontWeight:
              "700",
            lineHeight:
              "1.35",
            marginBottom:
              0,
          }}
        >
          {
            product.name
          }
        </h3>

        {/* RATING */}

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap:
              "5px",
            marginTop:
              "8px",
            fontSize:
              "12px",
          }}
        >
          <Star
            size={14}
            fill={
              rating > 0
                ? "#f59e0b"
                : "transparent"
            }
            color={
              rating > 0
                ? "#f59e0b"
                : "currentColor"
            }
          />

          <strong>
            {rating > 0
              ? rating.toFixed(
                  1
                )
              : "No rating"}
          </strong>

          <span
            style={{
              opacity:
                0.5,
            }}
          >
            ({reviewCount})
          </span>
        </div>

        {/* PRICE */}

        <p
          style={{
            marginTop:
              "8px",
            marginBottom:
              0,
            fontSize:
              "17px",
            fontWeight:
              "800",
          }}
        >
          ₹
          {Number(
            product.price ||
              0
          ).toLocaleString(
            "en-IN"
          )}
        </p>

      </Link>

      {/* =====================================================
          ADD TO CART
      ===================================================== */}

      <button
        type="button"
        onClick={
          handleAddToCart
        }
        disabled={
          isOutOfStock
        }
        style={{
          width:
            "100%",
          marginTop:
            "14px",
          minHeight:
            "42px",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          gap:
            "6px",
          fontSize:
            "13px",
          fontWeight:
            "700",
          padding:
            "10px",
          borderRadius:
            "10px",
          border:
            "none",
          cursor:
            isOutOfStock
              ? "not-allowed"
              : "pointer",
          background:
            isOutOfStock
              ? "rgba(148,163,184,0.15)"
              : "linear-gradient(135deg,#0284c7,#0369a1)",
          color:
            isOutOfStock
              ? "rgba(255,255,255,0.45)"
              : "#ffffff",
          opacity:
            isOutOfStock
              ? 0.7
              : 1,
        }}
      >
        <ShoppingCart
          size={15}
        />

        {isOutOfStock
          ? "Out of Stock"
          : "Add to Cart"}
      </button>

    </motion.article>
  );
}