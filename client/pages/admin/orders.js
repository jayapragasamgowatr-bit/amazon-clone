import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ProtectedRoute from "../../components/ProtectedRoute";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import SkeletonOrder from "../../components/SkeletonOrder";

export default function AdminOrdersPage() {
  const { user } = useAuth();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [searchTerm, setSearchTerm] =
    useState("");

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const data = await apiFetch(
        "/api/orders",
        {
          headers: {
            Authorization:
              `Bearer ${user.token}`,
          },
        }
      );

      setOrders(data || []);

    } catch (error) {
      toast.error(
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      await apiFetch(
        `/api/orders/${orderId}`,
        {
          method: "PUT",
          headers: {
            Authorization:
              `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            orderStatus:
              newStatus,
          }),
        }
      );

      toast.success(
        "Order updated successfully"
      );

      fetchOrders();

    } catch (error) {
      toast.error(
        error.message
      );
    }
  };

  const filteredOrders =
    useMemo(() => {
      return orders.filter(
        (order) => {
          const matchesStatus =
            statusFilter ===
              "all" ||
            order.orderStatus ===
              statusFilter;

          const customerName =
            order.user?.name?.toLowerCase() ||
            "";

          const orderId =
            order._id?.toLowerCase() ||
            "";

          const query =
            searchTerm.toLowerCase();

          const matchesSearch =
            customerName.includes(
              query
            ) ||
            orderId.includes(
              query
            );

          return (
            matchesStatus &&
            matchesSearch
          );
        }
      );
    }, [
      orders,
      statusFilter,
      searchTerm,
    ]);

  const totalRevenue =
    filteredOrders.reduce(
      (sum, order) =>
        sum +
        (order.totalPrice || 0),
      0
    );

  const processingCount =
    filteredOrders.filter(
      (o) =>
        o.orderStatus ===
        "processing"
    ).length;

  const shippedCount =
    filteredOrders.filter(
      (o) =>
        o.orderStatus ===
        "shipped"
    ).length;

  const deliveredCount =
    filteredOrders.filter(
      (o) =>
        o.orderStatus ===
        "delivered"
    ).length;

  return (
    <ProtectedRoute adminOnly={true}>
      <div
        style={{
          maxWidth: "1600px",
          margin: "40px auto",
          padding: "20px",
        }}
      >
        {/* HEADER */}
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          style={{
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              fontSize: "50px",
              marginBottom:
                "10px",
            }}
          >
            Order Management 📦
          </h1>

          <p
            style={{
              opacity: 0.75,
            }}
          >
            Premium admin order
            control center
          </p>
        </motion.div>

        {/* STATS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,1fr)",
            gap: "20px",
            marginBottom:
              "30px",
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: "24px",
            }}
          >
            <p
              style={{
                opacity: 0.7,
              }}
            >
              Total Orders
            </p>
            <h2>
              {
                filteredOrders.length
              }
            </h2>
          </div>

          <div
            className="glass-card"
            style={{
              padding: "24px",
            }}
          >
            <p
              style={{
                opacity: 0.7,
              }}
            >
              Processing
            </p>
            <h2>
              {
                processingCount
              }
            </h2>
          </div>

          <div
            className="glass-card"
            style={{
              padding: "24px",
            }}
          >
            <p
              style={{
                opacity: 0.7,
              }}
            >
              Delivered
            </p>
            <h2>
              {
                deliveredCount
              }
            </h2>
          </div>

          <div
            className="glass-card"
            style={{
              padding: "24px",
            }}
          >
            <p
              style={{
                opacity: 0.7,
              }}
            >
              Revenue
            </p>
            <h2>
              ₹
              {
                totalRevenue
              }
            </h2>
          </div>
        </div>

        {/* FILTERS */}
        <div
          className="glass-card"
          style={{
            padding: "24px",
            marginBottom:
              "30px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search by customer or order ID..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            style={{
              flex: 1,
              minWidth: "300px",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            style={{
              width: "220px",
            }}
          >
            <option value="all">
              All Orders
            </option>
            <option value="processing">
              Processing
            </option>
            <option value="shipped">
              Shipped
            </option>
            <option value="delivered">
              Delivered
            </option>
          </select>
        </div>

        {/* LOADING */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gap: "28px",
            }}
          >
            {[1, 2, 3].map(
              (item) => (
                <SkeletonOrder
                  key={item}
                />
              )
            )}
          </div>
        ) : filteredOrders.length ===
          0 ? (
          <div
            className="glass-card"
            style={{
              padding: "60px",
              textAlign:
                "center",
            }}
          >
            <h2>
              No orders found
            </h2>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
            {filteredOrders.map(
              (order) => (
                <motion.div
                  key={
                    order._id
                  }
                  whileHover={{
                    y: -4,
                  }}
                  className="glass-card"
                  style={{
                    padding:
                      "30px",
                  }}
                >
                  {/* TOP */}
                  <div
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
                    }}
                  >
                    <div>
                      <h2>
                        Order #
                        {order._id.slice(
                          -6
                        )}
                      </h2>

                      <p
                        style={{
                          opacity:
                            0.75,
                        }}
                      >
                        Customer:{" "}
                        {order.user
                          ?.name ||
                          "User"}
                      </p>

                      <p
                        style={{
                          opacity:
                            0.75,
                        }}
                      >
                        {new Date(
                          order.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <select
                      value={
                        order.orderStatus
                      }
                      onChange={(
                        e
                      ) =>
                        updateStatus(
                          order._id,
                          e.target
                            .value
                        )
                      }
                      style={{
                        width:
                          "220px",
                      }}
                    >
                      <option value="processing">
                        Processing
                      </option>
                      <option value="shipped">
                        Shipped
                      </option>
                      <option value="delivered">
                        Delivered
                      </option>
                    </select>
                  </div>

                  {/* ITEMS */}
                  <div
                    style={{
                      marginTop:
                        "24px",
                      display:
                        "grid",
                      gap: "16px",
                    }}
                  >
                    {order.orderItems?.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "16px",
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
                                "90px",
                              height:
                                "90px",
                              objectFit:
                                "contain",
                              padding:
                                "8px",
                              background:
                                "rgba(255,255,255,0.05)",
                              borderRadius:
                                "16px",
                            }}
                          />

                          <div
                            style={{
                              flex: 1,
                            }}
                          >
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
                          </div>

                          <h4>
                            ₹
                            {
                              item.price
                            }
                          </h4>
                        </div>
                      )
                    )}
                  </div>

                  {/* FOOTER */}
                  <div
                    style={{
                      marginTop:
                        "24px",
                      paddingTop:
                        "20px",
                      borderTop:
                        "1px solid rgba(255,255,255,0.08)",
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          opacity:
                            0.75,
                        }}
                      >
                        Payment
                      </p>

                      <h4>
                        {
                          order.paymentStatus
                        }
                      </h4>
                    </div>

                    <div>
                      <p
                        style={{
                          opacity:
                            0.75,
                        }}
                      >
                        Total
                      </p>

                      <h3>
                        ₹
                        {
                          order.totalPrice
                        }
                      </h3>
                    </div>
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