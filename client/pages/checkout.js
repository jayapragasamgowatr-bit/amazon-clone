import { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { motion } from "framer-motion";

import toast from "react-hot-toast";

import Link from "next/link";

import useCartStore from "../store/cartStore";

import { useAuth } from "../context/AuthContext";

import { createOrder } from "../lib/api";
import SEO from "../components/SEO";
import { trackEvent } from "../lib/eventTracker";

// ============================================================
// CHECKOUT PAGE
// ============================================================

export default function CheckoutPage() {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const cartItems = useCartStore(
    (state) => state.cart
  );

  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  const [mounted, setMounted] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  // ==========================================================
  // FORM
  // ==========================================================

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
    });

  // ==========================================================
  // MOUNT
  // ==========================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((previous) => ({
      ...previous,

      name:
        user.name ||
        previous.name,

      email:
        user.email ||
        previous.email,
    }));
  }, [user]);

  // ==========================================================
  // AUTH CHECK
  // ==========================================================

  useEffect(() => {
    if (
      mounted &&
      !authLoading &&
      !user
    ) {
      toast.error(
        "Please login before checkout"
      );

      router.push(
        "/login?redirect=/checkout"
      );
    }
  }, [
    mounted,
    authLoading,
    user,
    router,
  ]);

  // ==========================================================
  // CART CHECK
  // ==========================================================

  useEffect(() => {
    if (
      mounted &&
      !authLoading &&
      user &&
      cartItems.length === 0
    ) {
      toast.error(
        "Your cart is empty"
      );

      router.push("/cart");
    }
  }, [
    mounted,
    authLoading,
    user,
    cartItems,
    router,
  ]);

  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================================
  // TOTAL
  // ==========================================================

  const subtotal =
    cartItems.reduce(
      (
        total,
        item
      ) => {
        const price =
          Number(
            item.price || 0
          );

        const quantity =
          Number(
            item.quantity || 1
          );

        return (
          total +
          price *
            quantity
        );
      },
      0
    );

  const shipping = 0;

  const total =
    subtotal +
    shipping;

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (processing) {
        return;
      }

      // ------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------

      if (
        !form.name.trim()
      ) {
        toast.error(
          "Enter your name"
        );
        return;
      }

      if (
        !form.email.trim()
      ) {
        toast.error(
          "Enter your email"
        );
        return;
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim()
        )
      ) {
        toast.error(
          "Enter a valid email address"
        );
        return;
      }

      if (
        !form.phone.trim()
      ) {
        toast.error(
          "Enter your phone number"
        );
        return;
      }

      if (
        !/^[0-9]{10}$/.test(
          form.phone.trim()
        )
      ) {
        toast.error(
          "Enter a valid 10-digit phone number"
        );
        return;
      }

      if (
        !form.address.trim()
      ) {
        toast.error(
          "Enter your address"
        );
        return;
      }

      if (
        !form.city.trim()
      ) {
        toast.error(
          "Enter your city"
        );
        return;
      }

      if (
        !form.state.trim()
      ) {
        toast.error(
          "Enter your state"
        );
        return;
      }

      if (
        !/^[0-9]{6}$/.test(
          form.postalCode.trim()
        )
      ) {
        toast.error(
          "Enter a valid 6-digit pincode"
        );
        return;
      }

      if (
        !cartItems ||
        cartItems.length === 0
      ) {
        toast.error(
          "Your cart is empty"
        );
        return;
      }

      // ------------------------------------------------------
      // PROCESSING
      // ------------------------------------------------------

      setProcessing(true);

      trackEvent("checkout_started", { metadata: { quantity: cartItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0), source: "checkout" } });

      try {
        // ====================================================
        // ITEMS
        // ====================================================

        const items = cartItems.map((item) => ({
          product: item._id,
          quantity: Number(item.quantity || 1),
        }));

        // ====================================================
        // SHIPPING ADDRESS
        // ====================================================

        const shippingAddress =
          {
            name:
              form.name.trim(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            phone:
              form.phone.trim(),

            address:
              form.address.trim(),

            city:
              form.city.trim(),

            state:
              form.state.trim(),

            postalCode:
              form.postalCode.trim(),
          };

        // ====================================================
        // CUSTOMER
        // ====================================================

        const customer = {
          name:
            form.name.trim(),

          email:
            form.email
              .trim()
              .toLowerCase(),

          phone:
            form.phone.trim(),
        };

        // ====================================================
        // ORDER DATA
        // ====================================================

        const orderData = {
          items,

          customer,

          shippingAddress,

          paymentMethod:
            "COD",
        };

        // ====================================================
        // DEBUG
        // ====================================================

        if (process.env.NODE_ENV !== "production") {
          console.debug("Creating COD order", {
            itemCount: items.length,
          });
        }

        // ====================================================
        // CREATE ORDER
        // ====================================================

        const response =
          await createOrder(
            orderData
          );

        console.log(
          "ORDER RESPONSE:",
          response
        );

        // ====================================================
        // GET CREATED ORDER
        // ====================================================

        const createdOrder =
          response?.order ||
          response;

        // ====================================================
        // SUCCESS
        // ====================================================

        toast.success(
          "Order placed successfully! 🎉"
        );

        trackEvent("checkout_completed", { metadata: { source: "checkout" } });
        trackEvent("order_created", { metadata: { source: "checkout" } });

        // ====================================================
        // CLEAR CART
        // ====================================================

        if (
          typeof clearCart ===
          "function"
        ) {
          clearCart();
        }

        // ====================================================
        // REDIRECT
        // ====================================================

        const orderId =
          createdOrder?._id ||
          response?._id;

        if (orderId) {
          router.push(
            `/orders/${orderId}`
          );
        } else {
          router.push(
            "/orders"
          );
        }
      } catch (error) {
        console.error(
          "================================"
        );

        console.error(
          "CHECKOUT ERROR:"
        );

        console.error(
          error
        );

        console.error(
          "================================"
        );

        toast.error(
          error?.message ||
            "Unable to place order"
        );
      } finally {
        setProcessing(false);
      }
    };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    !mounted ||
    authLoading
  ) {
    return (
      <div
        style={{
          minHeight:
            "70vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          fontSize:
            "20px",
        }}
      >
        Loading checkout...
      </div>
    );
  }

  // ==========================================================
  // NOT LOGGED IN
  // ==========================================================

  if (!user) {
    return null;
  }

  // ==========================================================
  // EMPTY CART
  // ==========================================================

  if (
    cartItems.length === 0
  ) {
    return (
      <div
        style={{
          maxWidth:
            "1000px",

          margin:
            "80px auto",

          padding:
            "20px",

          textAlign:
            "center",
        }}
      >
        <div
          className="glass-card"
          style={{
            padding:
              "60px 30px",
          }}
        >
          <h1>
            Your Cart is Empty 🛒
          </h1>

          <p
            style={{
              opacity:
                0.7,

              marginTop:
                "15px",
            }}
          >
            Add products before
            proceeding to checkout.
          </p>

          <Link href="/">
            <button
              style={{
                marginTop:
                  "25px",
              }}
            >
              Continue Shopping
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      <SEO
        title="Checkout | Waventra Vetric"
        description="Secure cash-on-delivery checkout."
        path="/checkout"
        noIndex
      />

      <div
        style={{
        maxWidth:
          "1500px",

        margin:
          "40px auto",

        padding:
          "20px",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
      >
        <h1
          style={{
            fontSize:
              "clamp(32px,5vw,48px)",

            fontWeight:
              "900",

            margin:
              0,
          }}
        >
          Checkout
        </h1>

        <p
          style={{
            marginTop:
              "8px",

            opacity:
              0.65,
          }}
        >
          Complete your delivery
          details before placing
          your order.
        </p>
      </motion.div>

      {/* =====================================================
          GRID
      ===================================================== */}

      <div
        className="checkout-grid"
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "minmax(0,1.6fr) minmax(300px,0.8fr)",

          gap:
            "30px",

          marginTop:
            "35px",

          alignItems:
            "start",
        }}
      >
        {/* ===================================================
            CUSTOMER FORM
        =================================================== */}

        <motion.form
          initial={{
            opacity: 0,
            x: -20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          onSubmit={
            handleSubmit
          }
          className="glass-card"
          style={{
            padding:
              "30px",
          }}
        >
          <h2
            style={{
              marginTop:
                0,
            }}
          >
            Delivery Information
          </h2>

          <p
            style={{
              opacity:
                0.6,

              marginBottom:
                "25px",
            }}
          >
            Enter the details where
            your order should be
            delivered.
          </p>

          {/* NAME */}

          <div
            style={
              fieldStyle
            }
          >
            <label>
              Name
            </label>

            <input
              type="text"
              name="name"
              value={
                form.name
              }
              onChange={
                handleChange
              }
              placeholder="Enter your name"
              required
            />
          </div>

          {/* EMAIL */}

          <div
            style={
              fieldStyle
            }
          >
            <label>
              Email
            </label>

            <input
              type="email"
              name="email"
              value={
                form.email
              }
              onChange={
                handleChange
              }
              placeholder="Enter your email"
              required
            />
          </div>

          {/* PHONE */}

          <div
            style={
              fieldStyle
            }
          >
            <label>
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={
                form.phone
              }
              onChange={
                handleChange
              }
              placeholder="10-digit mobile number"
              maxLength={
                10
              }
              required
            />
          </div>

          {/* ADDRESS */}

          <div
            style={
              fieldStyle
            }
          >
            <label>
              Address
            </label>

            <textarea
              name="address"
              value={
                form.address
              }
              onChange={
                handleChange
              }
              placeholder="House / Flat / Street / Area"
              rows={
                4
              }
              required
            />
          </div>

          {/* CITY + STATE */}

          <div
            className="city-state-grid"
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(2,minmax(0,1fr))",

              gap:
                "15px",
            }}
          >
            <div
              style={
                fieldStyle
              }
            >
              <label>
                City
              </label>

              <input
                type="text"
                name="city"
                value={
                  form.city
                }
                onChange={
                  handleChange
                }
                placeholder="City"
                required
              />
            </div>

            <div
              style={
                fieldStyle
              }
            >
              <label>
                State
              </label>

              <input
                type="text"
                name="state"
                value={
                  form.state
                }
                onChange={
                  handleChange
                }
                placeholder="State"
                required
              />
            </div>
          </div>

          {/* PINCODE */}

          <div
            style={
              fieldStyle
            }
          >
            <label>
              Pincode
            </label>

            <input
              type="text"
              name="postalCode"
              value={
                form.postalCode
              }
              onChange={
                handleChange
              }
              placeholder="6-digit pincode"
              maxLength={
                6
              }
              required
            />
          </div>

          {/* PAYMENT */}

          <div
            style={{
              marginTop:
                "10px",

              marginBottom:
                "20px",

              padding:
                "16px",

              borderRadius:
                "12px",

              background:
                "rgba(14,165,233,0.08)",

              border:
                "1px solid rgba(14,165,233,0.15)",
            }}
          >
            <strong>
              Payment Method
            </strong>

            <div
              style={{
                marginTop:
                  "8px",

                opacity:
                  0.8,
              }}
            >
              Cash on Delivery
            </div>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={
              processing
            }
            style={{
              width:
                "100%",

              marginTop:
                "10px",

              padding:
                "16px",

              fontSize:
                "16px",

              fontWeight:
                "800",

              opacity:
                processing
                  ? 0.6
                  : 1,

              cursor:
                processing
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {processing
              ? "Placing Order..."
              : "Place Order 🛒"}
          </button>
        </motion.form>

        {/* ===================================================
            ORDER SUMMARY
        =================================================== */}

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
            padding:
              "25px",

            position:
              "sticky",

            top:
              "110px",
          }}
        >
          <h2
            style={{
              marginTop:
                0,
            }}
          >
            Order Summary
          </h2>

          {/* PRODUCTS */}

          <div
            style={{
              display:
                "grid",

              gap:
                "15px",

              marginTop:
                "20px",
            }}
          >
            {cartItems.map(
              (
                item
              ) => (
                <div
                  key={
                    item._id
                  }
                  style={{
                    display:
                      "flex",

                    gap:
                      "12px",

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
                        "65px",

                      height:
                        "65px",

                      objectFit:
                        "contain",

                      borderRadius:
                        "10px",

                      background:
                        "rgba(255,255,255,0.05)",

                      padding:
                        "5px",
                    }}
                  />

                  <div
                    style={{
                      flex:
                        1,

                      minWidth:
                        0,
                    }}
                  >
                    <div
                      style={{
                        fontWeight:
                          "700",

                        fontSize:
                          "14px",
                      }}
                    >
                      {
                        item.name
                      }
                    </div>

                    <div
                      style={{
                        opacity:
                          0.6,

                        fontSize:
                          "13px",

                        marginTop:
                          "4px",
                      }}
                    >
                      Qty:{" "}
                      {
                        item.quantity
                      }
                    </div>
                  </div>

                  <strong>
                    ₹
                    {(
                      Number(
                        item.price ||
                          0
                      ) *
                      Number(
                        item.quantity ||
                          1
                      )
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </strong>
                </div>
              )
            )}
          </div>

          <hr
            style={{
              margin:
                "25px 0",

              borderColor:
                "rgba(255,255,255,0.08)",
            }}
          />

          {/* SUBTOTAL */}

          <div
            style={
              summaryRow
            }
          >
            <span>
              Subtotal
            </span>

            <span>
              ₹
              {subtotal.toLocaleString(
                "en-IN"
              )}
            </span>
          </div>

          {/* SHIPPING */}

          <div
            style={{
              ...summaryRow,

              marginTop:
                "12px",
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
              margin:
                "20px 0",

              borderColor:
                "rgba(255,255,255,0.08)",
            }}
          />

          {/* TOTAL */}

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              fontSize:
                "22px",

              fontWeight:
                "900",
            }}
          >
            <span>
              Total
            </span>

            <span>
              ₹
              {total.toLocaleString(
                "en-IN"
              )}
            </span>
          </div>

          {/* EMAIL */}

          <div
            style={{
              marginTop:
                "20px",

              padding:
                "14px",

              borderRadius:
                "12px",

              background:
                "rgba(34,197,94,0.08)",

              border:
                "1px solid rgba(34,197,94,0.15)",

              fontSize:
                "13px",

              lineHeight:
                "1.6",

              opacity:
                0.85,
            }}
          >
            📧 Customer email:

            <strong>
              {" "}
              {form.email ||
                "Your email"}
            </strong>
          </div>
        </motion.div>
      </div>

      {/* =====================================================
          RESPONSIVE
      ===================================================== */}

      <style jsx>{`
        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }

          .checkout-grid
            > div:last-child {
            position: static !important;
          }
        }

        @media (max-width: 600px) {
          .city-state-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      </div>
    </>
  );
}

// ============================================================
// FIELD STYLE
// ============================================================

const fieldStyle = {
  display: "grid",

  gap: "7px",

  marginBottom: "18px",
};

// ============================================================
// SUMMARY ROW
// ============================================================

const summaryRow = {
  display: "flex",

  justifyContent:
    "space-between",

  alignItems:
    "center",
};