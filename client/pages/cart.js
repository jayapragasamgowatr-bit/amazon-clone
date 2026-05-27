import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useCartStore from "../store/cartStore";

export default function CartPage() {
  const cartItems = useCartStore(
    (state) => state.cart
  );

  const removeFromCart =
    useCartStore(
      (state) =>
        state.removeFromCart
    );

  const updateQuantity =
    useCartStore(
      (state) =>
        state.updateQuantity
    );

  const totalPrice =
    cartItems.reduce(
      (acc, item) =>
        acc +
        item.price *
          item.quantity,
      0
    );

  if (
    !cartItems ||
    cartItems.length === 0
  ) {
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
            padding: "60px",
          }}
        >
          <h1
            style={{
              fontSize: "42px",
              marginBottom:
                "20px",
            }}
          >
            Your Cart is Empty 🛒
          </h1>

          <p
            style={{
              opacity: 0.8,
              marginBottom:
                "30px",
            }}
          >
            Add some amazing
            products to your
            cart.
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

  return (
    <div
      style={{
        maxWidth: "1500px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1
        style={{
          fontSize: "46px",
          marginBottom: "30px",
        }}
      >
        Shopping Cart
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr",
          gap: "30px",
        }}
      >
        {/* CART ITEMS */}
        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          {cartItems.map(
            (item) => (
              <motion.div
                key={item._id}
                whileHover={{
                  y: -4,
                }}
                className="glass-card"
                style={{
                  padding: "20px",
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "20px",
                }}
              >
                {/* IMAGE */}
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: "140px",
                    height: "140px",
                    objectFit:
                      "contain",
                    padding:
                      "12px",
                    background:
                      "rgba(255,255,255,0.05)",
                    borderRadius:
                      "18px",
                  }}
                />

                {/* INFO */}
                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <h2>
                    {item.name}
                  </h2>

                  <p
                    style={{
                      opacity:
                        0.75,
                    }}
                  >
                    ₹
                    {
                      item.price
                    }
                  </p>

                  {/* QUANTITY */}
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "12px",
                      marginTop:
                        "15px",
                    }}
                  >
                    <button
                      onClick={() =>
                        updateQuantity(
                          item._id,
                          Math.max(
                            1,
                            item.quantity -
                              1
                          )
                        )
                      }
                    >
                      -
                    </button>

                    <span>
                      {
                        item.quantity
                      }
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(
                          item._id,
                          item.quantity +
                            1
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* REMOVE */}
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
                    background:
                      "linear-gradient(135deg,#ef4444,#dc2626)",
                  }}
                >
                  Remove
                </button>
              </motion.div>
            )
          )}
        </div>

        {/* SUMMARY */}
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
            height: "fit-content",
            position: "sticky",
            top: "110px",
          }}
        >
          <h2>
            Order Summary
          </h2>

          <div
            style={{
              marginTop: "20px",
              display: "grid",
              gap: "12px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span>
                Items
              </span>

              <span>
                {
                  cartItems.length
                }
              </span>
            </div>

            <div
              style={{
                display:
                  "flex",
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
                borderColor:
                  "rgba(255,255,255,0.08)",
              }}
            />

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                fontSize:
                  "22px",
                fontWeight:
                  "bold",
              }}
            >
              <span>
                Total
              </span>

              <span>
                ₹
                {
                  totalPrice
                }
              </span>
            </div>
          </div>

          <Link href="/checkout">
            <button
              style={{
                width: "100%",
                marginTop:
                  "25px",
              }}
            >
              Proceed to Checkout
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}