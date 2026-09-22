import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import SEO from "../../components/SEO";
import { getEventAnalytics } from "../../lib/api";

export default function EventAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setData(await getEventAnalytics({ days })); }
    catch (err) { setError(err?.message || "Unable to load event analytics"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [days]);

  const totals = data?.totals || {};
  const cards = [
    ["Unique Visitors", totals.uniqueVisitors || 0],
    ["Product Views", totals.productViews || 0],
    ["Searches", totals.searches || 0],
    ["Cart Adds", totals.cartAdds || 0],
    ["Checkout Starts", totals.checkoutStarts || 0],
    ["Checkout Conversion", `${totals.checkoutConversion || 0}%`],
  ];

  return (
    <ProtectedRoute adminOnly>
      <SEO title="Event Analytics | Waventra Vetric" description="Customer behavior and event analytics." path="/admin/event-analytics" noIndex />
      <div className="shell">
        <div className="header">
          <div><p className="eyebrow">DATA PLATFORM</p><h1>Event Analytics</h1><p>Behavior signals collected safely for future AI and ML models.</p></div>
          <div className="actions"><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last 365 days</option></select><Link href="/admin">Dashboard</Link></div>
        </div>
        {loading ? <div className="state">Loading analytics…</div> : error ? <div className="state error">{error}</div> : <>
          <div className="grid">{cards.map(([label, value]) => <div className="card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <div className="columns">
            <section className="panel"><h2>Top Products by Views</h2>{(data?.topProducts || []).length ? <div className="list">{data.topProducts.map((item) => <div className="row" key={item._id}><div><strong>{item.name || "Deleted product"}</strong><small>{item.category || ""}</small></div><b>{item.views}</b></div>)}</div> : <p className="muted">No product-view data yet.</p>}</section>
            <section className="panel"><h2>Top Search Terms</h2>{(data?.topSearches || []).length ? <div className="list">{data.topSearches.map((item) => <div className="row" key={item._id}><strong>{item._id}</strong><b>{item.searches}</b></div>)}</div> : <p className="muted">No search data yet.</p>}</section>
          </div>
          <section className="panel"><h2>Event Breakdown</h2><div className="event-grid">{(data?.eventCounts || []).map((item) => <div className="event" key={item._id}><span>{item._id}</span><strong>{item.count}</strong></div>)}</div></section>
          <section className="panel"><h2>Daily Event Volume</h2><div className="daily">{(data?.dailyEvents || []).map((item) => <div className="day" key={item._id}><span>{item._id}</span><div><i style={{ width: `${Math.min(100, (item.events / Math.max(...(data.dailyEvents || [{events:1}]).map(x => x.events))) * 100)}%` }} /></div><b>{item.events}</b></div>)}</div></section>
        </>}
      </div>
      <style jsx>{`
        .shell{max-width:1500px;margin:auto;padding:42px 22px 70px}.header{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:30px}.eyebrow{color:#38bdf8;font-weight:900;letter-spacing:1.4px;font-size:12px;margin:0 0 8px}.header h1{font-size:46px;margin:0 0 8px;font-weight:900}.header p{opacity:.65;margin:0}.actions{display:flex;gap:10px;align-items:center}.actions select,.actions a{padding:11px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(15,23,42,.75);color:inherit;font-weight:800}.grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}.card,.panel{border:1px solid rgba(255,255,255,.08);background:rgba(15,23,42,.68);border-radius:18px;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.12)}.card span{display:block;opacity:.6;font-size:12px;font-weight:800}.card strong{display:block;font-size:30px;margin-top:10px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}.panel{margin-top:20px}.panel h2{margin:0 0 18px;font-size:20px}.list{display:grid;gap:10px}.row{display:flex;justify-content:space-between;align-items:center;padding:12px;border-radius:12px;background:rgba(255,255,255,.035)}.row small{display:block;opacity:.5;margin-top:3px}.row b{font-size:18px}.muted,.state{opacity:.65}.state{text-align:center;padding:70px}.error{color:#fecaca}.event-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.event{padding:14px;border-radius:12px;background:rgba(255,255,255,.035)}.event span{display:block;opacity:.6;font-size:12px}.event strong{display:block;font-size:22px;margin-top:7px}.daily{display:grid;gap:10px}.day{display:grid;grid-template-columns:110px 1fr 55px;gap:12px;align-items:center}.day>div{height:9px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden}.day i{display:block;height:100%;background:#38bdf8;border-radius:999px}.day b{text-align:right}@media(max-width:1100px){.grid{grid-template-columns:repeat(3,1fr)}.event-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.header{align-items:start;flex-direction:column}.columns{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.grid,.event-grid{grid-template-columns:1fr}.day{grid-template-columns:85px 1fr 40px}.header h1{font-size:36px}}
      `}</style>
    </ProtectedRoute>
  );
}
