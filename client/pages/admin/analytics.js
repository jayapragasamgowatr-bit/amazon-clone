import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Clock3,
  Package,
  RefreshCw,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import ProtectedRoute from "../../components/ProtectedRoute";
import { getAdvancedAnalytics } from "../../lib/api";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const pct = (v) => `${Number(v || 0).toFixed(1)}%`;
const hours = (v) => `${Number(v || 0).toFixed(1)} h`;

export default function AdvancedAnalytics() {
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - Number(range) + 1);
      const from = fromDate.toISOString().slice(0, 10);
      const to = today.toISOString().slice(0, 10);
      const result = await getAdvancedAnalytics({ from, to });
      setData(result || null);
    } catch (err) {
      console.error("ADVANCED ANALYTICS ERROR:", err);
      setError(err?.message || "Unable to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const categories = Array.isArray(data?.categories) ? data.categories : [];
  const customers = Array.isArray(data?.topCustomers) ? data.topCustomers : [];
  const payments = Array.isArray(data?.paymentMethods) ? data.paymentMethods : [];
  const maxCategoryRevenue = Math.max(1, ...categories.map((x) => Number(x.revenue || 0)));
  const maxCustomerRevenue = Math.max(1, ...customers.map((x) => Number(x.revenue || 0)));
  const summary = data?.summary || {};
  const customerSummary = data?.customers || {};
  const inventory = data?.inventory || {};
  const fulfillment = data?.fulfillment || {};
  const reviews = data?.reviews || {};

  const insights = useMemo(() => {
    const list = [];
    if (Number(summary.cancellationRate || 0) >= 10) list.push("Cancellation rate is above 10%; review cancellation reasons and fulfillment delays.");
    if (Number(inventory.outOfStock || 0) > 0) list.push(`${inventory.outOfStock} active product${inventory.outOfStock === 1 ? " is" : "s are"} out of stock.`);
    if (Number(customerSummary.repeatRate || 0) < 20 && Number(customerSummary.uniqueCustomers || 0) >= 10) list.push("Repeat-customer rate is below 20%; consider retention campaigns and personalized recommendations.");
    if (!list.length) list.push("Core business indicators are healthy for the selected period. Continue collecting data to unlock ML forecasting and personalization.");
    return list;
  }, [summary, inventory, customerSummary]);

  return (
    <ProtectedRoute>
      <main className="page">
        <div className="shell">
          <header className="header">
            <div>
              <Link href="/admin" className="back"><ArrowLeft size={16} /> Dashboard</Link>
              <div className="eyebrow">WAVENTRA VETRIC • INTELLIGENCE</div>
              <h1>Advanced Analytics</h1>
              <p>Decision-ready business insights from orders, customers, products and inventory.</p>
            </div>
            <div className="actions">
              <select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Analytics range">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 12 months</option>
              </select>
              <button onClick={() => { setRefreshing(true); load(); }} disabled={refreshing}>
                <RefreshCw size={16} className={refreshing ? "spin" : ""} /> {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </header>

          {error && <div className="error">{error}</div>}
          {loading ? <div className="loading"><div className="loader" /> Loading advanced analytics...</div> : (
            <>
              <section className="kpis">
                <Kpi icon={<CircleDollarSign />} title="Revenue" value={money(summary.revenue)} sub={`${summary.unitsSold || 0} units sold`} />
                <Kpi icon={<ShoppingCart />} title="Orders" value={Number(summary.orders || 0).toLocaleString("en-IN")} sub={`${pct(summary.cancellationRate)} cancelled`} />
                <Kpi icon={<TrendingUp />} title="AOV" value={money(summary.averageOrderValue)} sub={`${summary.deliveredOrders || 0} delivered`} />
                <Kpi icon={<Users />} title="Repeat Rate" value={pct(customerSummary.repeatRate)} sub={`${customerSummary.repeatCustomers || 0} repeat customers`} />
              </section>

              <section className="grid two">
                <Panel title="Category Performance" icon={<BarChart3 />}>
                  {categories.length ? categories.map((item) => (
                    <div className="metric-row" key={item.category}>
                      <div className="row-top"><strong>{item.category}</strong><span>{money(item.revenue)}</span></div>
                      <div className="track"><div className="fill" style={{ width: `${Math.max(3, (Number(item.revenue || 0) / maxCategoryRevenue) * 100)}%` }} /></div>
                      <small>{Number(item.units || 0).toLocaleString("en-IN")} units</small>
                    </div>
                  )) : <Empty text="No category sales in this period." />}
                </Panel>

                <Panel title="Inventory Intelligence" icon={<Boxes />}>
                  <Stat label="Inventory value" value={money(inventory.inventoryValue)} />
                  <Stat label="Stock units" value={Number(inventory.stockUnits || 0).toLocaleString("en-IN")} />
                  <Stat label="Low stock" value={inventory.lowStock || 0} alert={Number(inventory.lowStock || 0) > 0} />
                  <Stat label="Out of stock" value={inventory.outOfStock || 0} alert={Number(inventory.outOfStock || 0) > 0} />
                  <Link className="link" href="/admin/inventory">Open inventory audit →</Link>
                </Panel>
              </section>

              <section className="grid two">
                <Panel title="Top Customers" icon={<Users />}>
                  {customers.length ? customers.map((item, index) => (
                    <div className="customer-row" key={String(item.id || item.email || index)}>
                      <span className="rank">{index + 1}</span>
                      <div className="customer-main"><strong>{item.name || "Customer"}</strong><small>{item.email || ""}</small></div>
                      <div className="customer-value"><strong>{money(item.revenue)}</strong><small>{item.orders} orders</small></div>
                    </div>
                  )) : <Empty text="No customer sales in this period." />}
                </Panel>

                <Panel title="Fulfillment & Reviews" icon={<Clock3 />}>
                  <Stat label="Average delivery time" value={hours(fulfillment.averageHours)} />
                  <Stat label="Fastest delivery" value={hours(fulfillment.fastestHours)} />
                  <Stat label="Slowest delivery" value={hours(fulfillment.slowestHours)} />
                  <Stat label="Average rating" value={`${Number(reviews.averageRating || 0).toFixed(1)} / 5`} />
                  <Stat label="Total reviews" value={reviews.totalReviews || 0} />
                </Panel>
              </section>

              <section className="grid two">
                <Panel title="Payment Mix" icon={<Package />}>
                  {payments.map((item) => <Stat key={item.method} label={item.method} value={`${item.orders} orders • ${money(item.revenue)}`} />)}
                </Panel>
                <Panel title="Business Signals" icon={<Star />}>
                  <ul className="insights">{insights.map((item, i) => <li key={i}>{item}</li>)}</ul>
                </Panel>
              </section>

              <section className="future">
                <div><div className="eyebrow">NEXT INTELLIGENCE LAYER</div><h2>Ready for ML & AI</h2><p>This analytics foundation can feed product recommendations, demand forecasting, customer lifetime value, churn prediction and the future AI Admin Copilot.</p></div>
                <div className="future-tags"><span>Recommendations</span><span>Demand Forecasting</span><span>Customer 360</span><span>AI Copilot</span></div>
              </section>
            </>
          )}
        </div>
      </main>
      <style jsx>{`
        .page{min-height:100vh;padding:34px 20px 70px;background:radial-gradient(circle at 15% 0%,rgba(14,165,233,.10),transparent 30%),#07111f;color:#e5eefb}.shell{max-width:1450px;margin:auto}.header{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-bottom:26px}.back{display:inline-flex;gap:7px;align-items:center;color:#7dd3fc;text-decoration:none;font-size:13px;margin-bottom:16px}.eyebrow{font-size:11px;letter-spacing:.16em;color:#38bdf8;font-weight:800}.header h1{margin:7px 0 5px;font-size:clamp(30px,4vw,44px)}.header p{margin:0;color:#8291a8}.actions{display:flex;gap:10px}.actions select,.actions button{height:42px;border:1px solid rgba(148,163,184,.18);border-radius:10px;background:#0d1a2b;color:#e5eefb;padding:0 14px}.actions button{display:flex;align-items:center;gap:8px;cursor:pointer}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:15px}.kpi,.panel,.future{background:rgba(15,27,44,.82);border:1px solid rgba(148,163,184,.14);border-radius:16px;box-shadow:0 16px 45px rgba(0,0,0,.15)}.kpi{padding:19px}.kpi-icon{display:flex;width:38px;height:38px;align-items:center;justify-content:center;border-radius:10px;background:rgba(14,165,233,.10);color:#38bdf8}.kpi-title{color:#8190a8;font-size:12px;margin-top:12px}.kpi-value{font-size:27px;font-weight:900;margin-top:4px}.kpi-sub{font-size:12px;color:#73829a;margin-top:5px}.grid{display:grid;gap:15px;margin-bottom:15px}.two{grid-template-columns:1.2fr .8fr}.panel{padding:20px}.panel-head{display:flex;gap:9px;align-items:center;margin-bottom:18px}.panel-head svg{color:#38bdf8}.panel-head h2{font-size:17px;margin:0}.metric-row{margin:0 0 17px}.row-top{display:flex;justify-content:space-between;gap:10px;font-size:13px}.row-top span{color:#a5b4c7}.track{height:7px;background:#152338;border-radius:99px;margin:8px 0 5px;overflow:hidden}.fill{height:100%;background:#38bdf8;border-radius:99px}.metric-row small,.customer-main small,.customer-value small{color:#718097;font-size:11px}.customer-row{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid rgba(148,163,184,.08)}.customer-row:last-child{border-bottom:0}.rank{width:27px;height:27px;border-radius:8px;display:grid;place-items:center;background:#13243a;color:#7dd3fc;font-weight:800;font-size:12px}.customer-main{min-width:0;flex:1}.customer-main strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.customer-value{text-align:right}.customer-value strong{display:block;font-size:13px}.stat{display:flex;justify-content:space-between;gap:15px;padding:13px 0;border-bottom:1px solid rgba(148,163,184,.08);font-size:13px}.stat:last-of-type{border-bottom:0}.stat span{color:#8b9ab0}.alert{color:#fbbf24!important}.link{display:inline-block;margin-top:15px;color:#7dd3fc;text-decoration:none;font-size:13px}.insights{margin:0;padding-left:20px;color:#c5d2e4;line-height:1.8;font-size:13px}.future{display:flex;justify-content:space-between;gap:25px;padding:24px;margin-top:15px}.future h2{margin:7px 0}.future p{color:#8190a8;max-width:760px;margin:0;line-height:1.6}.future-tags{display:flex;gap:8px;flex-wrap:wrap;align-content:center;justify-content:flex-end}.future-tags span{padding:8px 10px;border:1px solid rgba(56,189,248,.16);border-radius:999px;background:rgba(56,189,248,.06);color:#bae6fd;font-size:11px}.loading{min-height:55vh;display:grid;place-items:center;color:#9aa9bd}.loader{width:34px;height:34px;border:3px solid rgba(56,189,248,.16);border-top-color:#38bdf8;border-radius:50%;animation:spin .8s linear infinite}.error{padding:13px;border-radius:10px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.18);margin-bottom:15px;color:#fecaca}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:950px){.kpis{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}.header,.future{align-items:flex-start;flex-direction:column}.future-tags{justify-content:flex-start}}@media(max-width:600px){.page{padding:25px 14px 50px}.kpis{grid-template-columns:1fr}.actions{width:100%}.actions select,.actions button{flex:1}.panel{padding:16px}}
      `}</style>
    </ProtectedRoute>
  );
}

function Kpi({ icon, title, value, sub }) { return <div className="kpi"><div className="kpi-icon">{icon}</div><div className="kpi-title">{title}</div><div className="kpi-value">{value}</div><div className="kpi-sub">{sub}</div></div>; }
function Panel({ title, icon, children }) { return <section className="panel"><div className="panel-head">{icon}<h2>{title}</h2></div>{children}</section>; }
function Stat({ label, value, alert }) { return <div className="stat"><span>{label}</span><strong className={alert ? "alert" : ""}>{value}</strong></div>; }
function Empty({ text }) { return <div style={{ color: "#718097", fontSize: 13, padding: "15px 0" }}>{text}</div>; }
