import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div
        style={{
          maxWidth: "1200px",
          margin: "60px auto",
          padding: "20px",
        }}
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
          className="glass-card"
          style={{
            padding: "50px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "30px",
              flexWrap: "wrap",
            }}
          >
            {/* AVATAR */}
            <div
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg,#06b6d4,#8b5cf6,#ec4899)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "48px",
                fontWeight: "800",
                color: "white",
                boxShadow:
                  "0 12px 30px rgba(0,0,0,0.35)",
              }}
            >
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            {/* USER INFO */}
            <div
              style={{
                flex: 1,
              }}
            >
              <h1
                style={{
                  fontSize: "42px",
                  marginBottom: "10px",
                }}
              >
                My Profile 👤
              </h1>

              <p
                style={{
                  fontSize: "20px",
                  opacity: 0.85,
                }}
              >
                <strong>Name:</strong>{" "}
                {user?.name}
              </p>

              <p
                style={{
                  fontSize: "20px",
                  opacity: 0.85,
                  marginTop: "10px",
                }}
              >
                <strong>Email:</strong>{" "}
                {user?.email}
              </p>

              <p
                style={{
                  fontSize: "20px",
                  opacity: 0.85,
                  marginTop: "10px",
                }}
              >
                <strong>Role:</strong>{" "}
                {user?.role}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div
            style={{
              marginTop: "40px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() =>
                window.location.href =
                  "/orders"
              }
            >
              My Orders
            </button>

            <button
              onClick={() =>
                window.location.href =
                  "/wishlist"
              }
            >
              Wishlist
            </button>

            <button
              onClick={logout}
              style={{
                background:
                  "linear-gradient(135deg,#ef4444,#dc2626)",
              }}
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}