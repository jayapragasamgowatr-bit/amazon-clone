import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  getAllOrders,
  getAdminAnalytics,
  updateOrderStatus,
  deleteOrder,
} from "../../lib/api";

// ============================================================
// ADMIN ORDERS PAGE
// ============================================================

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [analytics, setAnalytics] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalOrders: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // ============================================================
  // LOAD ORDERS + SERVER ANALYTICS
  // ============================================================

  const loadOrders = async () => {
    try {
      setError("");

      const params = {
        page: pagination.page,
        limit: 20,
        search,
        status: statusFilter === "All" ? "" : statusFilter,
        from,
        to,
      };

      const [ordersData, analyticsData] = await Promise.all([
        getAllOrders(params),
        getAdminAnalytics({ from, to }),
      ]);

      const receivedOrders =
        ordersData?.orders ||
        ordersData?.data?.orders ||
        [];

      setOrders(
        Array.isArray(receivedOrders)
          ? receivedOrders
          : []
      );

      setPagination(
        ordersData?.pagination || {
          page: pagination.page,
          limit: 20,
          totalOrders: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );

      setAnalytics(analyticsData?.summary || null);
    } catch (err) {
      console.error("GET ORDERS ERROR:", err);

      setError(err?.message || "Unable to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadOrders();
    } catch (err) {
      console.error("REFRESH ORDERS ERROR:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [pagination.page, search, statusFilter, from, to]);

  // ============================================================
  // FILTERS
  // ============================================================

  const applyFilters = () => {
    setSearch(searchInput.trim());
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("All");
    setFrom("");
    setTo("");
    setPagination((previous) => ({ ...previous, page: 1 }));
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      applyFilters();
    }
  };

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const handleStatusChange = async (
    orderId,
    newStatus
  ) => {
    if (!orderId || !newStatus) {
      return;
    }

    try {
      setUpdatingId(orderId);

      console.log(
        "UPDATING ORDER:",
        orderId,
        newStatus
      );

      let cancellationReason = "";

      if (newStatus === "Cancelled") {
        cancellationReason =
          window.prompt(
            "Enter cancellation reason (optional):"
          ) || "";
      }

      const data =
        await updateOrderStatus(
          orderId,
          newStatus,
          cancellationReason
        );

      console.log(
        "STATUS UPDATE RESPONSE:",
        data
      );

      setOrders((previousOrders) =>
        previousOrders.map((order) => {
          const id =
            order?._id ||
            order?.id;

          if (id === orderId) {
            return {
              ...order,
              status: newStatus,
              deliveredAt:
                newStatus === "Delivered"
                  ? new Date().toISOString()
                  : order.deliveredAt,
            };
          }

          return order;
        })
      );

      toast.success(
        `Order status updated to ${newStatus}`,
        {
          duration: 3500,
        }
      );

      setSelectedOrder((previous) => {
        if (!previous) {
          return previous;
        }

        const selectedId =
          previous?._id ||
          previous?.id;

        if (selectedId !== orderId) {
          return previous;
        }

        return {
          ...previous,
          status: newStatus,
          deliveredAt:
            newStatus === "Delivered"
              ? new Date().toISOString()
              : previous.deliveredAt,
        };
      });
    } catch (err) {
      console.error(
        "UPDATE STATUS ERROR:",
        err
      );

      toast.error(
        err?.message ||
          "Unable to update order status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================================
  // DELETE ORDER
  // ============================================================

  const handleDeleteOrder = async (
    orderId
  ) => {
    if (!orderId) {
      toast.error("Order ID is missing.", { duration: 4000 });
      return;
    }

    const currentOrder = orders.find(
      (order) => getOrderId(order) === orderId
    );

    const status = currentOrder?.status || "Unknown";
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete this order?\n\nOrder status: ${status}\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(orderId);

      await deleteOrder(orderId);

      setOrders((previousOrders) =>
        previousOrders.filter((order) => getOrderId(order) !== orderId)
      );

      setSelectedOrder((previous) => {
        if (!previous) return null;
        return getOrderId(previous) === orderId ? null : previous;
      });

      toast.success("Order deleted successfully.", { duration: 4000 });
    } catch (err) {
      console.error("DELETE ORDER ERROR:", err);
      toast.error(err?.message || "Unable to delete order.", { duration: 4000 });
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // VALID STATUS TRANSITIONS
  // ============================================================

  const getAvailableStatuses = (currentStatus) => {
    const transitions = {
      Pending: ["Pending", "Confirmed", "Cancelled"],
      Confirmed: ["Confirmed", "Processing", "Cancelled"],
      Processing: ["Processing", "Shipped", "Cancelled"],
      Shipped: ["Shipped", "Delivered", "Cancelled"],
      Delivered: ["Delivered"],
      Cancelled: ["Cancelled"],
    };

    return transitions[currentStatus] || [currentStatus || "Pending"];
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    try {
      return new Date(
        date
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "-";
    }
  };

  // ============================================================
  // FORMAT CURRENCY
  // ============================================================

  const formatCurrency = (
    amount
  ) => {
    const value =
      Number(amount) || 0;

    return `₹${value.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ============================================================
  // GET ORDER ID
  // ============================================================

  const getOrderId = (order) => {
    return (
      order?._id ||
      order?.id ||
      ""
    );
  };

  // ============================================================
  // CUSTOMER NAME
  // ============================================================

  const getCustomerName = (
    order
  ) => {
    return (
      order?.user?.name ||
      order?.customer?.name ||
      order?.shippingAddress?.name ||
      "Customer"
    );
  };

  // ============================================================
  // CUSTOMER EMAIL
  // ============================================================

  const getCustomerEmail = (
    order
  ) => {
    return (
      order?.user?.email ||
      order?.customer?.email ||
      order?.shippingAddress?.email ||
      "-"
    );
  };

  // ============================================================
  // ITEMS COUNT
  // ============================================================

  const getItemsCount = (
    order
  ) => {
    if (
      !Array.isArray(
        order?.items
      )
    ) {
      return 0;
    }

    return order.items.reduce(
      (total, item) =>
        total +
        (Number(
          item?.quantity
        ) || 0),
      0
    );
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "Pending":
        return "status-pending";

      case "Confirmed":
        return "status-confirmed";

      case "Processing":
        return "status-processing";

      case "Shipped":
        return "status-shipped";

      case "Delivered":
        return "status-delivered";

      case "Cancelled":
        return "status-cancelled";

      default:
        return "status-default";
    }
  };

  // ============================================================
  // STATISTICS - ALWAYS FROM SERVER ANALYTICS
  // ============================================================

  const totalOrders = Number(analytics?.totalOrders || 0);

  const pendingOrders =
    Number(
      analytics?.ordersByStatus?.find(
        (item) => item?.status === "Pending"
      )?.count || 0
    );

  const processingOrders =
    Number(
      analytics?.ordersByStatus?.find(
        (item) => item?.status === "Processing"
      )?.count || 0
    );

  const deliveredOrders = Number(
    analytics?.deliveredOrders || 0
  );

  const cancelledOrders =
    Number(
      analytics?.ordersByStatus?.find(
        (item) => item?.status === "Cancelled"
      )?.count || 0
    );

  const orderRevenue = Number(
    analytics?.revenue || 0
  );

  const averageOrderValue = Number(
    analytics?.averageOrderValue || 0
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <>
        <style jsx>{styles}</style>

        <main className="orders-page">
          <div className="loading-container">
            <div className="spinner"></div>

            <p>
              Loading orders...
            </p>
          </div>
        </main>
      </>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <style jsx>{styles}</style>

      <main className="orders-page">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <section className="page-header">

          <div>
            <h1>
              Orders
            </h1>

            <p>
              Manage customer orders
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </section>

        {/* ================================================== */}
        {/* FILTERS */}
        {/* ================================================== */}

        <section className="orders-filters">
          <div className="filter-field search-field">
            <label>Search</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Order ID, customer, email, phone..."
            />
          </div>

          <div className="filter-field">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((previous) => ({ ...previous, page: 1 }));
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-field">
            <label>From</label>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPagination((previous) => ({ ...previous, page: 1 }));
              }}
            />
          </div>

          <div className="filter-field">
            <label>To</label>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPagination((previous) => ({ ...previous, page: 1 }));
              }}
            />
          </div>

          <button type="button" className="filter-button" onClick={applyFilters}>
            Search
          </button>

          <button type="button" className="clear-filter-button" onClick={clearFilters}>
            Clear
          </button>
        </section>

        <div className="results-bar">
          <span>
            {pagination.totalOrders || 0} matching order{pagination.totalOrders === 1 ? "" : "s"}
          </span>
          <span>
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="error-box">

            <strong>
              Error:
            </strong>{" "}

            {error}

            <button
              type="button"
              onClick={
                handleRefresh
              }
            >
              Try Again
            </button>

          </div>
        )}

        {/* ================================================== */}
        {/* STATISTICS */}
        {/* ================================================== */}

        <section className="statistics">

          <div className="stat-card">
            <span>
              Total Orders
            </span>

            <strong>
              {totalOrders}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Pending
            </span>

            <strong>
              {pendingOrders}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Processing
            </span>

            <strong>
              {processingOrders}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Delivered
            </span>

            <strong>
              {deliveredOrders}
            </strong>
          </div>

          <div className="stat-card"><span>Cancelled</span><strong>{cancelledOrders}</strong></div>
          <div className="stat-card"><span>Revenue</span><strong>₹{orderRevenue.toLocaleString("en-IN")}</strong></div>
          <div className="stat-card"><span>Avg. Order</span><strong>₹{averageOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></div>

        </section>

        {/* ================================================== */}
        {/* ORDERS TABLE */}
        {/* ================================================== */}

        <section className="table-container">

          {orders.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📦
              </div>

              <h2>
                No Orders Found
              </h2>

              <p>
                There are no customer
                orders yet.
              </p>

            </div>

          ) : (

            <div className="table-scroll">

              <table>

                <thead>

                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {orders.map(
                    (order) => {

                      const orderId =
                        getOrderId(
                          order
                        );

                      return (
                        <tr
                          key={
                            orderId
                          }
                        >

                          {/* ORDER ID */}

                          <td>
                            <span className="order-id">
                              #
                              {orderId
                                ? orderId.slice(-8)
                                : "N/A"}
                            </span>
                          </td>

                          {/* CUSTOMER */}

                          <td>
                            <strong className="customer-name">
                              {getCustomerName(
                                order
                              )}
                            </strong>
                          </td>

                          {/* EMAIL */}

                          <td>
                            <span className="email">
                              {getCustomerEmail(
                                order
                              )}
                            </span>
                          </td>

                          {/* ITEMS */}

                          <td>
                            <span className="items-count">
                              {getItemsCount(
                                order
                              )}
                            </span>
                          </td>

                          {/* TOTAL */}

                          <td>
                            <strong className="total-price">
                              {formatCurrency(
                                order?.totalPrice
                              )}
                            </strong>
                          </td>

                          {/* PAYMENT */}

                          <td>
                            <span className="payment-method">
                              {order?.paymentMethod ||
                                "COD"}
                            </span>
                          </td>

                          {/* DATE */}

                          <td>
                            <span className="date">
                              {formatDate(
                                order?.createdAt
                              )}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>

                            <select
                              value={
                                order?.status ||
                                "Pending"
                              }
                              disabled={
                                updatingId ===
                                orderId
                              }
                              className={`status-select ${getStatusClass(
                                order?.status
                              )}`}
                              onChange={(
                                event
                              ) =>
                                handleStatusChange(
                                  orderId,
                                  event.target.value
                                )
                              }
                            >

                              {getAvailableStatuses(
                                order?.status || "Pending"
                              ).map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>
                              ))}

                            </select>

                          </td>

                          {/* ACTION */}

                          <td>

                            <div className="action-buttons">

                              <button
                                type="button"
                                className="view-button"
                                onClick={() =>
                                  setSelectedOrder(
                                    order
                                  )
                                }
                              >
                                View
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                disabled={
                                  deletingId === orderId
                                }
                                onClick={() =>
                                  handleDeleteOrder(
                                    orderId
                                  )
                                }
                                title="Permanently delete this order"
                              >
                                {deletingId === orderId ? "Deleting..." : "Delete"}
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        <div className="pagination">
          <button
            type="button"
            disabled={!pagination.hasPreviousPage}
            onClick={() =>
              setPagination((previous) => ({
                ...previous,
                page: Math.max(1, previous.page - 1),
              }))
            }
          >
            ← Previous
          </button>

          <span>
            Page <strong>{pagination.page}</strong> of{" "}
            <strong>{pagination.totalPages || 1}</strong>
          </span>

          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() =>
              setPagination((previous) => ({
                ...previous,
                page: Math.min(
                  pagination.totalPages || previous.page,
                  previous.page + 1
                ),
              }))
            }
          >
            Next ←’
          </button>
        </div>

      </main>

      {/* ==================================================== */}
      {/* ORDER VIEW MODAL */}
      {/* ==================================================== */}

      {selectedOrder && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  Order Details
                </h2>

                <p>
                  Order #
                  {getOrderId(
                    selectedOrder
                  )}
                </p>

              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                ×
              </button>

            </div>

            {/* CUSTOMER */}

            <div className="detail-section">

              <h3>
                Customer
              </h3>

              <div className="detail-grid">

                <div>
                  <label>
                    Name
                  </label>

                  <p>
                    {getCustomerName(
                      selectedOrder
                    )}
                  </p>
                </div>

                <div>
                  <label>
                    Email
                  </label>

                  <p>
                    {getCustomerEmail(
                      selectedOrder
                    )}
                  </p>
                </div>

              </div>

            </div>

            {/* SHIPPING */}

            <div className="detail-section">

              <h3>
                Shipping Address
              </h3>

              <div className="address-box">

                <p>
                  {selectedOrder
                    ?.shippingAddress
                    ?.name || ""}
                </p>

                <p>
                  {selectedOrder
                    ?.shippingAddress
                    ?.address ||
                    selectedOrder
                      ?.shippingAddress
                      ?.street ||
                    ""}
                </p>

                <p>
                  {selectedOrder
                    ?.shippingAddress
                    ?.city || ""}

                  {selectedOrder
                    ?.shippingAddress
                    ?.state
                    ? `, ${selectedOrder.shippingAddress.state}`
                    : ""}
                </p>

                <p>
                  {selectedOrder
                    ?.shippingAddress
                    ?.postalCode || ""}
                </p>

                <p>
                  {selectedOrder
                    ?.shippingAddress
                    ?.phone || ""}
                </p>

              </div>

            </div>

            {/* ITEMS */}

            <div className="detail-section">

              <h3>
                Ordered Items
              </h3>

              <div className="modal-items">

                {Array.isArray(
                  selectedOrder?.items
                ) &&
                  selectedOrder.items.map(
                    (
                      item,
                      index
                    ) => {

                      const product =
                        item?.product;

                      return (

                        <div
                          className="modal-item"
                          key={
                            item?._id ||
                            index
                          }
                        >

                          <div>

                            <strong>
                              {product?.name ||
                                item?.name ||
                                "Product"}
                            </strong>

                            <span>
                              Qty:{" "}
                              {item?.quantity ||
                                0}
                            </span>

                          </div>

                          <strong>
                            {formatCurrency(
                              (Number(
                                item?.price
                              ) || 0) *
                                (Number(
                                  item?.quantity
                                ) || 0)
                            )}
                          </strong>

                        </div>

                      );
                    }
                  )}

              </div>

            </div>

            {/* ORDER SUMMARY */}

            <div className="summary-section">

              <div>

                <span>
                  Payment
                </span>

                <strong>
                  {selectedOrder
                    ?.paymentMethod ||
                    "COD"}
                </strong>

              </div>

              <div>

                <span>
                  Status
                </span>

                <strong
                  className={`summary-status ${getStatusClass(
                    selectedOrder?.status
                  )}`}
                >
                  {selectedOrder?.status ||
                    "Pending"}
                </strong>

              </div>

              <div className="grand-total">

                <span>
                  Total
                </span>

                <strong>
                  {formatCurrency(
                    selectedOrder?.totalPrice
                  )}
                </strong>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="modal-actions">

              <button
                type="button"
                className="modal-delete-button"
                disabled={
                  deletingId === getOrderId(selectedOrder)
                }
                onClick={() =>
                  handleDeleteOrder(
                    getOrderId(
                      selectedOrder
                    )
                  )
                }
                title="Permanently delete this order"
              >
                {deletingId === getOrderId(selectedOrder)
                  ? "Deleting..."
                  : "Delete Order"}
              </button>

              <button
                type="button"
                className="modal-close-button"
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

// ============================================================
// DARK GRADIENT STYLES
// ============================================================

const styles = `

  * {
    box-sizing: border-box;
  }

  .orders-filters {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) 180px 160px 160px auto auto;
    gap: 12px;
    margin-bottom: 14px;
    padding: 16px;
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 16px;
    background: rgba(255,255,255,0.055);
    backdrop-filter: blur(14px);
  }

  .filter-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-field label {
    color: #aeb7ca;
    font-size: 12px;
    font-weight: 700;
  }

  .filter-field input,
  .filter-field select {
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 10px;
    outline: none;
    background: rgba(255,255,255,0.07);
    color: #fff;
  }

  .filter-field select option {
    background: #101635;
    color: #fff;
  }

  .filter-button,
  .clear-filter-button {
    align-self: end;
    min-height: 44px;
    padding: 10px 18px;
    border-radius: 10px;
    font-weight: 800;
    cursor: pointer;
  }

  .filter-button {
    border: 0;
    background: linear-gradient(135deg,#7c3aed,#06b6d4);
    color: #fff;
  }

  .clear-filter-button {
    border: 1px solid rgba(255,255,255,0.13);
    background: rgba(255,255,255,0.06);
    color: #fff;
  }

  .results-bar {
    display: flex;
    justify-content: space-between;
    margin: 0 2px 14px;
    color: #aeb7ca;
    font-size: 13px;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 18px;
    margin-top: 24px;
  }

  .pagination button {
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 10px;
    padding: 11px 16px;
    background: rgba(255,255,255,0.06);
    color: #fff;
    font-weight: 800;
    cursor: pointer;
  }

  .pagination button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pagination span {
    color: #b7bfd2;
    font-size: 13px;
  }

  /* ========================================================
     MAIN PAGE
     ======================================================== */

  .orders-page {
    min-height: calc(100vh - 100px);

    padding: 55px 42px 90px;

    /*
      SAME STYLE AS YOUR SECOND IMAGE
      Dark navy + purple + teal
    */

    background:
      radial-gradient(
        circle at 10% 20%,
        rgba(91, 45, 150, 0.25),
        transparent 35%
      ),
      radial-gradient(
        circle at 90% 30%,
        rgba(0, 180, 220, 0.18),
        transparent 35%
      ),
      linear-gradient(
        110deg,
        #0c1026 0%,
        #17132f 48%,
        #0b3042 100%
      );

    color: #ffffff;
  }

  /* ========================================================
     HEADER
     ======================================================== */

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    margin-bottom: 38px;
  }

  .page-header h1 {
    margin: 0;

    color: #ffffff;

    font-size: 42px;
    line-height: 1.2;
    font-weight: 700;
  }

  .page-header p {
    margin: 10px 0 0;

    color: #b7bfd2;

    font-size: 18px;
  }

  .refresh-button {
    border: none;
    border-radius: 12px;

    padding: 15px 25px;

    background:
      linear-gradient(
        135deg,
        #1aa9df,
        #6c4de6
      );

    color: #ffffff;

    font-size: 16px;
    font-weight: 700;

    cursor: pointer;

    box-shadow:
      0 8px 25px
      rgba(38, 135, 220, 0.25);

    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .refresh-button:hover {
    transform: translateY(-2px);

    box-shadow:
      0 12px 30px
      rgba(38, 135, 220, 0.35);
  }

  .refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* ========================================================
     ERROR
     ======================================================== */

  .error-box {
    background: rgba(127, 29, 29, 0.35);

    border: 1px solid
      rgba(248, 113, 113, 0.35);

    color: #fecaca;

    padding: 16px 20px;

    border-radius: 12px;

    margin-bottom: 25px;
  }

  .error-box button {
    margin-left: 15px;

    border: none;
    border-radius: 7px;

    padding: 7px 13px;

    background: #dc2626;

    color: white;

    cursor: pointer;
  }

  /* ========================================================
     STATISTICS
     ======================================================== */

  .statistics {
    display: grid;

    grid-template-columns:
      repeat(4, minmax(0, 1fr));

    gap: 20px;

    margin-bottom: 34px;
  }

  .stat-card {
    min-height: 150px;

    padding: 30px;

    background:
      rgba(255, 255, 255, 0.075);

    border:
      1px solid
      rgba(255, 255, 255, 0.10);

    border-radius: 18px;

    box-shadow:
      0 15px 40px
      rgba(0, 0, 0, 0.20);

    backdrop-filter: blur(14px);

    transition:
      transform 0.2s ease,
      background 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-3px);

    background:
      rgba(255, 255, 255, 0.10);
  }

  .stat-card span {
    display: block;

    margin-bottom: 18px;

    color: #b8c0d1;

    font-size: 17px;
    font-weight: 500;
  }

  .stat-card strong {
    display: block;

    color: #ffffff;

    font-size: 38px;
    font-weight: 800;
  }

  /* ========================================================
     TABLE CONTAINER
     ======================================================== */

  .table-container {
    overflow: hidden;

    background:
      rgba(255, 255, 255, 0.065);

    border:
      1px solid
      rgba(255, 255, 255, 0.11);

    border-radius: 18px;

    box-shadow:
      0 20px 55px
      rgba(0, 0, 0, 0.25);

    backdrop-filter: blur(15px);
  }

  .table-scroll {
    width: 100%;

    overflow-x: auto;

    scrollbar-width: thin;
  }

  .table-scroll::-webkit-scrollbar {
    height: 9px;
  }

  .table-scroll::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.04);
  }

  .table-scroll::-webkit-scrollbar-thumb {
    border-radius: 10px;

    background:
      linear-gradient(
        90deg,
        #0bb8df,
        #7352e8
      );
  }

  table {
    width: 100%;

    min-width: 1250px;

    border-collapse: collapse;
  }

  thead {
    background:
      rgba(255, 255, 255, 0.055);
  }

  th {
    padding: 20px;

    border-bottom:
      1px solid
      rgba(255, 255, 255, 0.10);

    color: #d7dcea;

    text-align: left;

    font-size: 14px;
    font-weight: 700;

    white-space: nowrap;
  }

  td {
    padding: 20px;

    border-bottom:
      1px solid
      rgba(255, 255, 255, 0.075);

    color: #cbd2e1;

    font-size: 15px;

    vertical-align: middle;
  }

  tbody tr {
    transition:
      background 0.2s ease;
  }

  tbody tr:hover {
    background:
      rgba(255, 255, 255, 0.055);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  /* ========================================================
     TABLE TEXT
     ======================================================== */

  .order-id {
    color: #9faac0;

    font-family: monospace;

    font-size: 14px;
    font-weight: 700;
  }

  .customer-name {
    color: #ffffff;

    font-size: 15px;
  }

  .email {
    color: #aeb7ca;
  }

  .items-count {
    color: #d8deeb;

    font-weight: 600;
  }

  .total-price {
    color: #ffffff;

    font-weight: 700;
  }

  .payment-method {
    color: #b8c1d2;

    font-weight: 500;
  }

  .date {
    color: #aeb7ca;

    white-space: nowrap;
  }

  /* ========================================================
     STATUS
     ======================================================== */

  .status-select {
    min-width: 195px;

    padding: 12px 35px 12px 16px;

    border: none;

    border-radius: 11px;

    outline: none;

    font-size: 15px;
    font-weight: 700;

    cursor: pointer;
  }

  .status-select:disabled {
    opacity: 0.6;

    cursor: wait;
  }

  .status-pending {
    background: rgba(251, 146, 60, 0.16);
    color: #fdba74;
  }

  .status-confirmed {
    background: rgba(59, 130, 246, 0.16);
    color: #93c5fd;
  }

  .status-processing {
    background: rgba(139, 92, 246, 0.17);
    color: #c4b5fd;
  }

  .status-shipped {
    background: rgba(6, 182, 212, 0.16);
    color: #67e8f9;
  }

  .status-delivered {
    background: rgba(16, 185, 129, 0.16);
    color: #6ee7b7;
  }

  .status-cancelled {
    background: rgba(239, 68, 68, 0.16);
    color: #fca5a5;
  }

  .status-default {
    background: rgba(255,255,255,0.08);
    color: #d1d5db;
  }

  /* ========================================================
     ACTION BUTTONS
     ======================================================== */

  .action-buttons {
    display: flex;

    gap: 10px;

    align-items: center;
  }

  .view-button,
  .delete-button {
    border: none;

    border-radius: 10px;

    padding: 12px 17px;

    font-size: 15px;
    font-weight: 700;

    cursor: pointer;

    white-space: nowrap;

    transition:
      transform 0.2s ease,
      background 0.2s ease;
  }

  .view-button {
    background:
      rgba(59, 130, 246, 0.15);

    color: #93c5fd;
  }

  .view-button:hover {
    background:
      rgba(59, 130, 246, 0.25);

    transform: translateY(-1px);
  }

  .delete-button {
    background:
      rgba(239, 68, 68, 0.15);

    color: #fca5a5;
  }

  .delete-button:hover {
    background:
      rgba(239, 68, 68, 0.25);

    transform: translateY(-1px);
  }

  .delete-button:disabled {
    opacity: 0.5;

    cursor: not-allowed;

    transform: none;
  }

  /* ========================================================
     EMPTY STATE
     ======================================================== */

  .empty-state {
    padding: 90px 30px;

    text-align: center;
  }

  .empty-icon {
    margin-bottom: 15px;

    font-size: 55px;
  }

  .empty-state h2 {
    margin: 0;

    color: #ffffff;

    font-size: 25px;
  }

  .empty-state p {
    margin-top: 10px;

    color: #aeb7ca;
  }

  /* ========================================================
     LOADING
     ======================================================== */

  .loading-container {
    min-height: 500px;

    display: flex;

    flex-direction: column;

    justify-content: center;

    align-items: center;
  }

  .loading-container p {
    margin-top: 20px;

    color: #b7bfd2;

    font-size: 17px;
  }

  .spinner {
    width: 42px;
    height: 42px;

    border:
      4px solid
      rgba(255,255,255,0.15);

    border-top-color: #20b8e6;

    border-radius: 50%;

    animation:
      spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ========================================================
     MODAL OVERLAY
     ======================================================== */

  .modal-overlay {
    position: fixed;

    inset: 0;

    z-index: 9999;

    display: flex;

    justify-content: center;

    align-items: center;

    padding: 25px;

    background:
      rgba(2, 6, 23, 0.78);

    backdrop-filter: blur(8px);
  }

  /* ========================================================
     MODAL
     ======================================================== */

  .order-modal {
    width: 100%;

    max-width: 800px;

    max-height: 90vh;

    overflow-y: auto;

    padding: 30px;

    background:
      linear-gradient(
        145deg,
        #11152d,
        #17142f 50%,
        #0e2939
      );

    color: #ffffff;

    border:
      1px solid
      rgba(255,255,255,0.12);

    border-radius: 20px;

    box-shadow:
      0 30px 90px
      rgba(0, 0, 0, 0.55);
  }

  .modal-header {
    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    padding-bottom: 22px;

    border-bottom:
      1px solid
      rgba(255,255,255,0.10);
  }

  .modal-header h2 {
    margin: 0;

    color: #ffffff;

    font-size: 28px;
  }

  .modal-header p {
    margin: 7px 0 0;

    color: #aeb7ca;

    font-size: 14px;

    word-break: break-all;
  }

  .close-button {
    width: 40px;
    height: 40px;

    border: none;

    border-radius: 50%;

    background:
      rgba(255,255,255,0.08);

    color: #ffffff;

    font-size: 28px;

    line-height: 1;

    cursor: pointer;
  }

  .close-button:hover {
    background:
      rgba(255,255,255,0.15);
  }

  /* ========================================================
     DETAIL SECTIONS
     ======================================================== */

  .detail-section {
    padding: 25px 0;

    border-bottom:
      1px solid
      rgba(255,255,255,0.09);
  }

  .detail-section h3 {
    margin: 0 0 17px;

    color: #ffffff;

    font-size: 18px;
  }

  .detail-grid {
    display: grid;

    grid-template-columns:
      repeat(2, minmax(0, 1fr));

    gap: 20px;
  }

  .detail-grid label {
    display: block;

    margin-bottom: 5px;

    color: #8994aa;

    font-size: 13px;
  }

  .detail-grid p {
    margin: 0;

    color: #e0e5ef;

    font-weight: 600;
  }

  /* ========================================================
     ADDRESS
     ======================================================== */

  .address-box {
    padding: 17px;

    background:
      rgba(255,255,255,0.055);

    border:
      1px solid
      rgba(255,255,255,0.07);

    border-radius: 12px;
  }

  .address-box p {
    margin: 5px 0;

    color: #c7cfdd;
  }

  /* ========================================================
     MODAL ITEMS
     ======================================================== */

  .modal-items {
    display: flex;

    flex-direction: column;

    gap: 10px;
  }

  .modal-item {
    display: flex;

    justify-content: space-between;

    align-items: center;

    padding: 15px;

    background:
      rgba(255,255,255,0.055);

    border:
      1px solid
      rgba(255,255,255,0.06);

    border-radius: 12px;
  }

  .modal-item div {
    display: flex;

    flex-direction: column;

    gap: 5px;
  }

  .modal-item strong {
    color: #ffffff;
  }

  .modal-item span {
    color: #9da8bb;

    font-size: 14px;
  }

  /* ========================================================
     SUMMARY
     ======================================================== */

  .summary-section {
    padding: 25px 0;
  }

  .summary-section > div {
    display: flex;

    justify-content: space-between;

    align-items: center;

    margin-bottom: 13px;
  }

  .summary-section span {
    color: #9da8bb;
  }

  .summary-section strong {
    color: #ffffff;
  }

  .summary-status {
    padding: 7px 12px;

    border-radius: 8px;
  }

  .summary-section .grand-total {
    padding-top: 17px;

    margin-top: 17px;

    border-top:
      1px solid
      rgba(255,255,255,0.10);
  }

  .grand-total span,
  .grand-total strong {
    color: #ffffff;

    font-size: 21px;

    font-weight: 800;
  }

  /* ========================================================
     MODAL ACTIONS
     ======================================================== */

  .modal-actions {
    display: flex;

    justify-content: flex-end;

    gap: 12px;

    padding-top: 20px;

    border-top:
      1px solid
      rgba(255,255,255,0.10);
  }

  .modal-delete-button,
  .modal-close-button {
    border: none;

    border-radius: 10px;

    padding: 13px 20px;

    font-size: 15px;

    font-weight: 700;

    cursor: pointer;
  }

  .modal-delete-button {
    background: #dc2626;

    color: white;
  }

  .modal-delete-button:hover {
    background: #b91c1c;
  }

  .modal-delete-button:disabled {
    opacity: 0.6;

    cursor: not-allowed;
  }

  .modal-close-button {
    background:
      rgba(255,255,255,0.09);

    color: #e2e8f0;
  }

  .modal-close-button:hover {
    background:
      rgba(255,255,255,0.15);
  }

  /* ========================================================
     RESPONSIVE
     ======================================================== */

  @media (max-width: 1100px) {
    .orders-filters {
      grid-template-columns: 1fr 1fr;
    }

    .filter-button,
    .clear-filter-button {
      width: 100%;
    }
  }

  @media (max-width: 1000px) {

    .orders-page {
      padding:
        35px 20px 60px;
    }

    .statistics {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

  }

  @media (max-width: 600px) {

    .page-header {
      flex-direction: column;

      gap: 20px;
    }

    .page-header h1 {
      font-size: 32px;
    }

    .statistics {
      grid-template-columns: 1fr;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }

    .order-modal {
      padding: 20px;
    }

    .modal-actions {
      flex-direction: column;
    }

    .modal-delete-button,
    .modal-close-button {
      width: 100%;
    }

  }

`;
