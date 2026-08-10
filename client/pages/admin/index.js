import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ProtectedRoute from "../../components/ProtectedRoute";
import { apiFetch } from "../../lib/api";
import AdminStatsCard from "../../components/AdminStatsCard";
import SalesChart from "../../components/SalesChart";
import TopProducts from "../../components/TopProducts";

import {
  Plus,
  Pencil,
  Trash2,
  Package,
  ShoppingCart,
  IndianRupee,
  Users,
  Activity,
  Star,
  MessageSquare,
  X,
  Save,
} from "lucide-react";

export default function AdminDashboard() {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  // Review editing
  const [editingReview, setEditingReview] =
    useState(null);

  const [reviewRating, setReviewRating] =
    useState("");

  const [reviewComment, setReviewComment] =
    useState("");

  const [savingReview, setSavingReview] =
    useState(false);


  // --------------------------------------------------
  // FETCH DASHBOARD DATA
  // --------------------------------------------------

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // PRODUCTS
      const productData =
        await apiFetch(
          "/api/products?page=1&limit=100"
        );

      // ORDERS
      let orderData = [];

      try {
        orderData =
          await apiFetch("/api/orders");
      } catch (err) {
        console.log(
          "Orders fetch skipped"
        );
      }

      setProducts(
        productData.products || []
      );

      setOrders(
        orderData || []
      );

      setUsers([]);

    } catch (error) {
      toast.error(
        error.message
      );
    } finally {
      setLoading(false);
    }
  };


  // --------------------------------------------------
  // DELETE PRODUCT
  // --------------------------------------------------

  const deleteProduct = async (id) => {
    if (
      !confirm(
        "Delete this product?"
      )
    ) {
      return;
    }

    try {
      await apiFetch(
        `/api/products/${id}`,
        {
          method: "DELETE",
        }
      );

      toast.success(
        "Product deleted"
      );

      fetchDashboardData();

    } catch (error) {
      toast.error(
        error.message
      );
    }
  };


  // --------------------------------------------------
  // OPEN EDIT REVIEW
  // --------------------------------------------------

  const openEditReview = (
    product,
    review
  ) => {
    setEditingReview({
      productId: product._id,
      productName: product.name,
      reviewId: review._id,
      userName: review.name,
    });

    setReviewRating(
      review.rating
    );

    setReviewComment(
      review.comment || ""
    );
  };


  // --------------------------------------------------
  // CLOSE EDIT REVIEW
  // --------------------------------------------------

  const closeEditReview = () => {
    setEditingReview(null);
    setReviewRating("");
    setReviewComment("");
  };


  // --------------------------------------------------
  // UPDATE REVIEW
  // --------------------------------------------------

  const updateReview = async () => {
    if (!editingReview) {
      return;
    }

    const rating =
      Number(reviewRating);

    if (
      !rating ||
      rating < 1 ||
      rating > 5
    ) {
      toast.error(
        "Rating must be between 1 and 5"
      );

      return;
    }

    try {
      setSavingReview(true);

      await apiFetch(
        `/api/products/${editingReview.productId}/reviews/${editingReview.reviewId}`,
        {
          method: "PUT",

          body: JSON.stringify({
            rating,
            comment:
              reviewComment,
          }),
        }
      );

      toast.success(
        "Review updated successfully"
      );

      closeEditReview();

      await fetchDashboardData();

    } catch (error) {
      toast.error(
        error.message
      );
    } finally {
      setSavingReview(false);
    }
  };


  // --------------------------------------------------
  // DELETE REVIEW
  // --------------------------------------------------

  const deleteReview = async (
    productId,
    reviewId
  ) => {
    if (
      !confirm(
        "Are you sure you want to delete this review?"
      )
    ) {
      return;
    }

    try {
      await apiFetch(
        `/api/products/${productId}/reviews/${reviewId}`,
        {
          method: "DELETE",
        }
      );

      toast.success(
        "Review deleted successfully"
      );

      await fetchDashboardData();

    } catch (error) {
      toast.error(
        error.message
      );
    }
  };


  // --------------------------------------------------
  // CALCULATE TOTAL REVIEWS
  // --------------------------------------------------

  const totalReviews =
    products.reduce(
      (total, product) =>
        total +
        (
          product.reviews?.length || 0
        ),
      0
    );


  // --------------------------------------------------
  // REVENUE
  // --------------------------------------------------

  const totalRevenue =
    orders.reduce(
      (sum, order) =>
        sum +
        (
          order.totalPrice || 0
        ),
      0
    );


  // --------------------------------------------------
  // SALES DATA
  // --------------------------------------------------

  const salesData =
    orders.length
      ? orders.map(
          (
            order,
            index
          ) => ({
            name: `#${index + 1}`,

            sales:
              order.totalPrice ||
              0,
          })
        )
      : [
          {
            name:
              "No Sales",

            sales: 0,
          },
        ];


  // --------------------------------------------------
  // TOP PRODUCTS
  // --------------------------------------------------

  const topProducts =
    [...products]
      .sort(
        (a, b) =>
          (
            b.rating || 0
          ) -
          (
            a.rating || 0
          )
      )
      .slice(0, 5);


  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <ProtectedRoute
      adminOnly={true}
    >
      <div
        style={{
          maxWidth:
            "1700px",

          margin:
            "40px auto",

          padding:
            "20px",
        }}
      >

        {/* ==========================================
            HEADER
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
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            flexWrap:
              "wrap",

            gap:
              "20px",

            marginBottom:
              "40px",
          }}
        >

          <div>

            <h1
              style={{
                fontSize:
                  "54px",

                fontWeight:
                  "900",
              }}
            >
              Admin Dashboard
            </h1>

            <p
              style={{
                opacity:
                  0.7,

                fontSize:
                  "18px",
              }}
            >
              Premium ecommerce
              analytics &
              management
            </p>

          </div>


          <Link
            href="/admin/add-product"
          >
            <button
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "10px",
              }}
            >

              <Plus
                size={18}
              />

              Add Product

            </button>
          </Link>

        </motion.div>


        {/* ==========================================
            STATS
        ========================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",

            gap:
              "20px",

            marginBottom:
              "35px",
          }}
        >

          <AdminStatsCard
            title="Products"
            value={
              products.length
            }
            icon={
              <Package />
            }
          />

          <AdminStatsCard
            title="Orders"
            value={
              orders.length
            }
            icon={
              <ShoppingCart />
            }
          />

          <AdminStatsCard
            title="Revenue"
            value={`₹${totalRevenue}`}
            icon={
              <IndianRupee />
            }
          />

          <AdminStatsCard
            title="Reviews"
            value={
              totalReviews
            }
            icon={
              <MessageSquare />
            }
          />

        </div>


        {/* ==========================================
            ANALYTICS
        ========================================== */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "2fr 1fr",

            gap:
              "24px",

            marginBottom:
              "35px",
          }}
        >

          <SalesChart
            data={
              salesData
            }
          />

          <TopProducts
            products={
              topProducts
            }
          />

        </div>


        {/* ==========================================
            PRODUCT MANAGEMENT
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
          className="glass-card"
          style={{
            padding:
              "24px",

            borderRadius:
              "24px",

            marginBottom:
              "35px",
          }}
        >

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "12px",

              marginBottom:
                "24px",
            }}
          >

            <Activity
              size={24}
            />

            <h2
              style={{
                fontSize:
                  "30px",

                fontWeight:
                  "800",
              }}
            >
              Product Management
            </h2>

          </div>


          {loading ? (

            <div
              style={{
                textAlign:
                  "center",

                padding:
                  "60px",

                fontSize:
                  "20px",
              }}
            >
              Loading dashboard...
            </div>

          ) : (

            <div
              style={{
                overflowX:
                  "auto",
              }}
            >

              <table
                style={{
                  width:
                    "100%",

                  borderCollapse:
                    "collapse",
                }}
              >

                <thead>

                  <tr>

                    <th>
                      Image
                    </th>

                    <th>
                      Product
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Rating
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {products.map(
                    (
                      product
                    ) => (

                      <tr
                        key={
                          product._id
                        }
                      >

                        <td>

                          <img
                            src={
                              product.image
                            }
                            alt={
                              product.name
                            }
                            style={{
                              width:
                                "65px",

                              height:
                                "65px",

                              objectFit:
                                "contain",

                              borderRadius:
                                "12px",

                              background:
                                "rgba(255,255,255,0.05)",

                              padding:
                                "6px",
                            }}
                          />

                        </td>


                        <td>
                          {
                            product.name
                          }
                        </td>


                        <td>
                          {
                            product.category
                          }
                        </td>


                        <td>
                          ₹
                          {
                            product.price
                          }
                        </td>


                        <td>
                          ⭐
                          {
                            Number(
                              product.rating ||
                                0
                            ).toFixed(
                              1
                            )
                          }
                        </td>


                        <td>

                          <div
                            style={{
                              display:
                                "flex",

                              gap:
                                "10px",
                            }}
                          >

                            <Link
                              href={`/admin/edit-product/${product._id}`}
                            >

                              <button
                                style={{
                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  justifyContent:
                                    "center",

                                  padding:
                                    "10px 14px",
                                }}
                              >

                                <Pencil
                                  size={
                                    16
                                  }
                                />

                              </button>

                            </Link>


                            <button
                              onClick={() =>
                                deleteProduct(
                                  product._id
                                )
                              }
                              style={{
                                background:
                                  "linear-gradient(135deg,#ef4444,#dc2626)",

                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "center",

                                padding:
                                  "10px 14px",
                              }}
                            >

                              <Trash2
                                size={
                                  16
                                }
                              />

                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </motion.div>


        {/* ==========================================
            REVIEW MANAGEMENT
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
          className="glass-card"
          style={{
            padding:
              "24px",

            borderRadius:
              "24px",

            marginBottom:
              "40px",
          }}
        >

          {/* REVIEW HEADER */}

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "12px",

              marginBottom:
                "25px",
            }}
          >

            <MessageSquare
              size={26}
            />

            <div>

              <h2
                style={{
                  fontSize:
                    "30px",

                  fontWeight:
                    "800",

                  margin:
                    0,
                }}
              >
                Review Management
              </h2>

              <p
                style={{
                  opacity:
                    0.65,

                  margin:
                    "5px 0 0",
                }}
              >
                Edit or delete
                customer reviews
              </p>

            </div>

          </div>


          {/* REVIEWS */}

          {products.every(
            (product) =>
              !product.reviews ||
              product.reviews.length ===
                0
          ) ? (

            <div
              style={{
                textAlign:
                  "center",

                padding:
                  "50px 20px",

                opacity:
                  0.7,
              }}
            >

              <MessageSquare
                size={45}
                style={{
                  marginBottom:
                    "15px",
                }}
              />

              <h3>
                No reviews yet
              </h3>

              <p>
                Customer reviews
                will appear here.
              </p>

            </div>

          ) : (

            <div
              style={{
                display:
                  "grid",

                gap:
                  "16px",
              }}
            >

              {products.map(
                (product) => {

                  if (
                    !product.reviews ||
                    product.reviews.length ===
                      0
                  ) {
                    return null;
                  }

                  return (

                    <div
                      key={
                        product._id
                      }
                      style={{
                        border:
                          "1px solid rgba(255,255,255,0.08)",

                        borderRadius:
                          "18px",

                        padding:
                          "20px",

                        background:
                          "rgba(255,255,255,0.025)",
                      }}
                    >

                      {/* PRODUCT NAME */}

                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            "10px",

                          marginBottom:
                            "15px",
                        }}
                      >

                        <Package
                          size={
                            20
                          }
                        />

                        <h3
                          style={{
                            margin:
                              0,

                            fontSize:
                              "20px",
                          }}
                        >
                          {
                            product.name
                          }
                        </h3>

                      </div>


                      {/* REVIEW LIST */}

                      <div
                        style={{
                          display:
                            "grid",

                          gap:
                            "12px",
                        }}
                      >

                        {product.reviews.map(
                          (
                            review
                          ) => (

                            <div
                              key={
                                review._id
                              }
                              style={{
                                display:
                                  "grid",

                                gridTemplateColumns:
                                  "1fr auto",

                                gap:
                                  "20px",

                                padding:
                                  "18px",

                                borderRadius:
                                  "14px",

                                background:
                                  "rgba(0,0,0,0.15)",
                              }}
                            >

                              {/* REVIEW INFO */}

                              <div>

                                <div
                                  style={{
                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    gap:
                                      "10px",

                                    flexWrap:
                                      "wrap",
                                  }}
                                >

                                  <strong>
                                    {
                                      review.name ||
                                      "User"
                                    }
                                  </strong>

                                  <span
                                    style={{
                                      opacity:
                                        0.5,
                                    }}
                                  >
                                    •
                                  </span>

                                  <span
                                    style={{
                                      display:
                                        "flex",

                                      alignItems:
                                        "center",

                                      gap:
                                        "3px",
                                    }}
                                  >

                                    <Star
                                      size={
                                        15
                                      }
                                      fill="currentColor"
                                    />

                                    {
                                      review.rating
                                    }
                                    /5

                                  </span>

                                </div>


                                <p
                                  style={{
                                    margin:
                                      "10px 0 0",

                                    lineHeight:
                                      "1.6",

                                    opacity:
                                      0.85,
                                  }}
                                >
                                  {
                                    review.comment ||
                                    "No comment"
                                  }
                                </p>

                              </div>


                              {/* REVIEW ACTIONS */}

                              <div
                                style={{
                                  display:
                                    "flex",

                                  alignItems:
                                    "center",

                                  gap:
                                    "8px",

                                  flexWrap:
                                    "wrap",

                                  justifyContent:
                                    "flex-end",
                                }}
                              >

                                {/* EDIT */}

                                <button
                                  onClick={() =>
                                    openEditReview(
                                      product,
                                      review
                                    )
                                  }
                                  title="Edit review"
                                  style={{
                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    gap:
                                      "6px",

                                    padding:
                                      "9px 12px",
                                  }}
                                >

                                  <Pencil
                                    size={
                                      15
                                    }
                                  />

                                  Edit

                                </button>


                                {/* DELETE */}

                                <button
                                  onClick={() =>
                                    deleteReview(
                                      product._id,
                                      review._id
                                    )
                                  }
                                  title="Delete review"
                                  style={{
                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    gap:
                                      "6px",

                                    padding:
                                      "9px 12px",

                                    background:
                                      "linear-gradient(135deg,#ef4444,#dc2626)",
                                  }}
                                >

                                  <Trash2
                                    size={
                                      15
                                    }
                                  />

                                  Delete

                                </button>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

        </motion.div>


        {/* ==========================================
            EDIT REVIEW MODAL
        ========================================== */}

        {editingReview && (

          <div
            style={{
              position:
                "fixed",

              inset:
                0,

              zIndex:
                10000,

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              padding:
                "20px",

              background:
                "rgba(0,0,0,0.75)",

              backdropFilter:
                "blur(8px)",
            }}
          >

            <motion.div
              initial={{
                opacity:
                  0,

                scale:
                  0.95,

                y:
                  20,
              }}
              animate={{
                opacity:
                  1,

                scale:
                  1,

                y:
                  0,
              }}
              className="glass-card"
              style={{
                width:
                  "100%",

                maxWidth:
                  "600px",

                padding:
                  "30px",

                borderRadius:
                  "24px",

                position:
                  "relative",
              }}
            >

              {/* CLOSE */}

              <button
                onClick={
                  closeEditReview
                }
                style={{
                  position:
                    "absolute",

                  top:
                    "15px",

                  right:
                    "15px",

                  width:
                    "40px",

                  height:
                    "40px",

                  padding:
                    0,

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",
                }}
              >

                <X
                  size={
                    20
                  }
                />

              </button>


              <h2
                style={{
                  fontSize:
                    "28px",

                  margin:
                    "0 0 8px",
                }}
              >
                Edit Review
              </h2>


              <p
                style={{
                  opacity:
                    0.65,

                  marginBottom:
                    "25px",
                }}
              >
                Product:{" "}
                <strong>
                  {
                    editingReview.productName
                  }
                </strong>
              </p>


              <p
                style={{
                  opacity:
                    0.65,

                  marginBottom:
                    "20px",
                }}
              >
                Review by:{" "}
                <strong>
                  {
                    editingReview.userName
                  }
                </strong>
              </p>


              {/* RATING */}

              <label
                style={{
                  display:
                    "block",

                  marginBottom:
                    "8px",

                  fontWeight:
                    "600",
                }}
              >
                Rating
              </label>

              <select
                value={
                  reviewRating
                }
                onChange={(e) =>
                  setReviewRating(
                    e.target.value
                  )
                }
                style={{
                  width:
                    "100%",

                  padding:
                    "12px",

                  marginBottom:
                    "20px",

                  borderRadius:
                    "10px",
                }}
              >

                <option value="">
                  Select Rating
                </option>

                <option value="1">
                  ⭐ 1 - Poor
                </option>

                <option value="2">
                  ⭐⭐ 2 - Fair
                </option>

                <option value="3">
                  ⭐⭐⭐ 3 - Good
                </option>

                <option value="4">
                  ⭐⭐⭐⭐ 4 - Very Good
                </option>

                <option value="5">
                  ⭐⭐⭐⭐⭐ 5 - Excellent
                </option>

              </select>


              {/* COMMENT */}

              <label
                style={{
                  display:
                    "block",

                  marginBottom:
                    "8px",

                  fontWeight:
                    "600",
                }}
              >
                Comment
              </label>

              <textarea
                value={
                  reviewComment
                }
                onChange={(e) =>
                  setReviewComment(
                    e.target.value
                  )
                }
                rows={
                  6
                }
                placeholder="Review comment"
                style={{
                  width:
                    "100%",

                  resize:
                    "vertical",

                  padding:
                    "14px",

                  borderRadius:
                    "12px",

                  marginBottom:
                    "25px",

                  boxSizing:
                    "border-box",
                }}
              />


              {/* MODAL ACTIONS */}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    "10px",

                  flexWrap:
                    "wrap",
                }}
              >

                <button
                  onClick={
                    closeEditReview
                  }
                  disabled={
                    savingReview
                  }
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "7px",
                  }}
                >

                  <X
                    size={
                      16
                    }
                  />

                  Cancel

                </button>


                <button
                  onClick={
                    updateReview
                  }
                  disabled={
                    savingReview
                  }
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "7px",
                  }}
                >

                  <Save
                    size={
                      16
                    }
                  />

                  {savingReview
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </div>

            </motion.div>

          </div>

        )}

      </div>
    </ProtectedRoute>
  );
}