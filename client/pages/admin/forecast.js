import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import SEO from "../../components/SEO";
import { getDemandForecast } from "../../lib/api";
import { Brain, RefreshCw, AlertTriangle, Package, TrendingUp, Search } from "lucide-react";

export default function DemandForecastPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [horizonDays, setHorizonDays] = useState(30);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [risk, setRisk] = useState("All");
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const result = await getDemandForecast({ horizonDays, leadTimeDays, risk, search });
      setData(result || null);
    } catch (error) {
      console.error("DEMAND FORECAST ERROR:", error);
      setData(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [horizonDays, leadTimeDays, risk]);

  const summary = data?.summary || {};
  const rows = data?.forecasts || [];

  return <ProtectedRoute adminOnly>
    <SEO title="ML Demand Forecast | Waventra Vetric" description="Predictive inventory demand and reorder intelligence." noIndex />
    <main className="page">
      <header className="header">
        <div>
          <div className="eyebrow"><Brain size={16}/> PREDICTIVE INVENTORY</div>
          <h1>ML Demand Forecast</h1>
          <p>Forecast future demand and identify stock-out risk before it happens.</p>
        </div>
        <button className="refresh" onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button>
      </header>

      <div className="notice"><Brain size={18}/><span><strong>Forecast engine:</strong> transparent hybrid velocity baseline using 14/30/90-day sales signals. It is ML-ready and can be replaced with a trained model after sufficient historical data is available.</span></div>

      <section className="controls">
        <label><span>Forecast horizon</span><select value={horizonDays} onChange={(e) => setHorizonDays(Number(e.target.value))}><option value={7}>7 days</option><option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option></select></label>
        <label><span>Lead time</span><select value={leadTimeDays} onChange={(e) => setLeadTimeDays(Number(e.target.value))}><option value={3}>3 days</option><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option></select></label>
        <label><span>Risk</span><select value={risk} onChange={(e) => setRisk(e.target.value)}><option>All</option><option>Out of Stock</option><option>Critical</option><option>High</option><option>Medium</option><option>Healthy</option></select></label>
        <label className="search"><span>Search</span><div><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Product or category" /></div></label>
      </section>

      <section className="stats">
        <article><Package/><span>Products analysed</span><strong>{Number(summary.products || 0).toLocaleString()}</strong></article>
        <article><AlertTriangle/><span>Critical / out of stock</span><strong>{Number(summary.critical || 0) + Number(summary.outOfStock || 0)}</strong></article>
        <article><TrendingUp/><span>Forecast demand</span><strong>{Number(summary.forecastUnits || 0).toLocaleString()} units</strong></article>
        <article><Package/><span>Suggested reorder</span><strong>{Number(summary.reorderUnits || 0).toLocaleString()} units</strong></article>
      </section>

      <section className="panel">
        <div className="panel-title"><div><h2>Demand & Reorder Forecast</h2><p>{data ? `Generated ${new Date(data.generatedAt).toLocaleString()}` : ""}</p></div></div>
        {loading ? <div className="empty">Calculating forecast...</div> : rows.length === 0 ? <div className="empty">No products match the selected filters.</div> : <div className="table-wrap"><table><thead><tr><th>Product</th><th>Stock</th><th>Daily demand</th><th>Forecast</th><th>Days cover</th><th>Risk</th><th>Reorder</th></tr></thead><tbody>{rows.map((row) => <tr key={row.product._id}><td><div className="product"><div><strong>{row.product.name}</strong><small>{row.product.category || "Uncategorized"}</small></div></div></td><td>{Number(row.product.countInStock || 0).toLocaleString()}</td><td>{Number(row.forecast.dailyDemand || 0).toFixed(2)}</td><td>{Number(row.forecast.forecastUnits || 0).toLocaleString()}</td><td>{row.forecast.daysOfCover == null ? "—" : `${row.forecast.daysOfCover} d`}</td><td><span className={`risk ${row.forecast.risk.toLowerCase().replaceAll(" ", "-")}`}>{row.forecast.risk}</span></td><td><strong>{Number(row.forecast.reorderQuantity || 0).toLocaleString()}</strong></td></tr>)}</tbody></table></div>}
      </section>

      <div className="back"><Link href="/admin/inventory">← Back to Inventory</Link></div>

      <style jsx>{`
        .page{max-width:1500px;margin:0 auto;padding:40px 20px 70px}.header{display:flex;justify-content:space-between;gap:20px;align-items:end}.eyebrow{display:flex;gap:7px;align-items:center;font-size:12px;font-weight:900;letter-spacing:.12em;opacity:.7}.header h1{font-size:clamp(30px,5vw,48px);margin:8px 0 5px}.header p{margin:0;opacity:.65}.refresh,.controls select,.controls input{padding:11px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:inherit}.refresh{display:flex;align-items:center;gap:7px;cursor:pointer}.notice{display:flex;gap:10px;margin:25px 0;padding:15px 17px;border-radius:14px;border:1px solid rgba(14,165,233,.2);background:rgba(14,165,233,.07);line-height:1.5;opacity:.9}.controls{display:grid;grid-template-columns:repeat(3,minmax(140px,1fr)) 2fr;gap:12px;margin:20px 0 25px}.controls label{display:grid;gap:6px}.controls label>span{font-size:12px;font-weight:800;opacity:.6}.controls select{width:100%}.search div{position:relative;display:flex;align-items:center}.search svg{position:absolute;left:12px;opacity:.6}.search input{width:100%;padding-left:38px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:25px}.stats article{padding:20px;border:1px solid rgba(255,255,255,.08);border-radius:17px;background:rgba(255,255,255,.035)}.stats svg{width:20px}.stats span{display:block;opacity:.6;margin:9px 0 4px}.stats strong{font-size:26px}.panel{padding:22px;border:1px solid rgba(255,255,255,.08);border-radius:20px;background:rgba(255,255,255,.03)}.panel-title h2{margin:0}.panel-title p{opacity:.5;font-size:12px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:14px;border-bottom:1px solid rgba(255,255,255,.07);white-space:nowrap}th{font-size:11px;text-transform:uppercase;opacity:.55}.product small{display:block;opacity:.5;margin-top:3px}.risk{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900}.risk.out-of-stock,.risk.critical{background:rgba(239,68,68,.14)}.risk.high{background:rgba(245,158,11,.14)}.risk.medium{background:rgba(234,179,8,.12)}.risk.healthy{background:rgba(34,197,94,.12)}.empty{text-align:center;padding:55px 20px;opacity:.6}.back{margin-top:20px}.back a{opacity:.75;font-weight:800}@media(max-width:900px){.controls{grid-template-columns:repeat(2,1fr)}.stats{grid-template-columns:repeat(2,1fr)}.header{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.controls{grid-template-columns:1fr}.stats{grid-template-columns:1fr}}
      `}</style>
    </main>
  </ProtectedRoute>;
}
