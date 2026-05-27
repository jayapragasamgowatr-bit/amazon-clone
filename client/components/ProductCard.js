import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import useCartStore from "../store/cartStore";
import { useWishlist } from "../context/WishlistContext";

export default function ProductCard({ product }) {
  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const {
    toggleWishlist,
    isWishlisted,
  } = useWishlist();

  const wishlisted = isWishlisted(
    product._id
  );

  return (
    <motion.div
      whileHover={{
        y: -6,
        scale: 1.01,
      }}
      className="product-card glass-card"
      style={{
        padding: "12px",
        position: "relative",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* SMALL HEART */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() =>
          toggleWishlist(product._id)
        }
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "rgba(255,255,255,0.10)",
          backdropFilter: "blur(10px)",
          border:
            "1px solid rgba(255,255,255,0.08)",
          zIndex: 20,
          cursor: "pointer",
          padding: 0,
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
      </motion.button>

      {/* PRODUCT IMAGE */}
      <img
        src={product.image}
        alt={product.name}
        style={{
          width: "100%",
          height: "150px",
          objectFit: "contain",
          padding: "8px",
          background:
            "rgba(255,255,255,0.04)",
          borderRadius: "12px",
        }}
      />

      {/* INFO */}
      <h3
        style={{
          marginTop: "10px",
          fontSize: "15px",
          fontWeight: "700",
          lineHeight: "1.3",
        }}
      >
        {product.name}
      </h3>

      <p
        style={{
          opacity: 0.8,
          marginTop: "6px",
          fontSize: "15px",
          fontWeight: "600",
        }}
      >
        ₹{product.price}
      </p>

      {/* BUTTONS */}
      <div
        style={{
          display: "grid",
          gap: "8px",
          marginTop: "14px",
        }}
      >
        <button
          onClick={() =>
            addToCart(product)
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: "600",
            padding: "10px",
          }}
        >
          <ShoppingCart size={14} />
          Add to Cart
        </button>

        <Link
          href={`/product/${product._id}`}
        >
          <button
            style={{
              width: "100%",
              background:
                "linear-gradient(135deg,#8b5cf6,#ec4899)",
              fontSize: "13px",
              fontWeight: "600",
              padding: "10px",
            }}
          >
            View Product
          </button>
        </Link>
      </div>
    </motion.div>
  );
}