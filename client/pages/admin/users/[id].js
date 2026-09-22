import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  Shield,
  ShieldOff,
  Trash2,
  Save,
  User,
  Mail,
  Calendar,
  Heart,
  ShoppingBag,
} from "lucide-react";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { apiFetch } from "../../../lib/api";

export default function CustomerManagement() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  // ============================================================
  // FETCH USER
  // ============================================================

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    fetchUser();
  }, [router.isReady, id]);

  const fetchUser = async () => {
    try {
      setLoading(true);

      console.log(
        "=============================================="
      );

      console.log(
        "CUSTOMER REQUEST:",
        `/api/auth/users/${id}`
      );

      const data = await apiFetch(
        `/api/auth/users/${id}`,
        {
          method: "GET",
          auth: true,
        }
      );

      console.log(
        "CUSTOMER RESPONSE:",
        data
      );

      console.log(
        "=============================================="
      );

      // ========================================================
      // SUPPORT DIFFERENT SERVER RESPONSE FORMATS
      // ========================================================

      const customer =
        data?.user ||
        data?.customer ||
        data;

      const customerOrders =
        data?.orders ||
        customer?.orders ||
        [];

      if (!customer || !customer._id) {
        throw new Error(
          "Customer data was not found"
        );
      }

      setUser(customer);

      setOrders(
        Array.isArray(customerOrders)
          ? customerOrders
          : []
      );

      setForm({
        name: customer.name || "",
        email: customer.email || "",
      });

    } catch (error) {
      console.error(
        "FETCH USER ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Unable to load customer"
      );

      setUser(null);
      setOrders([]);

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // UPDATE USER
  // ============================================================

  const updateUser = async (e) => {
    e.preventDefault();

    if (!id) {
      toast.error("User ID is missing");
      return;
    }

    try {
      setSaving(true);

      console.log(
        "=============================================="
      );

      console.log(
        "UPDATE USER REQUEST:",
        `/api/auth/users/${id}`
      );

      console.log(
        "UPDATE DATA:",
        {
          name: form.name,
          email: form.email,
        }
      );

      const data = await apiFetch(
        `/api/auth/users/${id}`,
        {
          method: "PUT",

          // IMPORTANT:
          // Send JWT token
          auth: true,

          // apiFetch automatically JSON.stringify()
          body: {
            name: form.name,
            email: form.email,
          },
        }
      );

      console.log(
        "UPDATE USER RESPONSE:",
        data
      );

      console.log(
        "=============================================="
      );

      const updatedUser =
        data?.user ||
        data?.customer ||
        data;

      if (
        updatedUser &&
        typeof updatedUser === "object"
      ) {
        setUser((prev) => ({
          ...prev,
          ...updatedUser,
        }));

        setForm({
          name:
            updatedUser?.name ||
            form.name,

          email:
            updatedUser?.email ||
            form.email,
        });
      }

      toast.success(
        data?.message ||
          "Customer updated successfully"
      );

    } catch (error) {
      console.error(
        "UPDATE USER ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Unable to update customer"
      );

    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHANGE ROLE
  // ============================================================

  const updateRole = async () => {
    if (!user || !id) {
      toast.error("User information is missing");
      return;
    }

    // ========================================================
    // CURRENT ADMIN STATUS
    // ========================================================

    const isCurrentlyAdmin =
      user.role === "admin" ||
      user.isAdmin === true;

    // ========================================================
    // NEW ROLE
    // ========================================================

    const newRole =
      isCurrentlyAdmin
        ? "user"
        : "admin";

    // ========================================================
    // CONFIRMATION
    // ========================================================

    const message =
      newRole === "admin"
        ? `Give ${
            user.name || "this customer"
          } admin access?`
        : `Remove admin access from ${
            user.name || "this customer"
          }?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setSaving(true);

      console.log(
        "=============================================="
      );

      console.log(
        "ROLE UPDATE REQUEST:",
        `/api/auth/users/${id}/role`
      );

      console.log(
        "NEW ROLE:",
        newRole
      );

      const data = await apiFetch(
        `/api/auth/users/${id}/role`,
        {
          method: "PUT",

          // IMPORTANT:
          // Send JWT token
          auth: true,

          // apiFetch automatically JSON.stringify()
          body: {
            role: newRole,
          },
        }
      );

      console.log(
        "ROLE UPDATE RESPONSE:",
        data
      );

      console.log(
        "=============================================="
      );

      const updatedUser =
        data?.user ||
        data?.customer ||
        {};

      setUser((prev) => ({
        ...prev,
        ...updatedUser,

        // Make sure local UI immediately
        // reflects the new role
        role:
          updatedUser?.role ||
          newRole,
      }));

      toast.success(
        data?.message ||
          (
            newRole === "admin"
              ? "Admin access granted"
              : "Admin access removed"
          )
      );

    } catch (error) {
      console.error(
        "ROLE UPDATE ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Unable to update role"
      );

    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE USER
  // ============================================================

  const deleteUser = async () => {
    if (!user || !id) {
      toast.error("User information is missing");
      return;
    }

    // ========================================================
    // CONFIRM DELETE
    // ========================================================

    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete ${
          user.name || "this customer"
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      console.log(
        "=============================================="
      );

      console.log(
        "DELETE USER REQUEST:",
        `/api/auth/users/${id}`
      );

      const data = await apiFetch(
        `/api/auth/users/${id}`,
        {
          method: "DELETE",

          // IMPORTANT:
          // Send JWT token
          auth: true,
        }
      );

      console.log(
        "DELETE USER RESPONSE:",
        data
      );

      console.log(
        "=============================================="
      );

      toast.success(
        data?.message ||
          "Customer deleted successfully"
      );

      // ======================================================
      // RETURN TO USERS PAGE
      // ======================================================

      router.push(
        "/admin/users"
      );

    } catch (error) {
      console.error(
        "DELETE USER ERROR:",
        error
      );

      toast.error(
        error.message ||
          "Unable to delete customer"
      );

    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <ProtectedRoute adminOnly>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "50px 20px",
            textAlign: "center",
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: "70px 20px",
              borderRadius: "24px",
            }}
          >
            <h3>
              Loading customer...
            </h3>

            <p
              style={{
                opacity: 0.6,
              }}
            >
              Please wait.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ============================================================
  // USER NOT FOUND
  // ============================================================

  if (!user) {
    return (
      <ProtectedRoute adminOnly>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "50px 20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: "50px",
              borderRadius: "24px",
              textAlign: "center",
            }}
          >
            <h2>
              Customer not found
            </h2>

            <Link
              href="/admin/users"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "20px",
                textDecoration: "none",
                fontWeight: "700",
              }}
            >
              <ArrowLeft size={18} />

              Back to Customers
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // ============================================================
  // ADMIN STATUS
  // ============================================================

  const isAdmin =
    user.role === "admin" ||
    user.isAdmin === true;

  // ============================================================
  // WISHLIST COUNT
  // ============================================================

  const wishlistCount =
    Array.isArray(user.wishlist)
      ? user.wishlist.length
      : 0;

  // ============================================================
  // ORDER COUNT
  // ============================================================

  const orderCount =
    Array.isArray(orders)
      ? orders.length
      : Array.isArray(user.orders)
      ? user.orders.length
      : 0;

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <ProtectedRoute adminOnly>
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "30px 20px 60px",
        }}
      >

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >

          <div>

            <Link
              href="/admin/users"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                textDecoration: "none",
                opacity: 0.7,
                marginBottom: "12px",
              }}
            >
              <ArrowLeft size={17} />

              Back to Customers
            </Link>

            <h1
              style={{
                fontSize:
                  "clamp(28px,5vw,42px)",
                fontWeight: "900",
                margin: 0,
              }}
            >
              Customer Management
            </h1>

            <p
              style={{
                opacity: 0.6,
                marginTop: "8px",
              }}
            >
              Manage customer account
              and permissions.
            </p>

          </div>

          {/* ================================================= */}
          {/* ROLE BADGE */}
          {/* ================================================= */}

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "999px",

              background:
                isAdmin
                  ? "rgba(14,165,233,0.12)"
                  : "rgba(148,163,184,0.10)",

              border:
                isAdmin
                  ? "1px solid rgba(14,165,233,0.3)"
                  : "1px solid rgba(148,163,184,0.2)",

              fontWeight: "800",
            }}
          >

            {isAdmin ? (
              <Shield size={17} />
            ) : (
              <User size={17} />
            )}

            {isAdmin
              ? "Administrator"
              : "Customer"}

          </div>

        </div>

        {/* ================================================== */}
        {/* CUSTOMER OVERVIEW */}
        {/* ================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: "16px",
            marginBottom: "25px",
          }}
        >

          {/* ================================================= */}
          {/* NAME */}
          {/* ================================================= */}

          <div
            className="glass-card"
            style={{
              padding: "22px",
              borderRadius: "20px",
            }}
          >

            <User
              size={21}
              style={{
                marginBottom: "12px",
              }}
            />

            <div
              style={{
                fontSize: "13px",
                opacity: 0.6,
                marginBottom: "5px",
              }}
            >
              Customer Name
            </div>

            <strong
              style={{
                fontSize: "18px",
              }}
            >
              {user.name || "—"}
            </strong>

          </div>

          {/* ================================================= */}
          {/* EMAIL */}
          {/* ================================================= */}

          <div
            className="glass-card"
            style={{
              padding: "22px",
              borderRadius: "20px",
            }}
          >

            <Mail
              size={21}
              style={{
                marginBottom: "12px",
              }}
            />

            <div
              style={{
                fontSize: "13px",
                opacity: 0.6,
                marginBottom: "5px",
              }}
            >
              Email
            </div>

            <strong
              style={{
                fontSize: "16px",
                wordBreak: "break-word",
              }}
            >
              {user.email || "—"}
            </strong>

          </div>

          {/* ================================================= */}
          {/* CREATED */}
          {/* ================================================= */}

          <div
            className="glass-card"
            style={{
              padding: "22px",
              borderRadius: "20px",
            }}
          >

            <Calendar
              size={21}
              style={{
                marginBottom: "12px",
              }}
            />

            <div
              style={{
                fontSize: "13px",
                opacity: 0.6,
                marginBottom: "5px",
              }}
            >
              Registered
            </div>

            <strong
              style={{
                fontSize: "16px",
              }}
            >
              {user.createdAt
                ? new Date(
                    user.createdAt
                  ).toLocaleDateString(
                    "en-IN"
                  )
                : "—"}
            </strong>

          </div>

          {/* ================================================= */}
          {/* WISHLIST */}
          {/* ================================================= */}

          <div
            className="glass-card"
            style={{
              padding: "22px",
              borderRadius: "20px",
            }}
          >

            <Heart
              size={21}
              style={{
                marginBottom: "12px",
              }}
            />

            <div
              style={{
                fontSize: "13px",
                opacity: 0.6,
                marginBottom: "5px",
              }}
            >
              Wishlist
            </div>

            <strong
              style={{
                fontSize: "18px",
              }}
            >
              {wishlistCount} items
            </strong>

          </div>

        </div>

        {/* ================================================== */}
        {/* MAIN CONTENT */}
        {/* ================================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0,2fr) minmax(280px,1fr)",
            gap: "20px",
            alignItems: "start",
          }}
        >

          {/* ================================================= */}
          {/* EDIT CUSTOMER */}
          {/* ================================================= */}

          <form
            onSubmit={updateUser}
            className="glass-card"
            style={{
              padding: "28px",
              borderRadius: "24px",
            }}
          >

            <h2
              style={{
                fontSize: "24px",
                fontWeight: "800",
                marginTop: 0,
              }}
            >
              Customer Details
            </h2>

            <p
              style={{
                opacity: 0.6,
                marginBottom: "25px",
              }}
            >
              Update the customer's
              basic account information.
            </p>

            {/* ================================================= */}
            {/* NAME */}
            {/* ================================================= */}

            <div
              style={{
                marginBottom: "20px",
              }}
            >

              <label
                style={{
                  display: "block",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />

            </div>

            {/* ================================================= */}
            {/* EMAIL */}
            {/* ================================================= */}

            <div
              style={{
                marginBottom: "25px",
              }}
            >

              <label
                style={{
                  display: "block",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />

            </div>

            {/* ================================================= */}
            {/* SAVE */}
            {/* ================================================= */}

            <button
              type="submit"
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",

                padding: "12px 20px",
                borderRadius: "12px",
                border: "none",

                background:
                  "linear-gradient(135deg,#0284c7,#0369a1)",

                color: "#ffffff",
                fontWeight: "800",

                cursor:
                  saving
                    ? "not-allowed"
                    : "pointer",

                opacity:
                  saving
                    ? 0.6
                    : 1,
              }}
            >

              <Save size={17} />

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>

          </form>

          {/* ================================================= */}
          {/* ADMIN ACTIONS */}
          {/* ================================================= */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >

            {/* ================================================= */}
            {/* ROLE */}
            {/* ================================================= */}

            <div
              className="glass-card"
              style={{
                padding: "25px",
                borderRadius: "24px",
              }}
            >

              <h3
                style={{
                  marginTop: 0,
                  fontSize: "20px",
                }}
              >
                Access Control
              </h3>

              <p
                style={{
                  opacity: 0.6,
                  lineHeight: "1.6",
                }}
              >
                Control whether this customer
                can access the admin panel.
              </p>

              <button
                type="button"
                onClick={updateRole}
                disabled={saving}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",

                  padding: "12px",
                  marginTop: "15px",

                  borderRadius: "12px",

                  border:
                    isAdmin
                      ? "1px solid #f59e0b"
                      : "none",

                  background:
                    isAdmin
                      ? "rgba(245,158,11,0.10)"
                      : "linear-gradient(135deg,#0284c7,#0369a1)",

                  color:
                    isAdmin
                      ? "inherit"
                      : "#ffffff",

                  fontWeight: "800",

                  cursor:
                    saving
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    saving
                      ? 0.6
                      : 1,
                }}
              >

                {isAdmin ? (
                  <ShieldOff size={17} />
                ) : (
                  <Shield size={17} />
                )}

                {isAdmin
                  ? "Remove Admin Access"
                  : "Give Admin Access"}

              </button>

            </div>

            {/* ================================================= */}
            {/* ORDERS */}
            {/* ================================================= */}

            <div
              className="glass-card"
              style={{
                padding: "25px",
                borderRadius: "24px",
              }}
            >

              <ShoppingBag size={22} />

              <h3>
                Orders
              </h3>

              <p
                style={{
                  opacity: 0.6,
                }}
              >
                Customer order history
                will appear here.
              </p>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "900",
                }}
              >
                {orderCount}
              </div>

            </div>

            {/* ================================================= */}
            {/* DELETE */}
            {/* ================================================= */}

            <div
              className="glass-card"
              style={{
                padding: "25px",
                borderRadius: "24px",

                border:
                  "1px solid rgba(239,68,68,0.25)",
              }}
            >

              <h3
                style={{
                  color: "#ef4444",
                }}
              >
                Danger Zone
              </h3>

              <p
                style={{
                  opacity: 0.6,
                  lineHeight: "1.6",
                }}
              >
                Permanently delete this
                customer account.
              </p>

              <button
                type="button"
                onClick={deleteUser}
                disabled={deleting}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",

                  padding: "12px",

                  border: "none",
                  borderRadius: "12px",

                  background: "#ef4444",
                  color: "#ffffff",

                  fontWeight: "800",

                  cursor:
                    deleting
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    deleting
                      ? 0.6
                      : 1,
                }}
              >

                <Trash2 size={17} />

                {deleting
                  ? "Deleting..."
                  : "Delete Customer"}

              </button>

            </div>

          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
}