import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";

import ProtectedRoute from "../../components/ProtectedRoute";
import { getAdminAnalytics, getAllOrders } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const STATUS_ORDER = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const STATUS_CLASS = {
  Pending: "pending",
  Confirmed: "confirmed",
  Processing: "processing",
  Shipped: "shipped",
  Delivered: "delivered",
  Cancelled: "cancelled",
};

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const shortId = (id) => {
  const value = String(id || "");
  return value ? `#${value.slice(-8).toUpperCase()}` : "—";
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.isAdmin !== true && user.role !== "admin") {
      toast.error("Admin access only");
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const loadDashboard = useCallback(async () => {
    if (!user) return;

    try {
      setError("");

      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - Number(range) + 1);

      const to = today.toISOString().slice(0, 10);
      const from = fromDate.toISOString().slice(0, 10);

      const [analyticsData, ordersData] = await Promise.all([
        getAdminAnalytics({ from, to }),
        getAllOrders({ page: 1, limit: 6 }),
      ]);

      setAnalytics(analyticsData || null);

      const orders =
        ordersData?.orders ||
        ordersData?.data?.orders ||
        [];

      setRecentOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err);
      setError(err?.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, range]);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user, loadDashboard]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
      toast.success("Dashboard refreshed.");
    } catch (err) {
      console.error("REFRESH DASHBOARD ERROR:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const summary = analytics?.summary || {};

  const statusCounts = useMemo(() => {
    const source = Array.isArray(analytics?.ordersByStatus)
      ? analytics.ordersByStatus
      : [];

    return STATUS_ORDER.map((status) => ({
      status,
      count: Number(
        source.find((item) => item?.status === status)?.count || 0
      ),
    }));
  }, [analytics]);

  const sales = useMemo(() => {
    const source = Array.isArray(analytics?.dailySales)
      ? analytics.dailySales
      : [];

    return source.slice(-14);
  }, [analytics]);

  const maxSales = Math.max(
    1,
    ...sales.map((item) => Number(item?.revenue || 0))
  );

  const topProducts = Array.isArray(analytics?.topProducts)
    ? analytics.topProducts.slice(0, 5)
    : [];

  const lowStockProducts = Array.isArray(analytics?.lowStockProducts)
    ? analytics.lowStockProducts.slice(0, 6)
    : [];

  const inventoryAlertCount = lowStockProducts.length;

  if (authLoading || loading) {
    return (
      <ProtectedRoute>
        <div className="dashboard-loading">
          <div className="loader" />
          <strong>Loading dashboard...</strong>
          <span>Preparing your business overview.</span>

          <div style={{ marginTop: "20px" }}><Link href="/admin/event-analytics" style={{ fontWeight: 800 }}>Open Event Analytics →</Link></div>

      <style jsx>{`
            .dashboard-loading {
              min-height: 75vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 10px;
              color: #dbeafe;
            }
            .dashboard-loading span {
              color: #8190a8;
              font-size: 13px;
            }
            .loader {
              width: 42px;
              height: 42px;
              border: 4px solid rgba(56, 189, 248, 0.15);
              border-top-color: #38bdf8;
              border-radius: 50%;
              animation: spin .8s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="dashboard-page">
        <div className="dashboard-shell">
          <header className="dashboard-header">
            <div>
              <div className="eyebrow">WAVENTRA VETRIC • ADMIN</div>
              <h1>Business Dashboard</h1>
              <p>
                Monitor sales, orders, customers and inventory from one place.
              </p>
            </div>

            <div className="header-actions">
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
                aria-label="Analytics date range"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 12 months</option>
              </select>

              <button
                type="button"
                className="refresh-button"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "spin" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </header>

          {error && (
            <div className="error-banner">
              <TriangleAlert size={18} />
              <span>{error}</span>
              <button type="button" onClick={handleRefresh}>
                Try again
              </button>
            </div>
          )}

          <section className="kpi-grid">
            <KpiCard
              title="Revenue"
              value={formatCurrency(summary.revenue)}
              subtitle={`${formatCurrency(summary.deliveredRevenue)} delivered`}
              icon={<CircleDollarSign size={21} />}
              accent="cyan"
            />
            <KpiCard
              title="Total Orders"
              value={Number(summary.totalOrders || 0).toLocaleString("en-IN")}
              subtitle={`${Number(summary.nonCancelledOrders || 0)} active orders`}
              icon={<ShoppingCart size={21} />}
              accent="purple"
            />
            <KpiCard
              title="Customers"
              value={Number(summary.totalUsers || 0).toLocaleString("en-IN")}
              subtitle="Registered users"
              icon={<Users size={21} />}
              accent="blue"
            />
            <KpiCard
              title="Average Order"
              value={formatCurrency(summary.averageOrderValue)}
              subtitle="Per non-cancelled order"
              icon={<TrendingUp size={21} />}
              accent="green"
            />
          </section>

          <section className="dashboard-grid main-grid">
            <div className="panel sales-panel">
              <PanelHeader
                title="Sales Performance"
                subtitle={`Revenue • last ${range === "365" ? "12 months" : `${range} days`}`}
                icon={<BarChart3 size={19} />}
              />

              {sales.length ? (
                <div className="sales-chart">
                  <div className="chart-y">
                    <span>{formatCurrency(maxSales)}</span>
                    <span>{formatCurrency(maxSales / 2)}</span>
                    <span>₹0</span>
                  </div>

                  <div className="chart-area">
                    <div className="grid-line one" />
                    <div className="grid-line two" />
                    <div className="grid-line three" />

                    <div className="bars">
                      {sales.map((item) => {
                        const revenue = Number(item?.revenue || 0);
                        const height = Math.max(
                          5,
                          Math.round((revenue / maxSales) * 100)
                        );

                        return (
                          <div className="bar-column" key={item.date}>
                            <div className="bar-value">
                              {revenue > 0 ? formatCurrency(revenue) : ""}
                            </div>
                            <div
                              className="bar"
                              style={{ height: `${height}%` }}
                              title={`${formatDate(item.date)} — ${formatCurrency(revenue)}`}
                            />
                            <span>
                              {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                                "en-IN",
                                { day: "2-digit", month: "short" }
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyMini
                  icon={<BarChart3 size={28} />}
                  text="No sales data for this period."
                />
              )}
            </div>

            <div className="panel status-panel">
              <PanelHeader
                title="Order Status"
                subtitle="Current order distribution"
                icon={<Clock3 size={19} />}
              />

              <div className="status-list">
                {statusCounts.map((item) => (
                  <div className="status-row" key={item.status}>
                    <div className="status-name">
                      <span className={`status-dot ${STATUS_CLASS[item.status]}`} />
                      <span>{item.status}</span>
                    </div>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>

              <Link href="/admin/orders" className="panel-link">
                Manage orders <ChevronRight size={15} />
              </Link>
            </div>
          </section>

          <section className="dashboard-grid lower-grid">
            <div className="panel">
              <PanelHeader
                title="Top Products"
                subtitle="Best sellers by quantity"
                icon={<Package size={19} />}
              />

              {topProducts.length ? (
                <div className="top-products">
                  {topProducts.map((product, index) => (
                    <div className="top-product" key={`${product?._id || "product"}-${index}`}>
                      <div className="rank">{index + 1}</div>
                      <div className="top-product-image">
                        {product?.image ? (
                          <img src={product.image} alt="" />
                        ) : (
                          <Package size={19} />
                        )}
                      </div>
                      <div className="top-product-info">
                        <strong>{product?.name || "Product"}</strong>
                        <span>
                          {Number(product?.quantitySold || 0)} units sold
                        </span>
                      </div>
                      <strong className="top-product-revenue">
                        {formatCurrency(product?.revenue)}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMini
                  icon={<Package size={28} />}
                  text="No product sales yet."
                />
              )}

              <Link href="/admin/products" className="panel-link">
                Manage products <ChevronRight size={15} />
              </Link>
            </div>

            <div className="panel alert-panel">
              <PanelHeader
                title="Inventory Alerts"
                subtitle={`${inventoryAlertCount} products need attention`}
                icon={<TriangleAlert size={19} />}
              />

              {lowStockProducts.length ? (
                <div className="alert-list">
                  {lowStockProducts.map((product, index) => {
                    const stock = Number(product?.countInStock || 0);
                    return (
                      <div className="alert-row" key={`${product?._id || "stock"}-${index}`}>
                        <div className="alert-icon">
                          {stock === 0 ? "!" : "!"}
                        </div>
                        <div className="alert-info">
                          <strong>{product?.name || "Product"}</strong>
                          <span>
                            {stock === 0
                              ? "Out of stock"
                              : `${stock} unit${stock === 1 ? "" : "s"} remaining`}
                          </span>
                        </div>
                        <span className={stock === 0 ? "stock-critical" : "stock-low"}>
                          {stock}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyMini
                  icon={<Boxes size={28} />}
                  text="Inventory is healthy."
                />
              )}

              <Link href="/admin/analytics" className="quick-link">
                <BarChart3 size={16} />
                Advanced Analytics
                <ChevronRight size={15} />
              </Link>
              <Link href="/admin/forecast" className="panel-link">Open demand forecast <ChevronRight size={15} /></Link>
                <Link href="/admin/inventory" className="panel-link">
                Open inventory <ChevronRight size={15} />
              </Link>
            </div>
          </section>

          <section className="panel recent-panel">
            <PanelHeader
              title="Recent Orders"
              subtitle="Latest customer activity"
              icon={<ShoppingCart size={19} />}
              action={
                <Link href="/admin/orders" className="header-link">
                  View all <ChevronRight size={15} />
                </Link>
              }
            />

            {recentOrders.length ? (
              <div className="recent-table-wrap">
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const status = order?.status || "Pending";
                      const customer =
                        order?.user?.name ||
                        order?.customer?.name ||
                        order?.shippingAddress?.name ||
                        "Customer";

                      return (
                        <tr key={order?._id || Math.random()}>
                          <td>
                            <Link
                              href={`/admin/orders`}
                              className="order-link"
                            >
                              {shortId(order?._id)}
                            </Link>
                          </td>
                          <td>
                            <div className="customer-cell">
                              <strong>{customer}</strong>
                              <span>
                                {order?.user?.email ||
                                  order?.customer?.email ||
                                  order?.shippingAddress?.email ||
                                  "—"}
                              </span>
                            </div>
                          </td>
                          <td className="money">
                            {formatCurrency(order?.totalPrice)}
                          </td>
                          <td>{order?.paymentMethod || "COD"}</td>
                          <td>{formatDate(order?.createdAt)}</td>
                          <td>
                            <span className={`order-status ${STATUS_CLASS[status] || "pending"}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyMini
                icon={<ShoppingCart size={28} />}
                text="No orders found."
              />
            )}
          </section>

          <section className="quick-actions">
            <Link href="/admin/products" className="quick-action">
              <Package size={20} />
              <span>
                <strong>Products</strong>
                <small>{Number(summary.totalProducts || 0)} total products</small>
              </span>
              <ChevronRight size={17} />
            </Link>

            <Link href="/admin/inventory" className="quick-action">
              <Boxes size={20} />
              <span>
                <strong>Inventory</strong>
                <small>Review stock and audit history</small>
              </span>
              <ChevronRight size={17} />
            </Link>

            <Link href="/admin/orders" className="quick-action">
              <ShoppingCart size={20} />
              <span>
                <strong>Orders</strong>
                <small>{Number(summary.totalOrders || 0)} total orders</small>
              </span>
              <ChevronRight size={17} />
            </Link>

            <Link href="/admin/users" className="quick-action">
              <Users size={20} />
              <span>
                <strong>Customers</strong>
                <small>{Number(summary.totalUsers || 0)} registered users</small>
              </span>
              <ChevronRight size={17} />
            </Link>
          </section>
        </div>

        <style jsx>{`
          .dashboard-page {
            min-height: 100vh;
            padding: 34px 28px 80px;
            color: #f8fafc;
            background:
              radial-gradient(circle at 8% 5%, rgba(124,58,237,.20), transparent 28%),
              radial-gradient(circle at 92% 12%, rgba(6,182,212,.15), transparent 30%),
              linear-gradient(135deg, #090f22 0%, #151331 48%, #092b3b 100%);
          }

          .dashboard-shell {
            max-width: 1540px;
            margin: 0 auto;
          }

          .dashboard-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 25px;
            margin-bottom: 24px;
          }

          .eyebrow {
            margin-bottom: 8px;
            color: #67e8f9;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 1.8px;
          }

          h1 {
            margin: 0;
            font-size: clamp(34px, 4vw, 50px);
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -1.4px;
          }

          .dashboard-header p {
            margin: 9px 0 0;
            color: #aeb9cd;
            font-size: 15px;
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 9px;
            flex-shrink: 0;
          }

          .header-actions select,
          .refresh-button {
            min-height: 42px;
            border-radius: 10px;
            font: inherit;
            font-size: 12px;
            font-weight: 800;
          }

          .header-actions select {
            min-width: 145px;
            padding: 0 12px;
            border: 1px solid rgba(148,163,184,.18);
            outline: none;
            background: rgba(255,255,255,.055);
            color: #e5edf8;
          }

          .header-actions select option {
            background: #10172c;
            color: #fff;
          }

          .refresh-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 15px;
            border: 1px solid rgba(56,189,248,.20);
            background: linear-gradient(135deg, rgba(14,165,233,.22), rgba(79,70,229,.22));
            color: #dffaff;
            cursor: pointer;
          }

          .refresh-button:disabled {
            opacity: .55;
            cursor: wait;
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          .error-banner {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 18px;
            padding: 13px 15px;
            border: 1px solid rgba(248,113,113,.25);
            border-radius: 12px;
            background: rgba(127,29,29,.25);
            color: #fecaca;
            font-size: 13px;
          }

          .error-banner button {
            margin-left: auto;
            padding: 7px 11px;
            border: 0;
            border-radius: 8px;
            background: #dc2626;
            color: white;
            font-weight: 800;
            cursor: pointer;
          }

          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0,1fr));
            gap: 13px;
            margin-bottom: 18px;
          }

          .kpi-card {
            position: relative;
            overflow: hidden;
            min-height: 146px;
            padding: 20px;
            border: 1px solid rgba(148,163,184,.14);
            border-radius: 18px;
            background: linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.035));
            box-shadow: 0 18px 45px rgba(0,0,0,.17);
            backdrop-filter: blur(14px);
          }

          .kpi-card::after {
            content: "";
            position: absolute;
            right: -35px;
            bottom: -45px;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: rgba(56,189,248,.06);
          }

          .kpi-icon {
            width: 39px;
            height: 39px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 11px;
          }

          .kpi-icon.cyan { background: rgba(34,211,238,.11); color: #67e8f9; }
          .kpi-icon.purple { background: rgba(139,92,246,.12); color: #c4b5fd; }
          .kpi-icon.blue { background: rgba(59,130,246,.11); color: #93c5fd; }
          .kpi-icon.green { background: rgba(34,197,94,.11); color: #86efac; }

          .kpi-title {
            display: block;
            margin-top: 13px;
            color: #91a0b7;
            font-size: 11px;
            font-weight: 800;
          }

          .kpi-value {
            display: block;
            margin-top: 4px;
            color: #fff;
            font-size: 29px;
            line-height: 1;
            font-weight: 900;
          }

          .kpi-subtitle {
            display: block;
            margin-top: 8px;
            color: #697992;
            font-size: 10px;
          }

          .dashboard-grid {
            display: grid;
            gap: 13px;
            margin-bottom: 13px;
          }

          .main-grid {
            grid-template-columns: minmax(0, 1.75fr) minmax(310px, .75fr);
          }

          .lower-grid {
            grid-template-columns: repeat(2, minmax(0,1fr));
          }

          .panel {
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.14);
            border-radius: 19px;
            background: rgba(255,255,255,.052);
            box-shadow: 0 20px 55px rgba(0,0,0,.18);
            backdrop-filter: blur(15px);
          }

          .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 18px 20px;
            border-bottom: 1px solid rgba(148,163,184,.09);
          }

          .panel-title-wrap {
            display: flex;
            align-items: center;
            gap: 11px;
          }

          .panel-icon {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: rgba(14,165,233,.10);
            color: #67e8f9;
          }

          .panel-title {
            color: #f8fafc;
            font-size: 14px;
            font-weight: 900;
          }

          .panel-subtitle {
            margin-top: 3px;
            color: #697991;
            font-size: 10px;
          }

          .header-link,
          .panel-link {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #67e8f9;
            font-size: 11px;
            font-weight: 900;
            text-decoration: none;
          }

          .panel-link {
            width: fit-content;
            margin: 14px 20px 18px;
          }

          .sales-panel {
            min-height: 355px;
          }

          .sales-chart {
            display: flex;
            min-height: 275px;
            padding: 22px 20px 17px;
          }

          .chart-y {
            width: 74px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 3px 10px 25px 0;
            color: #66758e;
            font-size: 9px;
            text-align: right;
          }

          .chart-area {
            position: relative;
            flex: 1;
            min-width: 0;
            padding-bottom: 25px;
          }

          .grid-line {
            position: absolute;
            left: 0;
            right: 0;
            border-top: 1px dashed rgba(148,163,184,.10);
          }

          .grid-line.one { top: 0; }
          .grid-line.two { top: 50%; }
          .grid-line.three { bottom: 25px; }

          .bars {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            align-items: flex-end;
            gap: 7px;
          }

          .bar-column {
            min-width: 0;
            flex: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            gap: 5px;
          }

          .bar {
            width: min(28px, 75%);
            min-height: 4px;
            border-radius: 6px 6px 3px 3px;
            background: linear-gradient(180deg, #22d3ee, #6366f1);
            box-shadow: 0 5px 18px rgba(34,211,238,.12);
            transition: filter .18s ease, transform .18s ease;
          }

          .bar:hover {
            filter: brightness(1.18);
            transform: translateY(-2px);
          }

          .bar-column span {
            color: #66758e;
            font-size: 8px;
            white-space: nowrap;
          }

          .bar-value {
            min-height: 10px;
            color: #7dd3fc;
            font-size: 7px;
            white-space: nowrap;
          }

          .status-panel {
            min-height: 355px;
          }

          .status-list {
            padding: 13px 20px 4px;
          }

          .status-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 11px 0;
            border-bottom: 1px solid rgba(148,163,184,.07);
            color: #aab5c7;
            font-size: 12px;
          }

          .status-row:last-child {
            border-bottom: 0;
          }

          .status-name {
            display: flex;
            align-items: center;
            gap: 9px;
          }

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .status-dot.pending { background: #fb923c; }
          .status-dot.confirmed { background: #60a5fa; }
          .status-dot.processing { background: #a78bfa; }
          .status-dot.shipped { background: #22d3ee; }
          .status-dot.delivered { background: #34d399; }
          .status-dot.cancelled { background: #f87171; }

          .status-row strong {
            color: #fff;
            font-size: 13px;
          }

          .top-products {
            padding: 4px 20px;
          }

          .top-product {
            display: grid;
            grid-template-columns: 26px 42px minmax(0,1fr) auto;
            align-items: center;
            gap: 10px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(148,163,184,.07);
          }

          .top-product:last-child {
            border-bottom: 0;
          }

          .rank {
            color: #5f6f87;
            font-size: 11px;
            font-weight: 900;
            text-align: center;
          }

          .top-product-image {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.12);
            border-radius: 10px;
            background: rgba(255,255,255,.04);
            color: #67e8f9;
          }

          .top-product-image img {
            width: 100%;
            height: 100%;
            padding: 3px;
            object-fit: contain;
          }

          .top-product-info {
            min-width: 0;
          }

          .top-product-info strong {
            display: block;
            overflow: hidden;
            color: #edf2f8;
            font-size: 12px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .top-product-info span {
            display: block;
            margin-top: 3px;
            color: #697991;
            font-size: 9px;
          }

          .top-product-revenue {
            color: #bff7ff;
            font-size: 11px;
            white-space: nowrap;
          }

          .alert-list {
            padding: 4px 20px;
          }

          .alert-row {
            display: grid;
            grid-template-columns: 34px minmax(0,1fr) auto;
            align-items: center;
            gap: 10px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(148,163,184,.07);
          }

          .alert-row:last-child {
            border-bottom: 0;
          }

          .alert-icon {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9px;
            background: rgba(245,158,11,.10);
            color: #fbbf24;
            font-weight: 900;
          }

          .alert-info {
            min-width: 0;
          }

          .alert-info strong {
            display: block;
            overflow: hidden;
            color: #edf2f8;
            font-size: 12px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .alert-info span {
            display: block;
            margin-top: 3px;
            color: #697991;
            font-size: 9px;
          }

          .stock-critical,
          .stock-low {
            min-width: 30px;
            padding: 5px 7px;
            border-radius: 7px;
            text-align: center;
            font-size: 10px;
            font-weight: 900;
          }

          .stock-critical {
            background: rgba(239,68,68,.11);
            color: #f87171;
          }

          .stock-low {
            background: rgba(245,158,11,.11);
            color: #fbbf24;
          }

          .recent-panel {
            margin-top: 0;
          }

          .recent-table-wrap {
            overflow-x: auto;
          }

          .recent-table {
            width: 100%;
            min-width: 800px;
            border-collapse: collapse;
          }

          .recent-table th,
          .recent-table td {
            padding: 13px 18px;
            border-bottom: 1px solid rgba(148,163,184,.08);
            text-align: left;
            vertical-align: middle;
          }

          .recent-table th {
            background: rgba(255,255,255,.025);
            color: #72819a;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          .recent-table td {
            color: #b4c0d1;
            font-size: 11px;
          }

          .order-link {
            color: #67e8f9;
            font-weight: 900;
            text-decoration: none;
          }

          .customer-cell strong,
          .customer-cell span {
            display: block;
          }

          .customer-cell strong {
            color: #edf2f8;
            font-size: 11px;
          }

          .customer-cell span {
            margin-top: 3px;
            color: #65738b;
            font-size: 9px;
          }

          .money {
            color: #fff !important;
            font-weight: 900;
          }

          .order-status {
            display: inline-flex;
            padding: 6px 9px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 900;
          }

          .order-status.pending { background: rgba(251,146,60,.11); color: #fdba74; }
          .order-status.confirmed { background: rgba(96,165,250,.11); color: #93c5fd; }
          .order-status.processing { background: rgba(167,139,250,.11); color: #c4b5fd; }
          .order-status.shipped { background: rgba(34,211,238,.11); color: #67e8f9; }
          .order-status.delivered { background: rgba(52,211,153,.11); color: #6ee7b7; }
          .order-status.cancelled { background: rgba(248,113,113,.11); color: #fca5a5; }

          .quick-actions {
            display: grid;
            grid-template-columns: repeat(4, minmax(0,1fr));
            gap: 10px;
            margin-top: 13px;
          }

          .quick-action {
            display: grid;
            grid-template-columns: 38px minmax(0,1fr) 16px;
            align-items: center;
            gap: 10px;
            padding: 14px;
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 15px;
            background: rgba(255,255,255,.045);
            color: #67e8f9;
            text-decoration: none;
            transition: transform .18s ease, background .18s ease;
          }

          .quick-action:hover {
            transform: translateY(-2px);
            background: rgba(255,255,255,.065);
          }

          .quick-action > svg:first-child {
            width: 38px;
            height: 38px;
            padding: 9px;
            box-sizing: border-box;
            border-radius: 10px;
            background: rgba(14,165,233,.09);
          }

          .quick-action span {
            min-width: 0;
          }

          .quick-action strong,
          .quick-action small {
            display: block;
          }

          .quick-action strong {
            color: #eef5fc;
            font-size: 11px;
          }

          .quick-action small {
            margin-top: 3px;
            overflow: hidden;
            color: #65738b;
            font-size: 9px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .empty-mini {
            min-height: 170px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #71809a;
            font-size: 11px;
          }

          .empty-mini svg {
            color: #53627b;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 1150px) {
            .kpi-grid {
              grid-template-columns: repeat(2, minmax(0,1fr));
            }

            .main-grid {
              grid-template-columns: 1fr;
            }

            .quick-actions {
              grid-template-columns: repeat(2, minmax(0,1fr));
            }
          }

          @media (max-width: 800px) {
            .dashboard-page {
              padding: 24px 15px 60px;
            }

            .dashboard-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .header-actions {
              width: 100%;
            }

            .header-actions select,
            .refresh-button {
              flex: 1;
            }

            .lower-grid {
              grid-template-columns: 1fr;
            }

            .sales-chart {
              padding-left: 12px;
              padding-right: 12px;
            }
          }

          @media (max-width: 560px) {
            .kpi-grid,
            .quick-actions {
              grid-template-columns: 1fr;
            }

            .header-actions {
              flex-direction: column;
            }

            .header-actions select,
            .refresh-button {
              width: 100%;
            }

            .chart-y {
              width: 55px;
            }
          }
        `}</style>
      </main>
    </ProtectedRoute>
  );
}

function KpiCard({ title, value, subtitle, icon, accent }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${accent}`}>{icon}</div>
      <span className="kpi-title">{title}</span>
      <strong className="kpi-value">{value}</strong>
      <span className="kpi-subtitle">{subtitle}</span>

      <style jsx>{`
        .kpi-card {
          position: relative;
        }
        .kpi-icon {
          width: 39px;
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
        }
        .kpi-icon.cyan { background: rgba(34,211,238,.11); color: #67e8f9; }
        .kpi-icon.purple { background: rgba(139,92,246,.12); color: #c4b5fd; }
        .kpi-icon.blue { background: rgba(59,130,246,.11); color: #93c5fd; }
        .kpi-icon.green { background: rgba(34,197,94,.11); color: #86efac; }
        .kpi-title {
          display: block;
          margin-top: 13px;
          color: #91a0b7;
          font-size: 11px;
          font-weight: 800;
        }
        .kpi-value {
          display: block;
          margin-top: 4px;
          color: #fff;
          font-size: 29px;
          line-height: 1;
          font-weight: 900;
        }
        .kpi-subtitle {
          display: block;
          margin-top: 8px;
          color: #697992;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}

function PanelHeader({ title, subtitle, icon, action }) {
  return (
    <div className="panel-header">
      <div className="panel-title-wrap">
        <div className="panel-icon">{icon}</div>
        <div>
          <div className="panel-title">{title}</div>
          <div className="panel-subtitle">{subtitle}</div>
        </div>
      </div>
      {action || null}

      <style jsx>{`
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(148,163,184,.09);
        }
        .panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 11px;
        }
        .panel-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: rgba(14,165,233,.10);
          color: #67e8f9;
        }
        .panel-title {
          color: #f8fafc;
          font-size: 14px;
          font-weight: 900;
        }
        .panel-subtitle {
          margin-top: 3px;
          color: #697991;
          font-size: 10px;
        }
      `}</style>
    </div>
  );
}

function EmptyMini({ icon, text }) {
  return (
    <div className="empty-mini">
      {icon}
      <span>{text}</span>
      <style jsx>{`
        .empty-mini {
          min-height: 170px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #71809a;
          font-size: 11px;
        }
        .empty-mini :global(svg) {
          color: #53627b;
        }
      `}</style>
    </div>
  );
}
