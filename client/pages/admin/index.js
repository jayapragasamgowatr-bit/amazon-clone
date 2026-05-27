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
} from "lucide-react";

export default function AdminDashboard() {
  const [products, setProducts] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData =
    async () => {
      try {
        setLoading(true);

        const productData =
          await apiFetch(
            "/api/products?page=1&limit=100"
          );

        let orderData = [];

        try {
          orderData =
            await apiFetch(
              "/api/orders"
            );
        } catch (err) {
          console.log(
            "Orders fetch skipped"
          );
        }

        setProducts(
          productData.products ||
            []
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

  const deleteProduct =
    async (id) => {
      if (
        !confirm(
          "Delete this product?"
        )
      )
        return;

      try {
        await apiFetch(
          `/api/products/${id}`,
          {
            method:
              "DELETE",
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

  const totalRevenue =
    orders.reduce(
      (sum, order) =>
        sum +
        (order.totalPrice ||
          0),
      0
    );

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

  const topProducts =
    [...products]
      .sort(
        (a, b) =>
          (b.rating || 0) -
          (a.rating || 0)
      )
      .slice(0, 5);

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
          padding: "20px",
        }}
      >
        {/* HEADER */}
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
            gap: "20px",
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

          <Link href="/admin/add-product">
            <button
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "10px",
              }}
            >
              <Plus size={18} />
              Add Product
            </button>
          </Link>
        </motion.div>

        {/* STATS */}
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px",
            marginBottom:
              "35px",
          }}
        >
          <AdminStatsCard
            title="Products"
            value={
              products.length
            }
            icon={<Package />}
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
            title="Users"
            value={
              users.length
            }
            icon={<Users />}
          />
        </div>

        {/* ANALYTICS */}
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "2fr 1fr",
            gap: "24px",
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
                {/* PRODUCT MANAGEMENT */}
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
            padding: "24px",
            borderRadius: "24px",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "12px",
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
                  width: "100%",
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
                          {product.rating ||
                            0}
                        </td>

                        <td>
                          <div
                            style={{
                              display:
                                "flex",
                              gap: "10px",
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
      </div>
    </ProtectedRoute>
  );
}