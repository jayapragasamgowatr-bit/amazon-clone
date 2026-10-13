import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  BarChart3,
  Boxes,
  BrainCircuit,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";

import ProtectedRoute from "../../components/ProtectedRoute";
import {
  getAdminAnalytics,
  getAllOrders,
  getAiSearchIntelligence,
} from "../../lib/api";
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
  return value ? `#${value.slice(-8).toUpperCase()}` : "â€”";
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
  const [aiSearchData, setAiSearchData] = useState(null);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchError, setAiSearchError] = useState("");

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

      const [analyticsData, ordersData, aiData] =
        await Promise.all([
          getAdminAnalytics({ from, to }),
          getAllOrders({ page: 1, limit: 6 }),
          getAiSearchIntelligence(Number(range)).catch((aiError) => {
            console.error("AI SEARCH INTELLIGENCE ERROR:", aiError);
            setAiSearchError(
              aiError?.message || "Unable to load AI search intelligence"
            );
            return null;
          }),
        ]);

      setAiSearchData(aiData || null);

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

  const aiSummary = aiSearchData?.summary || aiSearchData?.metrics || {};
  const aiTopQuestions = aiSearchData?.topQuestions || aiSearchData?.topQueries || [];
  const aiTrending = aiSearchData?.trendingSearches || aiSearchData?.trending || [];
  const aiIntents = aiSearchData?.intentCounts || aiSearchData?.intents || [];
  const aiUnanswered =
    aiSearchData?.unansweredDemand ||
    aiSearchData?.unanswered ||
    [];

  const classifyDemand = (label) => {
    const lower = String(label || "").toLowerCase().trim();

    const companyPatterns = [
      "who is waventra",
      "what is waventra",
      "what does waventra do",
      "about waventra",
      "about the company",
      "company profile",
      "company information",
      "who are you",
      "tell me about waventra",
    ];

    const budgetPatterns = [
      "under â‚¹",
      "under rs",
      "under inr",
      "budget",
      "price",
      "cost",
      "cheap",
      "affordable",
      "lowest price",
      "maximum price",
      "below â‚¹",
      "below rs",
    ];

    const connectivityPatterns = [
      "rs485",
      "modbus",
      "wifi",
      "wi-fi",
      "gsm",
      "4g",
      "lorawan",
      "lorawan",
      "api",
      "mqtt",
      "communication",
      "connect",
      "connectivity",
    ];

    const specificationPatterns = [
      "dn20",
      "dn25",
      "dn32",
      "dn40",
      "dn50",
      "dn65",
      "dn80",
      "dn100",
      "3 inch",
      "3-inch",
      "4 inch",
      "4-inch",
      "diameter",
      "size",
      "voltage",
      "dc power",
      "power supply",
      "range",
      "accuracy",
      "pressure rating",
      "specification",
      "specifications",
    ];

    const productPatterns = [
      "flow meter",
      "flowmeter",
      "water meter",
      "ultrasonic",
      "electromagnetic",
      "emfm",
      "level sensor",
      "level monitoring",
      "pressure sensor",
      "hydrostatic",
      "radar sensor",
      "gateway",
      "iot",
      "transmission unit",
      "controller",
      "sensor",
      "analyzer",
      "ocems",
    ];

    const applicationPatterns = [
      "tank",
      "tank level",
      "water pipeline",
      "pipeline",
      "water consumption",
      "domestic water",
      "industrial water",
      "apartment",
      "residential",
      "building",
      "campus",
      "factory",
      "plant",
      "automation",
      "monitoring",
    ];

    const technicalPatterns = [
      "how does",
      "how to",
      "work with",
      "works with",
      "compatible",
      "compatibility",
      "accuracy",
      "installation",
      "calibration",
      "maintenance",
      "technical",
      "working principle",
      "principle",
      "data transfer",
      "data transmission",
    ];

    if (companyPatterns.some((p) => lower.includes(p))) {
      return "company";
    }

    if (budgetPatterns.some((p) => lower.includes(p))) {
      return "budget";
    }

    if (connectivityPatterns.some((p) => lower.includes(p))) {
      return "connectivity";
    }

    if (specificationPatterns.some((p) => lower.includes(p))) {
      return "specification";
    }

    if (
      productPatterns.some((p) => lower.includes(p)) &&
      applicationPatterns.some((p) => lower.includes(p))
    ) {
      return "product_application";
    }

    if (productPatterns.some((p) => lower.includes(p))) {
      return "product";
    }

    if (applicationPatterns.some((p) => lower.includes(p))) {
      return "application";
    }

    if (technicalPatterns.some((p) => lower.includes(p))) {
      return "technical";
    }

    return "general";
  };

  const catalogueDemandRows = [
    ...aiUnanswered,
    ...aiTrending,
    ...aiTopQuestions,
  ]
    .map((item, index) => {
      const label =
        typeof item === "string"
          ? item
          : item?.query ||
            item?.question ||
            item?.name ||
            item?.label ||
            "";

      const text = String(label).trim();

      if (!text) return null;

      const intent = classifyDemand(text);

      const specifications = [];
      const applications = [];
      const productSignals = [];

      const lower = text.toLowerCase();

      const specPatterns = [
        ["dn100", "DN100 / 4-inch"],
        ["4 inch", "4-inch"],
        ["4-inch", "4-inch"],
        ["3 inch", "3-inch"],
        ["3-inch", "3-inch"],
        ["dn80", "DN80"],
        ["dn65", "DN65"],
        ["dn50", "DN50"],
        ["dn40", "DN40"],
        ["dn32", "DN32"],
        ["dn25", "DN25"],
        ["dn20", "DN20"],
        ["ultrasonic", "Ultrasonic"],
        ["electromagnetic", "Electromagnetic"],
        ["emfm", "EMFM"],
        ["wifi", "Wi-Fi"],
        ["gsm", "GSM"],
        ["4g", "4G"],
        ["lorawan", "LoRaWAN"],
        ["modbus", "Modbus"],
        ["rs485", "RS485"],
      ];

      specPatterns.forEach(([needle, value]) => {
        if (lower.includes(needle) && !specifications.includes(value)) {
          specifications.push(value);
        }
      });

      const applicationPatterns = [
        ["water pipeline", "Water pipeline"],
        ["pipeline", "Pipeline monitoring"],
        ["domestic", "Domestic water"],
        ["industrial", "Industrial water"],
        ["tank", "Tank monitoring"],
        ["flow meter", "Flow measurement"],
        ["flowmeter", "Flow measurement"],
        ["water consumption", "Water consumption"],
        ["building", "Building / campus"],
        ["apartment", "Apartment / residential"],
        ["factory", "Industrial / factory"],
        ["automation", "Automation"],
      ];

      applicationPatterns.forEach(([needle, value]) => {
        if (lower.includes(needle) && !applications.includes(value)) {
          applications.push(value);
        }
      });

      const productKeywords = [
        "flow meter",
        "flowmeter",
        "ultrasonic",
        "electromagnetic",
        "emfm",
        "water meter",
        "level sensor",
        "level monitoring",
        "pressure sensor",
        "gateway",
        "transmission unit",
        "iot",
        "controller",
        "sensor",
        "analyzer",
      ];

      productKeywords.forEach((keyword) => {
        if (lower.includes(keyword) && !productSignals.includes(keyword)) {
          productSignals.push(keyword);
        }
      });

      const count = Number(
        item?.count ??
          item?.searches ??
          item?.frequency ??
          item?.total ??
          1
      );

      const growth = Number(
        item?.growth ??
          item?.growthRate ??
          0
      );

      const isCatalogueDemand = [
        "product",
        "product_application",
        "application",
        "specification",
        "connectivity",
        "budget",
      ].includes(intent);

      const isTechnical = intent === "technical";

      return {
        label: text,
        intent,
        count: Number.isFinite(count) ? count : 1,
        growth: Number.isFinite(growth) ? growth : 0,
        specifications,
        applications,
        productSignals,
        isCatalogueDemand,
        isTechnical,
        unanswered: aiUnanswered.some((u) => {
          const uLabel =
            typeof u === "string"
              ? u
              : u?.query ||
                u?.question ||
                u?.name ||
                u?.label ||
                "";

          return String(uLabel).trim().toLowerCase() === lower;
        }),
        rank: index + 1,
      };
    })
    .filter(Boolean);

  const catalogueOnlyRows = catalogueDemandRows.filter(
    (row) => row.isCatalogueDemand
  );

  const intentCounts = catalogueDemandRows.reduce((acc, row) => {
    acc[row.intent] = (acc[row.intent] || 0) + row.count;
    return acc;
  }, {});

  const catalogueGapMap = new Map();

  catalogueOnlyRows.forEach((row) => {
    const key =
      row.productSignals[0] ||
      row.specifications[0] ||
      row.applications[0] ||
      row.label;

    const existing = catalogueGapMap.get(key);

    if (!existing) {
      catalogueGapMap.set(key, {
        key,
        label:
          row.productSignals[0]
            ? row.productSignals[0].replace(/\b\w/g, (m) => m.toUpperCase())
            : row.specifications[0] ||
              row.applications[0] ||
              row.label,
        demand: row.count,
        growth: row.growth,
        unanswered: row.unanswered ? 1 : 0,
        intent: row.intent,
        examples: [row.label],
      });
    } else {
      existing.demand += row.count;
      existing.growth = Math.max(existing.growth, row.growth);
      existing.unanswered += row.unanswered ? 1 : 0;

      if (
        existing.examples.length < 3 &&
        !existing.examples.includes(row.label)
      ) {
        existing.examples.push(row.label);
      }
    }
  });

  const catalogueGaps = Array.from(catalogueGapMap.values())
    .sort(
      (a, b) =>
        (b.unanswered - a.unanswered) ||
        (b.demand - a.demand) ||
        (b.growth - a.growth)
    )
    .slice(0, 6);

  const demandRecommendations = [];

  catalogueGaps.slice(0, 4).forEach((gap) => {
    if (gap.unanswered > 0) {
      demandRecommendations.push(
        `Review catalogue coverage for ${gap.label}. Customers are searching for it and at least one related query is currently unanswered.`
      );
    } else if (gap.demand >= 3 && gap.growth > 20) {
      demandRecommendations.push(
        `Consider improving product visibility and specifications for ${gap.label}; this has enough demand volume to be treated as a growing signal.`
      );
    } else {
      demandRecommendations.push(
        `Monitor ${gap.label} as a recurring customer demand signal and ensure relevant products have complete specifications.`
      );
    }
  });

  const demandSignalCount = catalogueOnlyRows.length;
  const unansweredSignalCount = catalogueOnlyRows.filter(
    (row) => row.unanswered
  ).length;

  const emergingSignalCount = catalogueOnlyRows.filter(
    (row) => row.count < 3
  ).length;

  const excludedNonCatalogueCount = catalogueDemandRows.filter(
    (row) => !row.isCatalogueDemand
  ).length;

  const intentLabels = {
    product: "Product",
    product_application: "Product + Application",
    application: "Application",
    specification: "Specification",
    connectivity: "Connectivity",
    budget: "Budget",
    technical: "Technical",
    company: "Company / General",
    general: "General",
  };

  const aiDemandIntentRows = Object.entries(intentCounts)
    .map(([intent, count]) => ({
      intent,
      label: intentLabels[intent] || intent,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  

  if (authLoading || loading) {
    return (
      <ProtectedRoute>
        <div className="dashboard-loading">
          <div className="loader" />
          <strong>Loading dashboard...</strong>
          <span>Preparing your business overview.</span>

          <div style={{ marginTop: "20px" }}><Link href="/admin/event-analytics" style={{ fontWeight: 800 }}>Open Event Analytics â†’</Link></div>
          <div style={{ marginTop: "10px" }}><Link href="/admin/ai-search-intelligence" style={{ fontWeight: 800 }}>Open AI Search Intelligence â†’</Link></div>

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
              <div className="eyebrow">WAVENTRA VETRIC â€¢ ADMIN</div>
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
                subtitle={`Revenue â€¢ last ${range === "365" ? "12 months" : `${range} days`}`}
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
                              title={`${formatDate(item.date)} â€” ${formatCurrency(revenue)}`}
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
                                  "â€”"}
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

          /* ============================================================
             AI SEARCH INTELLIGENCE - PREMIUM CARD UI
             ============================================================ */

          .ai-intelligence-panel {
            width: 100%;
            margin-top: 28px;
            overflow: hidden;
            border: 1px solid rgba(148, 163, 184, 0.12);
            border-radius: 20px;
            background:
              linear-gradient(135deg, rgba(10, 20, 40, 0.96), rgba(8, 15, 31, 0.94));
            box-shadow:
              0 24px 70px rgba(0, 0, 0, 0.24),
              inset 0 1px 0 rgba(255, 255, 255, 0.025);
          }

          .ai-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 22px 24px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.10);
            background: linear-gradient(
              90deg,
              rgba(34, 211, 238, 0.035),
              transparent 50%,
              rgba(99, 102, 241, 0.035)
            );
          }

          .ai-panel-title {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
          }

          .ai-brain-icon {
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 46px;
            border: 1px solid rgba(103, 232, 249, 0.14);
            border-radius: 13px;
            background: linear-gradient(
              135deg,
              rgba(34, 211, 238, 0.14),
              rgba(59, 130, 246, 0.08)
            );
            color: #67e8f9;
            box-shadow: 0 10px 28px rgba(34, 211, 238, 0.08);
          }

          .ai-panel-title h2 {
            margin: 0;
            color: #f8fafc;
            font-size: 18px;
            line-height: 1.2;
            font-weight: 900;
            letter-spacing: -0.02em;
          }

          .ai-panel-title p {
            margin: 6px 0 0;
            color: #7f8da5;
            font-size: 11px;
            line-height: 1.5;
          }

          .ai-refresh-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex: 0 0 auto;
            min-height: 40px;
            padding: 0 15px;
            border: 1px solid rgba(103, 232, 249, 0.18);
            border-radius: 10px;
            background: rgba(34, 211, 238, 0.07);
            color: #a5f3fc;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
            transition: 0.2s ease;
          }

          .ai-refresh-button:hover {
            border-color: rgba(103, 232, 249, 0.35);
            background: rgba(34, 211, 238, 0.12);
            transform: translateY(-1px);
          }

          .ai-refresh-button:disabled {
            opacity: 0.55;
            cursor: wait;
            transform: none;
          }

          .ai-error {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 16px 24px 0;
            padding: 11px 13px;
            border: 1px solid rgba(248, 113, 113, 0.18);
            border-radius: 10px;
            background: rgba(127, 29, 29, 0.13);
            color: #fca5a5;
            font-size: 10px;
          }

          .ai-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            padding: 20px 24px 0;
          }

          .ai-metric {
            position: relative;
            min-width: 0;
            min-height: 142px;
            padding: 17px;
            overflow: hidden;
            border: 1px solid rgba(148, 163, 184, 0.10);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.028);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.018);
            transition: 0.2s ease;
          }

          .ai-metric:hover {
            border-color: rgba(103, 232, 249, 0.14);
            background: rgba(255, 255, 255, 0.042);
            transform: translateY(-1px);
          }

          .ai-metric::after {
            content: "";
            position: absolute;
            right: -28px;
            bottom: -35px;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: rgba(34, 211, 238, 0.035);
            pointer-events: none;
          }

          .ai-metric-icon {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
          }

          .ai-metric-icon.cyan {
            background: rgba(34, 211, 238, 0.10);
            color: #67e8f9;
          }

          .ai-metric-icon.purple {
            background: rgba(139, 92, 246, 0.11);
            color: #c4b5fd;
          }

          .ai-metric-icon.green {
            background: rgba(34, 197, 94, 0.10);
            color: #86efac;
          }

          .ai-metric-icon.blue {
            background: rgba(59, 130, 246, 0.10);
            color: #93c5fd;
          }

          .ai-metric-title {
            display: block;
            margin-top: 12px;
            color: #94a3b8;
            font-size: 10px;
            line-height: 1.3;
            font-weight: 800;
          }

          .ai-metric-value {
            display: block;
            margin-top: 5px;
            color: #f8fafc;
            font-size: 26px;
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: -0.02em;
          }

          .ai-metric-subtitle {
            display: block;
            margin-top: 6px;
            color: #64748b;
            font-size: 9px;
            line-height: 1.4;
          }

          .ai-insight-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            padding: 14px 24px 24px;
          }

          .ai-insight-card {
            min-width: 0;
            overflow: hidden;
            border: 1px solid rgba(148, 163, 184, 0.09);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.022);
          }

          .ai-insight-header {
            display: flex;
            align-items: center;
            gap: 11px;
            min-height: 68px;
            padding: 13px 15px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.075);
            background: rgba(255, 255, 255, 0.012);
          }

          .ai-insight-icon {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 34px;
            border-radius: 9px;
            background: rgba(14, 165, 233, 0.08);
            color: #67e8f9;
          }

          .ai-insight-header h3 {
            margin: 0;
            color: #e2e8f0;
            font-size: 11px;
            line-height: 1.3;
            font-weight: 900;
          }

          .ai-insight-header p {
            margin: 4px 0 0;
            color: #64748b;
            font-size: 9px;
            line-height: 1.4;
          }

          .ai-list {
            padding: 4px 0;
          }

          .ai-list-row {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 58px;
            padding: 8px 14px;
            border-bottom: 1px solid rgba(148, 163, 184, 0.055);
            transition: background 0.18s ease;
          }

          .ai-list-row:last-child {
            border-bottom: 0;
          }

          .ai-list-row:hover {
            background: rgba(255, 255, 255, 0.025);
          }

          .ai-list-row.warning .ai-rank {
            color: #fca5a5;
            background: rgba(239, 68, 68, 0.08);
          }

          .ai-rank {
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 25px;
            border-radius: 7px;
            background: rgba(148, 163, 184, 0.07);
            color: #94a3b8;
            font-size: 9px;
            font-weight: 900;
          }

          .ai-query {
            min-width: 0;
            flex: 1;
          }

          .ai-query strong {
            display: block;
            overflow: hidden;
            color: #dbeafe;
            font-size: 10px;
            line-height: 1.4;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .ai-query small {
            display: block;
            margin-top: 3px;
            color: #64748b;
            font-size: 8px;
          }

          .ai-value {
            display: flex;
            align-items: center;
            gap: 6px;
            flex: 0 0 auto;
            color: #cbd5e1;
            font-size: 9px;
            font-weight: 800;
          }

          .ai-value small {
            color: #4ade80;
          }

          .ai-empty {
            min-height: 142px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 20px;
            color: #64748b;
            font-size: 10px;
            text-align: center;
          }

          .ai-empty svg {
            color: #475569;
          }

          .ai-spin {
            animation: ai-spin 0.8s linear infinite;
          }

          @keyframes ai-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1050px) {
            .ai-kpi-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          /* ============================================================
             CATALOGUE DEMAND + GAP ANALYSIS
             ============================================================ */

          .catalogue-demand-panel {
            margin-top: 18px;
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.10);
            border-radius: 18px;
            background:
              linear-gradient(
                135deg,
                rgba(8,20,38,.92),
                rgba(8,15,31,.88)
              );
            box-shadow: 0 18px 55px rgba(0,0,0,.18);
          }

          .catalogue-demand-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            padding: 20px 22px;
            border-bottom: 1px solid rgba(148,163,184,.08);
          }

          .catalogue-demand-eyebrow {
            color: #67e8f9;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: .18em;
          }

          .catalogue-demand-header h2 {
            margin: 5px 0 0;
            color: #f8fafc;
            font-size: 16px;
            font-weight: 900;
          }

          .catalogue-demand-header p {
            max-width: 650px;
            margin: 5px 0 0;
            color: #71809a;
            font-size: 10px;
            line-height: 1.5;
          }

          .catalogue-demand-badges {
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: wrap;
          }

          .catalogue-demand-badges span {
            padding: 6px 9px;
            border: 1px solid rgba(103,232,249,.12);
            border-radius: 999px;
            background: rgba(34,211,238,.055);
            color: #a5f3fc;
            font-size: 8px;
            font-weight: 800;
            white-space: nowrap;
          }

          .catalogue-demand-badges .danger {
            border-color: rgba(248,113,113,.14);
            background: rgba(239,68,68,.055);
            color: #fca5a5;
          }

          .catalogue-demand-grid {
            display: grid;
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 13px;
            padding: 15px 22px;
          }

          .catalogue-demand-card {
            min-width: 0;
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.08);
            border-radius: 13px;
            background: rgba(255,255,255,.018);
          }

          .catalogue-demand-card-head {
            padding: 14px 15px;
            border-bottom: 1px solid rgba(148,163,184,.065);
          }

          .catalogue-demand-card-head h3 {
            margin: 0;
            color: #e2e8f0;
            font-size: 11px;
            font-weight: 900;
          }

          .catalogue-demand-card-head p {
            margin: 4px 0 0;
            color: #64748b;
            font-size: 9px;
          }

          .catalogue-gap-list {
            padding: 3px 0;
          }

          .catalogue-gap-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            border-bottom: 1px solid rgba(148,163,184,.05);
          }

          .catalogue-gap-row:last-child {
            border-bottom: 0;
          }

          .catalogue-gap-rank {
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 25px;
            border-radius: 7px;
            background: rgba(34,211,238,.07);
            color: #67e8f9;
            font-size: 9px;
            font-weight: 900;
          }

          .catalogue-gap-main {
            min-width: 0;
            flex: 1;
          }

          .catalogue-gap-main strong {
            display: block;
            color: #dbeafe;
            font-size: 10px;
            line-height: 1.4;
            font-weight: 800;
          }

          .catalogue-gap-meta {
            display: flex;
            gap: 7px;
            flex-wrap: wrap;
            margin-top: 5px;
          }

          .catalogue-gap-meta span {
            color: #64748b;
            font-size: 8px;
          }

          .catalogue-gap-meta .growth {
            color: #4ade80;
          }

          .catalogue-gap-meta .unanswered {
            color: #fca5a5;
          }

          .catalogue-gap-main small {
            display: block;
            overflow: hidden;
            margin-top: 5px;
            color: #53627b;
            font-size: 8px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .catalogue-recommendations {
            padding: 3px 0;
          }

          .catalogue-recommendation {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
            border-bottom: 1px solid rgba(148,163,184,.05);
          }

          .catalogue-recommendation:last-child {
            border-bottom: 0;
          }

          .catalogue-recommendation-number {
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 25px;
            border-radius: 7px;
            background: rgba(139,92,246,.09);
            color: #c4b5fd;
            font-size: 9px;
            font-weight: 900;
          }

          .catalogue-recommendation p {
            margin: 1px 0 0;
            color: #aebbd0;
            font-size: 9px;
            line-height: 1.55;
          }

          .catalogue-demand-empty {
            min-height: 145px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #64748b;
            font-size: 10px;
            text-align: center;
          }

          .catalogue-demand-badges .emerging {
            border-color: rgba(250,204,21,.14);
            background: rgba(250,204,21,.05);
            color: #fde68a;
          }

          .catalogue-gap-meta .emerging-text {
            color: #fde68a;
          }

          .catalogue-intent-summary {
            margin: 0 22px 14px;
            padding: 13px 14px;
            border: 1px solid rgba(148,163,184,.075);
            border-radius: 12px;
            background: rgba(255,255,255,.018);
          }

          .catalogue-intent-title {
            color: #94a3b8;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          .catalogue-intent-grid {
            display: flex;
            gap: 7px;
            flex-wrap: wrap;
            margin-top: 9px;
          }

          .catalogue-intent-chip {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 9px;
            border: 1px solid rgba(34,211,238,.09);
            border-radius: 8px;
            background: rgba(34,211,238,.035);
          }

          .catalogue-intent-chip span {
            color: #94a3b8;
            font-size: 8px;
          }

          .catalogue-intent-chip strong {
            color: #67e8f9;
            font-size: 9px;
          }

          .catalogue-intent-chip.muted {
            border-color: rgba(148,163,184,.08);
            background: rgba(148,163,184,.025);
          }

          .catalogue-intent-chip.muted strong {
            color: #94a3b8;
          }
          .catalogue-demand-note {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin: 0 22px 20px;
            padding: 10px 12px;
            border: 1px solid rgba(250,204,21,.10);
            border-radius: 9px;
            background: rgba(250,204,21,.035);
            color: #94a3b8;
            font-size: 8px;
            line-height: 1.5;
          }

          .catalogue-demand-note svg {
            flex: 0 0 auto;
            color: #facc15;
          }
          @media (max-width: 800px) {
            .ai-panel-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .ai-refresh-button {
              width: 100%;
            }

            .ai-insight-grid {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 560px) {
            .ai-kpi-grid {
              grid-template-columns: 1fr;
            }

            .ai-panel-header,
            .ai-kpi-grid,
            .ai-insight-grid {
              padding-left: 15px;
              padding-right: 15px;
            }

            .ai-panel-title p {
              max-width: 100%;
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
      
      {/* AI SEARCH INTELLIGENCE */}
<section className="ai-intelligence-panel">
  <div className="ai-panel-header">
    <div className="ai-panel-title">
      <div className="ai-brain-icon"><BrainCircuit size={20} /></div>
      <div>
        <h2>AI Search Intelligence</h2>
        <p>Understand what customers are searching for, what they want, and where your catalogue has gaps.</p>
      </div>
    </div>
    <button
      type="button"
      className="ai-refresh-button"
      onClick={async () => {
        try {
          setAiSearchLoading(true);
          setAiSearchError("");
          const data = await getAiSearchIntelligence(Number(range));
          setAiSearchData(data || null);
          toast.success("AI intelligence refreshed.");
        } catch (err) {
          console.error("AI SEARCH REFRESH ERROR:", err);
          setAiSearchError(err?.message || "Unable to refresh AI intelligence");
        } finally {
          setAiSearchLoading(false);
        }
      }}
      disabled={aiSearchLoading}
    >
      <RefreshCw size={15} className={aiSearchLoading ? "ai-spin" : ""} />
      {aiSearchLoading ? "Analysing..." : "Refresh Intelligence"}
    </button>
  </div>

  {aiSearchError && (
    <div className="ai-error">
      <TriangleAlert size={16} />
      <span>{aiSearchError}</span>
    </div>
  )}

  <div className="ai-kpi-grid">
    <AiMetric title="AI Searches" value={aiSummary.totalSearches ?? aiSearchData?.totalSearches ?? 0} subtitle={`Last ${range} days`} icon={<Search size={18} />} accent="cyan" />
    <AiMetric title="Unique Sessions" value={aiSummary.uniqueSessions ?? aiSearchData?.uniqueSessions ?? 0} subtitle="Customer search sessions" icon={<Users size={18} />} accent="purple" />
    <AiMetric title="Matched Queries" value={aiSummary.matchedQueries ?? aiSearchData?.matchedQueries ?? 0} subtitle="Queries with useful results" icon={<Boxes size={18} />} accent="green" />
    <AiMetric title="Match Rate" value={`${Number(aiSummary.matchRate ?? aiSearchData?.matchRate ?? 0).toFixed(1)}%`} subtitle="Catalogue coverage" icon={<TrendingUp size={18} />} accent="blue" />
  </div>

  <div className="ai-insight-grid">
    <AiInsightList title="Top Customer Questions" subtitle="Most frequently searched requirements" icon={<Search size={16} />} items={aiTopQuestions} empty="No customer search questions yet." />
    <AiInsightList title="Fastest Growing Searches" subtitle="Search demand gaining momentum" icon={<TrendingUp size={16} />} items={aiTrending} empty="No trending searches yet." />
    <AiInsightList title="Customer Intent" subtitle="What customers are trying to accomplish" icon={<BrainCircuit size={16} />} items={aiIntents} empty="No intent signals yet." />
    <AiInsightList title="Unanswered Demand" subtitle="Queries where catalogue coverage is weak" icon={<TriangleAlert size={16} />} items={aiUnanswered} empty="No unanswered demand detected." warning />
  </div>
</section>
      
{/* ============================================================
          CATALOGUE DEMAND + GAP ANALYSIS
          ============================================================ */}
      <section className="catalogue-demand-panel">
        <div className="catalogue-demand-header">
          <div>
            <div className="catalogue-demand-eyebrow">
              BUSINESS INTELLIGENCE
            </div>
            <h2>Catalogue Demand & Gap Analysis</h2>
            <p>
              Turn real customer searches into product, specification and
              catalogue improvement opportunities.
            </p>
          </div>

          <div className="catalogue-demand-badges">
            <span>
              {demandSignalCount} catalogue signals
            </span>
            <span className="emerging">
              {emergingSignalCount} emerging
            </span>
            <span className="danger">
              {unansweredSignalCount} unanswered signals
            </span>
          </div>
        </div>

        <div className="catalogue-demand-grid">
          <div className="catalogue-demand-card">
            <div className="catalogue-demand-card-head">
              <div>
                <h3>Potential Catalogue Gaps</h3>
                <p>
                  Areas repeatedly requested by customers.
                </p>
              </div>
            </div>

            {catalogueGaps.length === 0 ? (
              <div className="catalogue-demand-empty">
                No meaningful catalogue gap signals yet.
              </div>
            ) : (
              <div className="catalogue-gap-list">
                {catalogueGaps.map((gap, index) => (
                  <div
                    className="catalogue-gap-row"
                    key={`${gap.key}-${index}`}
                  >
                    <div className="catalogue-gap-rank">
                      {index + 1}
                    </div>

                    <div className="catalogue-gap-main">
                      <strong>{gap.label}</strong>

                      <div className="catalogue-gap-meta">
                        <span>
                          Demand: {gap.demand}
                        </span>

                        {gap.demand >= 3 && gap.growth > 20 ? (
                          <span className="growth">
                            +{gap.growth}% growth
                          </span>
                        ) : gap.demand < 3 ? (
                          <span className="emerging-text">
                            Emerging signal
                          </span>
                        ) : null}

                        {gap.unanswered > 0 && (
                          <span className="unanswered">
                            {gap.unanswered} unanswered
                          </span>
                        )}
                      </div>

                      {gap.examples?.length > 0 && (
                        <small>
                          Example: {gap.examples[0]}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="catalogue-demand-card">
            <div className="catalogue-demand-card-head">
              <div>
                <h3>Recommended Actions</h3>
                <p>
                  Practical next steps based on observed demand.
                </p>
              </div>
            </div>

            {demandRecommendations.length === 0 ? (
              <div className="catalogue-demand-empty">
                More customer search data is needed to generate reliable
                recommendations.
              </div>
            ) : (
              <div className="catalogue-recommendations">
                {demandRecommendations.map((recommendation, index) => (
                  <div
                    className="catalogue-recommendation"
                    key={`${recommendation}-${index}`}
                  >
                    <div className="catalogue-recommendation-number">
                      {index + 1}
                    </div>
                    <p>{recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="catalogue-intent-summary">
          <div className="catalogue-intent-title">
            Search Intent Breakdown
          </div>

          <div className="catalogue-intent-grid">
            {aiDemandIntentRows.map((row) => (
              <div
                className="catalogue-intent-chip"
                key={row.intent}
              >
                <span>{row.label}</span>
                <strong>{row.count}</strong>
              </div>
            ))}

            {excludedNonCatalogueCount > 0 && (
              <div className="catalogue-intent-chip muted">
                <span>Non-catalogue / general</span>
                <strong>{excludedNonCatalogueCount}</strong>
              </div>
            )}
          </div>
        </div>
        <div className="catalogue-demand-note">
          <TriangleAlert size={15} />
          <span>
            These are demand signals, not automatic product decisions.
            Validate pricing, technical requirements, supplier availability,
            and catalogue fit before adding products.
          </span>
        </div>
      </section>
</main>
    </ProtectedRoute>
  );
}

function AiMetric({ title, value, subtitle, icon, accent }) {
  return (
    <div className="ai-metric">
      <div className={`ai-metric-icon ${accent}`}>{icon}</div>
      <span className="ai-metric-title">{title}</span>
      <strong className="ai-metric-value">{value}</strong>
      <span className="ai-metric-subtitle">{subtitle}</span>
    </div>
  );
}

function AiInsightList({ title, subtitle, icon, items, empty, warning = false }) {
  const normalizedItems = Array.isArray(items) ? items.slice(0, 6) : [];
  return (
    <div className="ai-insight-card">
      <div className="ai-insight-header">
        <div className="ai-insight-icon">{icon}</div>
        <div><h3>{title}</h3><p>{subtitle}</p></div>
      </div>
      {normalizedItems.length === 0 ? (
        <div className="ai-empty"><Search size={17} /><span>{empty}</span></div>
      ) : (
        <div className="ai-list">
          {normalizedItems.map((item, index) => {
            const label = typeof item === "string"
              ? item
              : item?.query || item?.question || item?.intent || item?.name || item?.label || "Unknown search";
            const count = Number(item?.count ?? item?.searches ?? item?.frequency ?? item?.total ?? 0);
            const growth = Number(item?.growth ?? item?.growthRate ?? 0);
            return (
              <div className={`ai-list-row ${warning ? "warning" : ""}`} key={`${label}-${index}`}>
                <div className="ai-rank">{index + 1}</div>
                <div className="ai-query">
                  <strong>{label}</strong>
                  {item?.category && <small>{item.category}</small>}
                </div>
                <div className="ai-value">
                  {count > 0 && <span>{count}</span>}
                  {growth > 0 && <small>+{growth}%</small>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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




