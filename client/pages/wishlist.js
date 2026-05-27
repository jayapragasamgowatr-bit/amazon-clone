import Link from "next/link";
import { motion } from "framer-motion";
import ProtectedRoute from "../components/ProtectedRoute";
import { useWishlist } from "../context/WishlistContext";
import useCartStore from "../store/cartStore";
import { Heart, ShoppingCart } from "lucide-react";

export default function WishlistPage() {
  const {
    wishlist,
    toggleWishlist,
  } = useWishlist();

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  return (
    <ProtectedRoute>
      <div
        style={{
          maxWidth: "1500px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            marginBottom: "40px",
          }}
        >
          <h1
            style={{
              fontSize: "52px",
              fontWeight: "800",
            }}
          >
            My Wishlist ❤️
          </h1>

          <p
            style={{
              opacity: 0.75,
              fontSize: "18px",
            }}
          >
            Your saved favorite products
          </p>
        </div>

        {/* EMPTY */}
        {wishlist.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: "80px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontSize: "32px",
                marginBottom: "20px",
              }}
            >
              Wishlist is empty 💔
            </h2>

            <Link href="/">
              <button>
                Browse Products
              </button>
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(300px,1fr))",
              gap: "28px",
            }}
          >
            {wishlist.map(
              (product) => (
                <motion.div
                  key={product._id}
                  whileHover={{
                    y: -10,
                    scale: 1.02,
                  }}
                  className="glass-card"
                  style={{
                    padding: "20px",
                    position:
                      "relative",
                  }}
                >
                  {/* REMOVE HEART */}
                  <motion.button
                    whileHover={{
                      scale: 1.15,
                    }}
                    whileTap={{
                      scale: 0.9,
                    }}
                    onClick={() =>
                      toggleWishlist(
                        product._id
                      )
                    }
                    style={{
                      position:
                        "absolute",
                      top: "12px",
                      right: "12px",
                      width: "80px",
                      height: "80px",
                      borderRadius:
                        "50%",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      background:
                        "rgba(255,255,255,0.15)",
                      backdropFilter:
                        "blur(16px)",
                      border:
                        "1px solid rgba(255,255,255,0.1)",
                      zIndex: 20,
                    }}
                  >
                    <Heart
                      size={46}
                      fill="#ef4444"
                      color="#ef4444"
                    />
                  </motion.button>

                  {/* IMAGE */}
                  <img
                    src={
                      product.image
                    }
                    alt={
                      product.name
                    }
                    style={{
                      width:
                        "100%",
                      height:
                        "240px",
                      objectFit:
                        "contain",
                      padding:
                        "12px",
                      background:
                        "rgba(255,255,255,0.05)",
                      borderRadius:
                        "16px",
                    }}
                  />

                  {/* INFO */}
                  <h3
                    style={{
                      marginTop:
                        "18px",
                      fontSize:
                        "22px",
                      fontWeight:
                        "700",
                    }}
                  >
                    {
                      product.name
                    }
                  </h3>

                  <p
                    style={{
                      fontSize:
                        "20px",
                      marginTop:
                        "10px",
                    }}
                  >
                    ₹
                    {
                      product.price
                    }
                  </p>

                  {/* ACTIONS */}
                  <div
                    style={{
                      display:
                        "grid",
                      gap: "12px",
                      marginTop:
                        "20px",
                    }}
                  >
                    <button
                      onClick={() =>
                        addToCart(
                          product
                        )
                      }
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        gap: "10px",
                      }}
                    >
                      <ShoppingCart size={22} />
                      Add to Cart
                    </button>

                    <Link
                      href={`/product/${product._id}`}
                    >
                      <button
                        style={{
                          width:
                            "100%",
                          background:
                            "linear-gradient(135deg,#8b5cf6,#ec4899)",
                        }}
                      >
                        View Product
                      </button>
                    </Link>
                  </div>
                </motion.div>
              )
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}