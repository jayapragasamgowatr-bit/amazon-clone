import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useCartStore from "../store/cartStore";

export default function CartPage() {
  const cartItems = useCartStore(
    (state) => state.cart
  );

  const removeFromCart = useCartStore(
    (state) => state.removeFromCart
  );

  const updateQuantity = useCartStore(
    (state) => state.updateQuantity
  );

  const totalPrice = cartItems.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
        Number(item.quantity || 1),
    0
  );

  const totalItems = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 1),
    0
  );

  // ==============================
  // EMPTY CART
  // ==============================

  if (cartItems.length === 0) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "80px auto",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="glass-card"
          style={{
            padding: "60px 30px",
          }}
        >
          <div
            style={{
              fontSize: "70px",
              marginBottom: "20px",
            }}
          >
            🛒
          </div>

          <h1
            style={{
              fontSize: "42px",
              marginBottom: "20px",
            }}
          >
            Your Cart is Empty
          </h1>

          <p
            style={{
              opacity: 0.7,
              marginBottom: "30px",
            }}
          >
            Add some products to your cart.
          </p>

          <Link href="/">
            <button>
              Continue Shopping
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ==============================
  // CART
  // ==============================

  return (
    <div
      style={{
        maxWidth: "1500px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <motion.h1
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        style={{
          fontSize: "46px",
          marginBottom: "30px",
          fontWeight: "800",
        }}
      >
        Shopping Cart 🛒
      </motion.h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(300px, 1fr)",
          gap: "30px",
          alignItems: "start",
        }}
      >
        {/* ============================
            CART ITEMS
        ============================ */}

        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {cartItems.map((item) => (
            <motion.div
              key={item._id}
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              whileHover={{
                y: -3,
              }}
              className="glass-card"
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              {/* IMAGE */}

              <Link
                href={`/product/${item._id}`}
                style={{
                  flexShrink: 0,
                }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: "140px",
                    height: "140px",
                    objectFit: "contain",
                    padding: "12px",
                    background:
                      "rgba(255,255,255,0.05)",
                    borderRadius: "18px",
                  }}
                />
              </Link>

              {/* PRODUCT INFO */}

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Link
                  href={`/product/${item._id}`}
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "20px",
                    }}
                  >
                    {item.name}
                  </h2>
                </Link>

                <p
                  style={{
                    marginTop: "8px",
                    fontWeight: "700",
                    fontSize: "18px",
                  }}
                >
                  ₹
                  {Number(
                    item.price || 0
                  ).toLocaleString("en-IN")}
                </p>

                {/* QUANTITY */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "15px",
                  }}
                >
                  <button
                    onClick={() =>
                      updateQuantity(
                        item._id,
                        Math.max(
                          1,
                          item.quantity - 1
                        )
                      )
                    }
                    style={{
                      width: "38px",
                      height: "38px",
                      padding: 0,
                    }}
                  >
                    −
                  </button>

                  <span
                    style={{
                      minWidth: "30px",
                      textAlign: "center",
                      fontWeight: "700",
                    }}
                  >
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      updateQuantity(
                        item._id,
                        item.quantity + 1
                      )
                    }
                    style={{
                      width: "38px",
                      height: "38px",
                      padding: 0,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ITEM TOTAL */}

              <div
                style={{
                  textAlign: "right",
                  minWidth: "120px",
                }}
              >
                <strong>
                  ₹
                  {(
                    Number(item.price || 0) *
                    Number(item.quantity || 1)
                  ).toLocaleString("en-IN")}
                </strong>

                <br />

                <button
                  onClick={() => {
                    removeFromCart(
                      item._id
                    );

                    toast.success(
                      "Removed from cart"
                    );
                  }}
                  style={{
                    marginTop: "15px",
                    background:
                      "linear-gradient(135deg,#ef4444,#dc2626)",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ============================
            ORDER SUMMARY
        ============================ */}

        <motion.div
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          className="glass-card"
          style={{
            padding: "30px",
            position: "sticky",
            top: "110px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Order Summary
          </h2>

          <div
            style={{
              marginTop: "25px",
              display: "grid",
              gap: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span>
                Products
              </span>

              <span>
                {totalItems}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span>
                Shipping
              </span>

              <span>
                Free
              </span>
            </div>

            <hr
              style={{
                width: "100%",
                border: 0,
                borderTop:
                  "1px solid rgba(255,255,255,0.1)",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                fontSize: "24px",
                fontWeight: "800",
              }}
            >
              <span>
                Total
              </span>

              <span>
                ₹
                {totalPrice.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            style={{
              display: "block",
              marginTop: "25px",
            }}
          >
            <button
              style={{
                width: "100%",
              }}
            >
              Proceed to Checkout
            </button>
          </Link>

          <Link
            href="/"
            style={{
              display: "block",
              marginTop: "12px",
            }}
          >
            <button
              style={{
                width: "100%",
                background:
                  "rgba(255,255,255,0.08)",
              }}
            >
              Continue Shopping
            </button>
          </Link>
        </motion.div>
      </div>

      {/* ============================
          MOBILE
      ============================ */}

      <style jsx>{`
        @media (max-width: 900px) {
          div[style*="minmax(0, 2fr)"] {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 600px) {
          .glass-card {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }
      `}</style>
    </div>
  );
}