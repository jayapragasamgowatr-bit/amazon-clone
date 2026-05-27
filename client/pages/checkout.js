import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useCartStore from "../store/cartStore";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const cartItems = useCartStore(
    (state) => state.cart
  );

  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [postalCode, setPostalCode] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const totalPrice =
    cartItems.reduce(
      (acc, item) =>
        acc +
        item.price *
          item.quantity,
      0
    );

  const placeOrder = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(
        "Please login first"
      );
      router.push("/login");
      return;
    }

    if (cartItems.length === 0) {
      toast.error(
        "Cart is empty"
      );
      return;
    }

    try {
      setLoading(true);

      await apiFetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            orderItems:
              cartItems.map(
                (item) => ({
                  name:
                    item.name,
                  price:
                    item.price,
                  quantity:
                    item.quantity,
                  image:
                    item.image,
                  product:
                    item._id,
                })
              ),

            shippingAddress:
              {
                address,
                city,
                postalCode,
                country,
              },

            paymentMethod:
              "Cash on Delivery",

            totalPrice,
          }),
        }
      );

      clearCart();

      toast.success(
        "Order placed successfully 🎉"
      );

      router.push("/orders");

    } catch (error) {
      toast.error(
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

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
        <div
          className="glass-card"
          style={{
            padding: "60px",
          }}
        >
          <h1>
            No items to checkout
          </h1>

          <p
            style={{
              opacity: 0.8,
              marginTop: "10px",
            }}
          >
            Add products to cart
            first.
          </p>
        </div>
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
        Checkout
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.5fr 1fr",
          gap: "30px",
        }}
      >
        {/* FORM */}
        <motion.form
          initial={{
            opacity: 0,
            x: -20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          onSubmit={placeOrder}
          className="glass-card"
          style={{
            padding: "30px",
          }}
        >
          <h2>
            Shipping Address
          </h2>

          <div
            style={{
              marginTop: "20px",
              display: "grid",
              gap: "16px",
            }}
          >
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) =>
                setAddress(
                  e.target.value
                )
              }
              required
            />

            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) =>
                setCity(
                  e.target.value
                )
              }
              required
            />

            <input
              type="text"
              placeholder="Postal Code"
              value={postalCode}
              onChange={(e) =>
                setPostalCode(
                  e.target.value
                )
              }
              required
            />

            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) =>
                setCountry(
                  e.target.value
                )
              }
              required
            />
          </div>

          <h2
            style={{
              marginTop: "30px",
            }}
          >
            Payment Method
          </h2>

          <div
            className="glass-card"
            style={{
              padding: "18px",
              marginTop: "16px",
            }}
          >
            Cash on Delivery
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "30px",
            }}
          >
            {loading
              ? "Placing Order..."
              : "Place Order"}
          </button>
        </motion.form>

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
              gap: "20px",
            }}
          >
            {cartItems.map(
              (item) => (
                <div
                  key={item._id}
                  style={{
                    display:
                      "flex",
                    gap: "14px",
                    alignItems:
                      "center",
                  }}
                >
                  <img
                    src={
                      item.image
                    }
                    alt={
                      item.name
                    }
                    style={{
                      width:
                        "80px",
                      height:
                        "80px",
                      objectFit:
                        "contain",
                      padding:
                        "8px",
                      background:
                        "rgba(255,255,255,0.05)",
                      borderRadius:
                        "14px",
                    }}
                  />

                  <div>
                    <h4>
                      {
                        item.name
                      }
                    </h4>

                    <p>
                      Qty:{" "}
                      {
                        item.quantity
                      }
                    </p>

                    <p>
                      ₹
                      {
                        item.price
                      }
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          <hr
            style={{
              margin:
                "20px 0",
              borderColor:
                "rgba(255,255,255,0.08)",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              fontSize: "22px",
              fontWeight:
                "bold",
            }}
          >
            <span>
              Total
            </span>

            <span>
              ₹
              {totalPrice}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}