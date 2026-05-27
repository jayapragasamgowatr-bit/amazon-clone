import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import SkeletonOrder from "../components/SkeletonOrder";

export default function OrdersPage() {
  const { user } = useAuth();

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch(
        "/api/orders",
        {
          headers: {
            Authorization:
              `Bearer ${user.token}`,
          },
        }
      );

      setOrders(data);

    } catch (error) {
      toast.error(
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          maxWidth: "1500px",
          margin: "40px auto",
          padding: "20px",
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
    );
  }

  if (!orders.length) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px",
        }}
      >
        No orders found
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
      <h1>My Orders</h1>

      <div
        style={{
          display: "grid",
          gap: "28px",
        }}
      >
        {orders.map((order) => (
          <motion.div
            key={order._id}
            className="glass-card"
            style={{
              padding: "30px",
            }}
          >
            <h2>
              Order #
              {order._id.slice(
                -6
              )}
            </h2>

            {order.orderItems.map(
              (item, index) => (
                <div
                  key={index}
                  style={{
                    display:
                      "flex",
                    gap: "16px",
                    marginTop:
                      "16px",
                  }}
                >
                  <img
                    src={
                      item.image
                    }
                    style={{
                      width:
                        "90px",
                      height:
                        "90px",
                      objectFit:
                        "contain",
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
                  </div>
                </div>
              )
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}