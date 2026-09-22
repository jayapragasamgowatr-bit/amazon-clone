import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ProtectedRoute from "../components/ProtectedRoute";
import { getMyOrders } from "../lib/api";

const STATUS_STEPS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // ============================================================
  // LOAD ORDERS - SERVER-SIDE PAGINATION / SEARCH / STATUS
  // ============================================================

  const loadOrders = async () => {
    try {
      setLoading(true);

      const data = await getMyOrders({
        page,
        limit: 10,
        search,
        status: status === "All" ? "" : status,
      });

      setOrders(Array.isArray(data?.orders) ? data.orders : []);

      setPagination(
        data?.pagination || {
          page,
          limit: 10,
          totalOrders: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (error) {
      console.error("LOAD ORDERS ERROR:", error);

      toast.error(error?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // LOAD WHEN PAGE / FILTER CHANGES
  // ============================================================

  useEffect(() => {
    loadOrders();
  }, [page, search, status]);

  // ============================================================
  // FILTERS
  // ============================================================

  const applyFilters = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("All");
    setPage(1);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      applyFilters();
    }
  };

  // ============================================================
  // STATUS INDEX
  // ============================================================

  const statusIndex = (status) => {
    return STATUS_STEPS.indexOf(status);
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("en-IN");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <ProtectedRoute>
      <main className="orders-page">
        <section className="orders-shell">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="orders-header">
            <div>
              <span className="eyebrow">
                WAVENTRA VETRIC
              </span>

              <h1>My Orders</h1>

              <p>
                View and track every order from one place.
              </p>
            </div>

            <button
              type="button"
              className="refresh-button"
              disabled={refreshing}
              onClick={handleRefresh}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* ==================================================
              SEARCH
          ================================================== */}

          <div className="orders-filters">
            <input
              type="text"
              className="orders-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by order ID, name, email, city..."
            />

            <select
              className="orders-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
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

            <button type="button" className="filter-button" onClick={applyFilters}>
              Search
            </button>

            <button type="button" className="clear-filter-button" onClick={clearFilters}>
              Clear
            </button>
          </div>

          <div className="results-bar">
            <span>
              {pagination.totalOrders || 0} order{pagination.totalOrders === 1 ? "" : "s"}
            </span>
            {pagination.totalPages > 0 && (
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
            )}
          </div>

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading ? (
            <div className="empty-card">
              <div className="loading-spinner"></div>

              <h2>
                Loading orders...
              </h2>

              <p>
                Please wait while we fetch your orders.
              </p>
            </div>
          ) : orders.length === 0 ? (

            /* ==================================================
                EMPTY
            ================================================== */

            <div className="empty-card">
              <div className="empty-icon">
                📦
              </div>

              <h2>
                {search || status !== "All" ? "No matching orders" : "No Orders Yet"}
              </h2>

              <p>
                {search || status !== "All" ? "Try changing your search or filter." : "Your orders will appear here after you place your first order."}
              </p>

              {!orders.length && !search && status === "All" && (
                <Link
                  href="/products"
                  className="shop-button"
                >
                  Browse Products
                </Link>
              )}
            </div>
          ) : (

            /* ==================================================
                ORDERS
            ================================================== */

            <div className="orders-list">

              {orders.map((order) => {
                const current = statusIndex(
                  order?.status
                );

                const orderId = String(
                  order?._id || ""
                );

                return (
                  <article
                    className="order-card"
                    key={orderId}
                  >

                    {/* ========================================
                        ORDER HEADER
                    ======================================== */}

                    <div className="order-card-top">

                      <div>
                        <span className="order-label">
                          ORDER
                        </span>

                        <h2>
                          #
                          {orderId
                            .slice(-8)
                            .toUpperCase()}
                        </h2>
                      </div>

                      <span
                        className={`status-pill status-${String(
                          order?.status || "Pending"
                        ).toLowerCase()}`}
                      >
                        {order?.status || "Pending"}
                      </span>
                    </div>

                    {/* ========================================
                        ORDER ITEMS
                    ======================================== */}

                    <div className="order-items">

                      {(order?.items || []).map(
                        (item, index) => (
                          <div
                            className="order-item"
                            key={`${orderId}-${index}`}
                          >

                            <div className="item-info">

                              <strong>
                                {item?.name ||
                                  "Product"}
                              </strong>

                              <span>
                                Qty:{" "}
                                {Number(
                                  item?.quantity || 0
                                )}
                              </span>

                            </div>

                            <strong className="item-price">
                              ₹
                              {formatPrice(
                                item?.price
                              )}
                            </strong>

                          </div>
                        )
                      )}

                    </div>

                    {/* ========================================
                        ORDER STATUS PROGRESS
                    ======================================== */}

                    {order?.status !== "Cancelled" && (
                      <div className="progress">

                        {STATUS_STEPS.map(
                          (step, index) => {

                            const active =
                              current >= index;

                            return (
                              <div
                                className={`progress-step ${
                                  active
                                    ? "active"
                                    : ""
                                }`}
                                key={step}
                              >

                                <span>
                                  {index + 1}
                                </span>

                                <small>
                                  {step}
                                </small>

                              </div>
                            );
                          }
                        )}

                      </div>
                    )}

                    {/* ========================================
                        CANCELLED ORDER
                    ======================================== */}

                    {order?.status === "Cancelled" && (
                      <div className="cancelled-box">

                        <div className="cancelled-title">
                          Order Cancelled
                        </div>

                        {order?.cancellationReason && (
                          <p className="cancel-reason">
                            <strong>
                              Cancellation reason:
                            </strong>{" "}
                            {order.cancellationReason}
                          </p>
                        )}

                      </div>
                    )}

                    {/* ========================================
                        ORDER FOOTER
                    ======================================== */}

                    <div className="order-footer">

                      <div className="payment-total">

                        <span className="payment-method">
                          COD
                        </span>

                        <strong>
                          Total: ₹
                          {formatPrice(
                            order?.totalPrice
                          )}
                        </strong>

                      </div>

                      {/* ======================================
                          VIEW ORDER DETAILS BUTTON
                      ====================================== */}

                      <Link
                        href={`/orders/${orderId}`}
                        className="view-order-button"
                      >
                        View Details
                        <span className="arrow">
                          →
                        </span>
                      </Link>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

          {!loading && orders.length > 0 && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                ← Previous
              </button>
              <span>
                Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
              </span>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))}
              >
                Next →
              </button>
            </div>
          )}

        </section>

        {/* ====================================================
            STYLES
        ==================================================== */}

        <style jsx>{`

          /* ==================================================
             PAGE
          ================================================== */

          .orders-page {
            min-height: 100vh;
            padding: 48px 20px 80px;
            background:
              radial-gradient(
                circle at 10% 10%,
                rgba(124, 58, 237, 0.28),
                transparent 30%
              ),
              radial-gradient(
                circle at 90% 20%,
                rgba(6, 182, 212, 0.20),
                transparent 30%
              ),
              #06091f;
            color: #fff;
          }

          .orders-shell {
            max-width: 1100px;
            margin: 0 auto;
          }

          /* ==================================================
             HEADER
          ================================================== */

          .orders-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 20px;
            margin-bottom: 28px;
          }

          .eyebrow,
          .order-label {
            font-size: 11px;
            letter-spacing: 0.18em;
            opacity: 0.6;
          }

          h1 {
            margin: 6px 0;
            font-size: clamp(38px, 6vw, 64px);
            font-weight: 900;
            line-height: 1;
          }

          .orders-header p {
            margin: 0;
            opacity: 0.7;
            font-size: 16px;
          }

          /* ==================================================
             BUTTON
          ================================================== */

          .refresh-button,
          .shop-button {
            border: 0;
            border-radius: 12px;
            padding: 12px 18px;
            color: #fff;
            background:
              linear-gradient(
                135deg,
                #7c3aed,
                #06b6d4
              );
            font-weight: 800;
            cursor: pointer;
            text-decoration: none;
          }

          .refresh-button {
            min-width: 105px;
          }

          .refresh-button:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          /* ==================================================
             SEARCH
          ================================================== */

          .orders-search {
            width: 100%;
            box-sizing: border-box;
            padding: 16px 18px;
            border: 1px solid rgba(
              255,
              255,
              255,
              0.14
            );
            border-radius: 16px;
            background: rgba(
              255,
              255,
              255,
              0.07
            );
            color: #fff;
            outline: none;
            margin-bottom: 20px;
            font-size: 16px;
          }

          .orders-search::placeholder {
            color: rgba(
              255,
              255,
              255,
              0.55
            );
          }

          .orders-search:focus {
            border-color: rgba(
              124,
              58,
              237,
              0.7
            );

            box-shadow:
              0 0 0 3px rgba(
                124,
                58,
                237,
                0.12
              );
          }

          /* ==================================================
             CARDS
          ================================================== */

          .empty-card,
          .order-card {
            border: 1px solid rgba(
              255,
              255,
              255,
              0.10
            );

            background:
              rgba(
                16,
                22,
                53,
                0.72
              );

            backdrop-filter: blur(18px);

            border-radius: 24px;

            box-shadow:
              0 20px 70px
              rgba(0, 0, 0, 0.28);
          }

          .empty-card {
            text-align: center;
            padding: 80px 24px;
          }

          .empty-icon {
            font-size: 54px;
            margin-bottom: 10px;
          }

          .empty-card h2 {
            font-size: 30px;
            margin: 10px 0;
          }

          .empty-card p {
            opacity: 0.68;
            margin-bottom: 26px;
          }

          .orders-filters {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 190px auto auto;
            gap: 10px;
            margin-bottom: 12px;
          }

          .orders-status,
          .filter-button,
          .clear-filter-button {
            min-height: 50px;
            border-radius: 14px;
            font-size: 15px;
            font-weight: 700;
          }

          .orders-status {
            padding: 0 14px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(255,255,255,0.07);
            color: #fff;
            outline: none;
          }

          .orders-status option {
            background: #101635;
            color: #fff;
          }

          .filter-button {
            border: 0;
            padding: 0 20px;
            color: #fff;
            background: linear-gradient(135deg,#7c3aed,#06b6d4);
            cursor: pointer;
          }

          .clear-filter-button {
            border: 1px solid rgba(255,255,255,0.13);
            padding: 0 20px;
            color: #fff;
            background: rgba(255,255,255,0.06);
            cursor: pointer;
          }

          .results-bar {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 0 2px 18px;
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
            border-radius: 11px;
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

          /* ==================================================
             LOADING
          ================================================== */

          .loading-spinner {
            width: 38px;
            height: 38px;
            margin: 0 auto 20px;

            border-radius: 50%;

            border:
              3px solid
              rgba(255, 255, 255, 0.15);

            border-top-color: #06b6d4;

            animation:
              spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* ==================================================
             ORDER LIST
          ================================================== */

          .orders-list {
            display: grid;
            gap: 18px;
          }

          /* ==================================================
             ORDER CARD
          ================================================== */

          .order-card {
            padding: 22px;
            transition:
              transform 0.2s ease,
              border-color 0.2s ease;
          }

          .order-card:hover {
            transform: translateY(-2px);

            border-color:
              rgba(
                124,
                58,
                237,
                0.35
              );
          }

          /* ==================================================
             ORDER TOP
          ================================================== */

          .order-card-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
          }

          .order-card h2 {
            margin: 5px 0 0;
            font-size: 24px;
          }

          /* ==================================================
             STATUS
          ================================================== */

          .status-pill {
            padding: 8px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 800;
            background:
              rgba(
                255,
                255,
                255,
                0.10
              );
          }

          .status-pending {
            background:
              rgba(
                245,
                158,
                11,
                0.18
              );

            color: #fcd34d;
          }

          .status-confirmed {
            background:
              rgba(
                59,
                130,
                246,
                0.18
              );

            color: #93c5fd;
          }

          .status-processing {
            background:
              rgba(
                139,
                92,
                246,
                0.18
              );

            color: #c4b5fd;
          }

          .status-shipped {
            background:
              rgba(
                6,
                182,
                212,
                0.18
              );

            color: #67e8f9;
          }

          .status-delivered {
            background:
              rgba(
                34,
                197,
                94,
                0.20
              );

            color: #86efac;
          }

          .status-cancelled {
            background:
              rgba(
                239,
                68,
                68,
                0.20
              );

            color: #fca5a5;
          }

          /* ==================================================
             ITEMS
          ================================================== */

          .order-items {
            margin: 22px 0;

            border-top:
              1px solid
              rgba(
                255,
                255,
                255,
                0.08
              );

            border-bottom:
              1px solid
              rgba(
                255,
                255,
                255,
                0.08
              );
          }

          .order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            padding: 14px 0;
          }

          .item-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .item-info strong {
            font-size: 16px;
          }

          .order-item span {
            opacity: 0.65;
            font-size: 13px;
          }

          .item-price {
            white-space: nowrap;
          }

          /* ==================================================
             PROGRESS
          ================================================== */

          .progress {
            display: grid;
            grid-template-columns:
              repeat(5, 1fr);

            gap: 8px;
            margin: 24px 0;
          }

          .progress-step {
            text-align: center;
            opacity: 0.35;
            font-size: 12px;
          }

          .progress-step span {
            width: 28px;
            height: 28px;

            display: grid;
            place-items: center;

            margin:
              0 auto 7px;

            border-radius: 50%;

            background:
              rgba(
                255,
                255,
                255,
                0.10
              );

            font-weight: 800;
          }

          .progress-step.active {
            opacity: 1;
          }

          .progress-step.active span {
            background:
              linear-gradient(
                135deg,
                #7c3aed,
                #06b6d4
              );
          }

          .progress-step small {
            font-size: 11px;
          }

          /* ==================================================
             CANCELLED
          ================================================== */

          .cancelled-box {
            margin: 20px 0;

            padding: 14px 16px;

            border-radius: 14px;

            border:
              1px solid
              rgba(
                239,
                68,
                68,
                0.20
              );

            background:
              rgba(
                239,
                68,
                68,
                0.08
              );
          }

          .cancelled-title {
            font-weight: 800;
            color: #fca5a5;
            margin-bottom: 6px;
          }

          .cancel-reason {
            margin: 0;
            opacity: 0.7;
            font-size: 13px;
          }

          /* ==================================================
             FOOTER
          ================================================== */

          .order-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 18px;
            padding-top: 4px;
          }

          .payment-total {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .payment-method {
            font-size: 13px;
            opacity: 0.65;
          }

          .payment-total strong {
            font-size: 17px;
          }

          /* ==================================================
             VIEW DETAILS BUTTON
          ================================================== */

          .view-order-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;

            padding: 11px 18px;

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                #7c3aed,
                #06b6d4
              );

            color: #fff;

            text-decoration: none;

            font-weight: 800;
            font-size: 14px;

            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.12
              );

            transition:
              transform 0.2s ease,
              opacity 0.2s ease,
              box-shadow 0.2s ease;
          }

          .view-order-button:hover {
            transform: translateY(-2px);
            opacity: 0.95;

            box-shadow:
              0 8px 25px
              rgba(
                6,
                182,
                212,
                0.20
              );
          }

          .arrow {
            font-size: 18px;
            line-height: 1;
          }

          /* ==================================================
             MOBILE
          ================================================== */

          @media (max-width: 650px) {

            .orders-page {
              padding:
                25px 12px 50px;
            }

            .orders-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .orders-header h1 {
              font-size: 42px;
            }

            .refresh-button {
              width: 100%;
            }

            .order-card {
              padding: 16px;
            }

            .order-card-top {
              align-items: flex-start;
            }

            .order-card h2 {
              font-size: 20px;
            }

            .status-pill {
              font-size: 11px;
              padding: 7px 10px;
            }

            .order-item {
              align-items: flex-start;
            }

            .progress {
              gap: 3px;
            }

            .progress-step small {
              font-size: 9px;
            }

            .progress-step span {
              width: 25px;
              height: 25px;
              font-size: 11px;
            }

            .order-footer {
              flex-direction: column;
              align-items: stretch;
              font-size: 13px;
            }

            .view-order-button {
              width: 100%;
              box-sizing: border-box;
            }
          }

        `}</style>
      </main>
    </ProtectedRoute>
  );
}