import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  ShoppingBag,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import {
  deleteUser,
  getAllOrders,
  getUserById,
  getUsers,
  updateUserRole,
} from "../../../lib/api";

const PAGE_SIZE = 10;

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const dateText = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const idText = (value) => {
  const id = String(value || "");
  return id ? `#${id.slice(-8).toUpperCase()}` : "—";
};

export default function AdminUsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [roleUpdatingId, setRoleUpdatingId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setError("");
      const data = await getUsers();
      const received = data?.users || data?.data?.users || [];
      setUsers(Array.isArray(received) ? received : []);
    } catch (err) {
      console.error("GET USERS ERROR:", err);
      setError(err?.message || "Unable to load customers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && currentUser) loadUsers();
  }, [authLoading, currentUser, loadUsers]);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return users.filter((item) => {
      const role = item?.role === "admin" || item?.isAdmin ? "admin" : "user";
      const matchesRole = roleFilter === "All" || role === roleFilter;
      if (!matchesRole) return false;

      if (!needle) return true;

      return [
        item?.name,
        item?.email,
        item?._id,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE)
  );

  const visibleUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const stats = useMemo(() => {
    const admins = users.filter(
      (item) => item?.role === "admin" || item?.isAdmin
    ).length;

    return {
      total: users.length,
      customers: users.length - admins,
      admins,
    };
  }, [users]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setRoleFilter("All");
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    toast.success("Customers refreshed.");
  };

  const openDetails = async (item) => {
    setSelectedUser(item);
    setUserOrders([]);
    setDetailLoading(true);

    try {
      const [profileData, ordersData] = await Promise.all([
        getUserById(item._id),
        getAllOrders({
          page: 1,
          limit: 100,
          search: item?.email || item?._id || "",
        }),
      ]);

      const profile = profileData?.user || profileData?.data?.user || item;
      const orders =
        ordersData?.orders ||
        ordersData?.data?.orders ||
        [];

      setSelectedUser(profile);
      setUserOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      console.error("GET CUSTOMER DETAILS ERROR:", err);
      toast.error(err?.message || "Unable to load customer details");
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = (item) => {
    setEditingUser(item);
    setEditName(item?.name || "");
    setEditEmail(item?.email || "");
  };

  const saveEdit = async (event) => {
    event.preventDefault();

    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();

    if (name.length < 1 || name.length > 100) {
      toast.error("Name must be between 1 and 100 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setSavingEdit(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : "";

      const base =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const response = await fetch(
        `${base}/api/auth/users/${editingUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ name, email }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Unable to update customer");
      }

      const updated = data?.user || data?.data?.user;

      setUsers((previous) =>
        previous.map((item) =>
          item._id === editingUser._id
            ? { ...item, ...(updated || {}), name, email }
            : item
        )
      );

      if (selectedUser?._id === editingUser._id) {
        setSelectedUser((previous) =>
          previous
            ? { ...previous, ...(updated || {}), name, email }
            : previous
        );
      }

      setEditingUser(null);
      toast.success("Customer profile updated.");
    } catch (err) {
      console.error("UPDATE CUSTOMER ERROR:", err);
      toast.error(err?.message || "Unable to update customer");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRoleChange = async (item, role) => {
    if (String(item?._id) === String(currentUser?._id)) {
      toast.error("You cannot change your own admin access.");
      return;
    }

    const currentRole =
      item?.role === "admin" || item?.isAdmin ? "admin" : "user";

    if (currentRole === role) return;

    const confirmed = window.confirm(
      role === "admin"
        ? `Grant admin access to ${item?.name || item?.email}?`
        : `Remove admin access from ${item?.name || item?.email}?`
    );

    if (!confirmed) return;

    setRoleUpdatingId(item._id);

    try {
      const data = await updateUserRole(item._id, role);
      const updated = data?.user || data?.data?.user;

      setUsers((previous) =>
        previous.map((entry) =>
          entry._id === item._id
            ? {
                ...entry,
                ...(updated || {}),
                role,
                isAdmin: role === "admin",
              }
            : entry
        )
      );

      toast.success(
        role === "admin"
          ? "Admin access granted."
          : "Admin access removed."
      );
    } catch (err) {
      console.error("UPDATE ROLE ERROR:", err);
      toast.error(err?.message || "Unable to update role");
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleDelete = async (item) => {
    const role =
      item?.role === "admin" || item?.isAdmin ? "admin" : "user";

    if (role === "admin") {
      toast.error("Admin users cannot be deleted.");
      return;
    }

    if (String(item?._id) === String(currentUser?._id)) {
      toast.error("You cannot delete your own account here.");
      return;
    }

    const confirmed = window.confirm(
      `Delete customer "${item?.name || item?.email}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(item._id);

    try {
      await deleteUser(item._id);
      setUsers((previous) =>
        previous.filter((entry) => entry._id !== item._id)
      );

      if (selectedUser?._id === item._id) {
        setSelectedUser(null);
        setUserOrders([]);
      }

      toast.success("Customer deleted.");
    } catch (err) {
      console.error("DELETE CUSTOMER ERROR:", err);
      toast.error(err?.message || "Unable to delete customer");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <ProtectedRoute>
        <div className="loading">
          <div className="loader" />
          <strong>Loading customers...</strong>
          <span>Preparing customer management.</span>
          <style jsx>{`
            .loading {
              min-height: 70vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 9px;
              color: #e5edf8;
            }
            .loading span { color: #71809a; font-size: 12px; }
            .loader {
              width: 40px;
              height: 40px;
              border: 4px solid rgba(56,189,248,.14);
              border-top-color: #38bdf8;
              border-radius: 50%;
              animation: spin .8s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="page">
        <div className="shell">
          <header className="header">
            <div>
              <div className="eyebrow">ADMIN PANEL</div>
              <h1>Customers</h1>
              <p>Manage customer profiles, access and order history.</p>
            </div>

            <button
              type="button"
              className="refresh"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          {error && (
            <div className="error">
              <span>{error}</span>
              <button type="button" onClick={handleRefresh}>Try again</button>
            </div>
          )}

          <section className="stats">
            <Stat icon={<Users size={20} />} title="Total Users" value={stats.total} />
            <Stat icon={<UserCheck size={20} />} title="Customers" value={stats.customers} />
            <Stat icon={<Shield size={20} />} title="Administrators" value={stats.admins} />
          </section>

          <section className="filters">
            <div className="searchbox">
              <Search size={18} />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search by name, email or ID..."
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Roles</option>
              <option value="user">Customers</option>
              <option value="admin">Administrators</option>
            </select>

            <button type="button" className="clear" onClick={clearFilters}>
              Clear
            </button>
          </section>

          <section className="table-panel">
            <div className="table-head">
              <div>
                <strong>Customer Directory</strong>
                <span>{filteredUsers.length} matching user{filteredUsers.length === 1 ? "" : "s"}</span>
              </div>
              <span>Page {page} of {totalPages}</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Access</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((item) => {
                    const isAdmin =
                      item?.role === "admin" || item?.isAdmin === true;
                    const isSelf =
                      String(item?._id) === String(currentUser?._id);

                    return (
                      <tr key={item._id}>
                        <td>
                          <div className="customer">
                            <div className={`avatar ${isAdmin ? "admin" : ""}`}>
                              {(item?.name || item?.email || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <strong>{item?.name || "Unnamed user"}</strong>
                              <span>{item?.email || "—"}</span>
                              <small>{idText(item?._id)}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role ${isAdmin ? "admin" : "user"}`}>
                            {isAdmin ? "Administrator" : "Customer"}
                          </span>
                        </td>
                        <td>{dateText(item?.createdAt)}</td>
                        <td>
                          <select
                            className="role-select"
                            value={isAdmin ? "admin" : "user"}
                            disabled={isSelf || roleUpdatingId === item._id}
                            onChange={(event) =>
                              handleRoleChange(item, event.target.value)
                            }
                          >
                            <option value="user">Customer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="icon-button view"
                              title="View customer"
                              onClick={() => openDetails(item)}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-button edit"
                              title="Edit customer"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className="icon-button delete"
                              title="Delete customer"
                              disabled={isAdmin || isSelf || deletingId === item._id}
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!visibleUsers.length && (
                    <tr>
                      <td colSpan="5">
                        <div className="empty">
                          <Users size={30} />
                          <strong>No customers found</strong>
                          <span>Try a different search or filter.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <div className="pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                  .map((number) => (
                    <button
                      key={number}
                      type="button"
                      className={number === page ? "active" : ""}
                      onClick={() => setPage(number)}
                    >
                      {number}
                    </button>
                  ))}
              </div>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </section>
        </div>

        {editingUser && (
          <div className="modal-backdrop" onMouseDown={() => setEditingUser(null)}>
            <form className="modal" onSubmit={saveEdit} onMouseDown={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-eyebrow">CUSTOMER PROFILE</div>
                  <h2>Edit Customer</h2>
                </div>
                <button type="button" className="close" onClick={() => setEditingUser(null)}>
                  <X size={18} />
                </button>
              </div>

              <label>
                Name
                <input value={editName} onChange={(event) => setEditName(event.target.value)} />
              </label>

              <label>
                Email
                <input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} />
              </label>

              <div className="modal-actions">
                <button type="button" className="cancel" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="save" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedUser && (
          <div className="modal-backdrop" onMouseDown={() => setSelectedUser(null)}>
            <div className="detail-modal" onMouseDown={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-eyebrow">CUSTOMER DETAILS</div>
                  <h2>{selectedUser?.name || "Customer"}</h2>
                </div>
                <button type="button" className="close" onClick={() => setSelectedUser(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="profile-card">
                <div className="big-avatar">
                  {(selectedUser?.name || selectedUser?.email || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{selectedUser?.name || "Unnamed user"}</strong>
                  <span><Mail size={13} /> {selectedUser?.email || "—"}</span>
                  <span>Joined {dateText(selectedUser?.createdAt)}</span>
                </div>
                <span className={`role ${selectedUser?.role === "admin" ? "admin" : "user"}`}>
                  {selectedUser?.role === "admin" ? "Administrator" : "Customer"}
                </span>
              </div>

              <div className="orders-title">
                <div>
                  <strong>Order History</strong>
                  <span>{userOrders.length} order{userOrders.length === 1 ? "" : "s"} loaded</span>
                </div>
                <ShoppingBag size={18} />
              </div>

              {detailLoading ? (
                <div className="detail-loading">Loading order history...</div>
              ) : userOrders.length ? (
                <div className="order-history">
                  {userOrders.map((order) => (
                    <Link
                      href="/admin/orders"
                      key={order?._id}
                      className="history-row"
                    >
                      <div>
                        <strong>{idText(order?._id)}</strong>
                        <span>{dateText(order?.createdAt)}</span>
                      </div>
                      <strong>{money(order?.totalPrice)}</strong>
                      <span className={`status ${String(order?.status || "Pending").toLowerCase()}`}>
                        {order?.status || "Pending"}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="detail-empty">
                  <ShoppingBag size={27} />
                  <span>No orders found for this customer.</span>
                </div>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          .page {
            min-height: 100vh;
            padding: 34px 28px 80px;
            color: #f8fafc;
            background:
              radial-gradient(circle at 8% 5%, rgba(124,58,237,.2), transparent 28%),
              radial-gradient(circle at 92% 12%, rgba(6,182,212,.15), transparent 30%),
              linear-gradient(135deg, #090f22 0%, #151331 48%, #092b3b 100%);
          }
          .shell { max-width: 1500px; margin: 0 auto; }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 25px;
          }
          .eyebrow, .modal-eyebrow {
            color: #67e8f9;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 1.8px;
          }
          h1 {
            margin: 7px 0 0;
            font-size: clamp(36px, 5vw, 54px);
            line-height: 1;
            letter-spacing: -1.5px;
            font-weight: 900;
          }
          .header p {
            margin: 9px 0 0;
            color: #aab6ca;
            font-size: 14px;
          }
          .refresh {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: 43px;
            padding: 0 16px;
            border: 1px solid rgba(56,189,248,.2);
            border-radius: 10px;
            background: rgba(255,255,255,.06);
            color: #dffaff;
            font-weight: 900;
            cursor: pointer;
          }
          .refresh:disabled { opacity: .55; cursor: wait; }
          .spin { animation: spin 1s linear infinite; }
          .error {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
            padding: 12px 14px;
            border: 1px solid rgba(248,113,113,.25);
            border-radius: 11px;
            background: rgba(127,29,29,.25);
            color: #fecaca;
            font-size: 12px;
          }
          .error button {
            margin-left: auto;
            border: 0;
            border-radius: 7px;
            padding: 7px 10px;
            background: #dc2626;
            color: white;
            font-weight: 800;
            cursor: pointer;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 13px;
            margin-bottom: 14px;
          }
          .stat {
            min-height: 120px;
            padding: 18px;
            border: 1px solid rgba(148,163,184,.14);
            border-radius: 17px;
            background: rgba(255,255,255,.052);
            box-shadow: 0 18px 45px rgba(0,0,0,.16);
          }
          .stat-icon {
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: rgba(34,211,238,.1);
            color: #67e8f9;
          }
          .stat-title {
            display: block;
            margin-top: 12px;
            color: #8291aa;
            font-size: 10px;
            font-weight: 800;
          }
          .stat-value {
            display: block;
            margin-top: 4px;
            color: white;
            font-size: 27px;
            font-weight: 900;
          }
          .filters {
            display: grid;
            grid-template-columns: minmax(0,1fr) 180px 80px;
            gap: 10px;
            padding: 13px;
            margin-bottom: 14px;
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 15px;
            background: rgba(255,255,255,.045);
          }
          .searchbox {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 43px;
            padding: 0 13px;
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 10px;
            background: rgba(8,15,34,.34);
            color: #8291aa;
          }
          .searchbox input,
          .filters select {
            width: 100%;
            height: 43px;
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 10px;
            outline: none;
            background: rgba(8,15,34,.34);
            color: #e7eef9;
            font: inherit;
            font-size: 12px;
          }
          .searchbox input {
            height: 40px;
            padding: 0;
            border: 0;
            background: transparent;
          }
          .filters select { padding: 0 11px; }
          .filters select option { background: #10172c; }
          .clear {
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 10px;
            background: rgba(255,255,255,.04);
            color: #a9b5c8;
            font-weight: 800;
            cursor: pointer;
          }
          .table-panel {
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.14);
            border-radius: 18px;
            background: rgba(255,255,255,.05);
            box-shadow: 0 20px 55px rgba(0,0,0,.18);
          }
          .table-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 20px;
            border-bottom: 1px solid rgba(148,163,184,.09);
            color: #71809a;
            font-size: 10px;
          }
          .table-head strong {
            display: block;
            color: #f1f5f9;
            font-size: 14px;
          }
          .table-head span { margin-top: 3px; }
          .table-wrap { overflow-x: auto; }
          table {
            width: 100%;
            min-width: 900px;
            border-collapse: collapse;
          }
          th, td {
            padding: 14px 18px;
            border-bottom: 1px solid rgba(148,163,184,.075);
            text-align: left;
            vertical-align: middle;
          }
          th {
            background: rgba(255,255,255,.025);
            color: #74839b;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          td {
            color: #b4c0d1;
            font-size: 11px;
          }
          .customer {
            display: flex;
            align-items: center;
            gap: 11px;
          }
          .avatar, .big-avatar {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(34,211,238,.18), rgba(99,102,241,.18));
            color: #9cefff;
            font-weight: 900;
          }
          .avatar {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }
          .avatar.admin {
            background: linear-gradient(135deg, rgba(167,139,250,.2), rgba(79,70,229,.2));
            color: #c4b5fd;
          }
          .customer strong, .customer span, .customer small {
            display: block;
          }
          .customer strong { color: #edf2f8; font-size: 12px; }
          .customer span { margin-top: 3px; color: #8390a6; font-size: 10px; }
          .customer small { margin-top: 3px; color: #53627a; font-size: 8px; }
          .role {
            display: inline-flex;
            padding: 6px 9px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 900;
          }
          .role.user { background: rgba(34,211,238,.08); color: #67e8f9; }
          .role.admin { background: rgba(167,139,250,.1); color: #c4b5fd; }
          .role-select {
            height: 34px;
            min-width: 120px;
            padding: 0 9px;
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 8px;
            outline: none;
            background: rgba(8,15,34,.38);
            color: #dce7f4;
            font-size: 10px;
            font-weight: 800;
          }
          .role-select:disabled { opacity: .5; }
          .actions { display: flex; gap: 7px; }
          .icon-button {
            position: relative;
            z-index: 2;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(148,163,184,.16);
            border-radius: 9px;
            background: rgba(255,255,255,.035);
            cursor: pointer;
          }
          .icon-button::before {
            display: none !important;
          }
          .icon-button svg {
            position: relative;
            z-index: 3;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            stroke: currentColor !important;
            flex-shrink: 0;
          }
          .icon-button.view { color: #67e8f9 !important; }
          .icon-button.edit { color: #c4b5fd !important; }
          .icon-button.delete { color: #fca5a5 !important; }
          .icon-button:disabled { opacity: .45; cursor: not-allowed; }

          .icon-button.view { color: #67e8f9; }
          .icon-button.edit { color: #93c5fd; }
          .icon-button.delete { color: #f87171; }
          .icon-button:disabled { opacity: .28; cursor: not-allowed; }
          .empty {
            min-height: 190px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 7px;
            color: #64738b;
          }
          .empty strong { color: #aab6c8; }
          .empty span { font-size: 10px; }
          .pagination {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 14px 18px;
          }
          .pagination > button {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 8px 10px;
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 8px;
            background: rgba(255,255,255,.035);
            color: #9eabc0;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
          }
          .pagination > button:disabled { opacity: .35; cursor: not-allowed; }
          .pages { display: flex; gap: 5px; }
          .pages button {
            width: 31px;
            height: 31px;
            border: 1px solid rgba(148,163,184,.12);
            border-radius: 7px;
            background: transparent;
            color: #8190a8;
            font-size: 10px;
            font-weight: 900;
            cursor: pointer;
          }
          .pages button.active {
            background: linear-gradient(135deg, rgba(34,211,238,.22), rgba(99,102,241,.22));
            color: #fff;
            border-color: rgba(56,189,248,.24);
          }
          .modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(2,6,23,.72);
            backdrop-filter: blur(8px);
          }
          .modal, .detail-modal {
            width: min(500px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            padding: 22px;
            border: 1px solid rgba(148,163,184,.17);
            border-radius: 18px;
            background: linear-gradient(145deg, #151b34, #0b2533);
            box-shadow: 0 30px 90px rgba(0,0,0,.45);
          }
          .detail-modal { width: min(680px, 100%); }
          .modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 20px;
          }
          h2 {
            margin: 5px 0 0;
            color: white;
            font-size: 22px;
            font-weight: 900;
          }
          .close {
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 9px;
            background: rgba(255,255,255,.04);
            color: #aebbd0;
            cursor: pointer;
          }
          label {
            display: block;
            margin-top: 15px;
            color: #8997ad;
            font-size: 10px;
            font-weight: 900;
          }
          label input {
            display: block;
            width: 100%;
            height: 43px;
            margin-top: 7px;
            padding: 0 12px;
            border: 1px solid rgba(148,163,184,.15);
            border-radius: 9px;
            outline: none;
            background: rgba(8,15,34,.42);
            color: #eef5fc;
            font: inherit;
            font-size: 12px;
          }
          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 22px;
          }
          .cancel, .save {
            min-height: 40px;
            padding: 0 14px;
            border-radius: 9px;
            font-weight: 900;
            cursor: pointer;
          }
          .cancel {
            border: 1px solid rgba(148,163,184,.13);
            background: rgba(255,255,255,.04);
            color: #aebbd0;
          }
          .save {
            border: 0;
            background: linear-gradient(135deg, #0891b2, #4f46e5);
            color: white;
          }
          .save:disabled { opacity: .5; cursor: wait; }
          .profile-card {
            display: grid;
            grid-template-columns: 48px minmax(0,1fr) auto;
            align-items: center;
            gap: 12px;
            padding: 13px;
            border: 1px solid rgba(148,163,184,.1);
            border-radius: 12px;
            background: rgba(255,255,255,.035);
          }
          .big-avatar { width: 48px; height: 48px; font-size: 17px; }
          .profile-card strong, .profile-card span {
            display: block;
          }
          .profile-card strong { color: #f2f7fc; font-size: 13px; }
          .profile-card span {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 4px;
            color: #7e8da5;
            font-size: 9px;
          }
          .orders-title {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin: 20px 0 8px;
            color: #67e8f9;
          }
          .orders-title strong, .orders-title span { display: block; }
          .orders-title strong { color: #f2f7fc; font-size: 13px; }
          .orders-title span { margin-top: 3px; color: #708098; font-size: 9px; }
          .order-history {
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.1);
            border-radius: 11px;
          }
          .history-row {
            display: grid;
            grid-template-columns: 1fr auto auto;
            align-items: center;
            gap: 12px;
            padding: 12px 13px;
            border-bottom: 1px solid rgba(148,163,184,.07);
            color: inherit;
            text-decoration: none;
          }
          .history-row:last-child { border-bottom: 0; }
          .history-row strong, .history-row span { display: block; }
          .history-row strong { color: #eaf2fb; font-size: 11px; }
          .history-row > div span { margin-top: 3px; color: #6e7c94; font-size: 8px; }
          .history-row > strong { color: #bff7ff; }
          .status {
            padding: 5px 7px;
            border-radius: 999px;
            font-size: 8px !important;
            font-weight: 900;
          }
          .status.pending { background: rgba(251,146,60,.1); color: #fdba74; }
          .status.confirmed { background: rgba(96,165,250,.1); color: #93c5fd; }
          .status.processing { background: rgba(167,139,250,.1); color: #c4b5fd; }
          .status.shipped { background: rgba(34,211,238,.1); color: #67e8f9; }
          .status.delivered { background: rgba(52,211,153,.1); color: #6ee7b7; }
          .status.cancelled { background: rgba(248,113,113,.1); color: #fca5a5; }
          .detail-loading, .detail-empty {
            min-height: 140px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #75849c;
            font-size: 11px;
          }
          .detail-empty { flex-direction: column; gap: 8px; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 800px) {
            .page { padding: 24px 15px 60px; }
            .header { align-items: flex-start; flex-direction: column; }
            .refresh { width: 100%; justify-content: center; }
            .filters { grid-template-columns: 1fr; }
            .stats { grid-template-columns: 1fr; }
          }
          @media (max-width: 560px) {
            .pagination { flex-wrap: wrap; justify-content: center; }
            .profile-card { grid-template-columns: 48px 1fr; }
            .profile-card > .role { grid-column: 1 / -1; width: fit-content; }
          }
        `}</style>
      </main>
    </ProtectedRoute>
  );
}

function Stat({ icon, title, value }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <span className="stat-title">{title}</span>
      <strong className="stat-value">{Number(value || 0).toLocaleString("en-IN")}</strong>
      <style jsx>{`
        .stat {
          min-height: 120px;
          padding: 18px;
          border: 1px solid rgba(148,163,184,.14);
          border-radius: 17px;
          background: rgba(255,255,255,.052);
          box-shadow: 0 18px 45px rgba(0,0,0,.16);
        }
        .stat-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(34,211,238,.1);
          color: #67e8f9;
        }
        .stat-title {
          display: block;
          margin-top: 12px;
          color: #8291aa;
          font-size: 10px;
          font-weight: 800;
        }
        .stat-value {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 27px;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}
