import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, RefreshCw, Package, ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react";
import { getInventory, getInventoryHistory } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const statusOptions = ["All", "In Stock", "Low Stock", "Out of Stock"];
const typeOptions = ["All", "IN", "OUT", "ADJUSTMENT"];

const money = (v) => `₹${(Number(v) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const dateTime = (v) => v ? new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

export default function AdminInventory() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, inStockProducts: 0, outOfStockProducts: 0, lowStockProducts: 0, inactiveProducts: 0, lowStockThreshold: 5 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false, totalProducts: 0 });
  const [history, setHistory] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, totalPages: 0, hasNextPage: false, hasPreviousPage: false, totalTransactions: 0 });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [threshold, setThreshold] = useState(5);
  const [historyType, setHistoryType] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventory({ page: pagination.page, limit: 20, search, status, lowStockThreshold: threshold });
      setProducts(Array.isArray(data?.products) ? data.products : []);
      setSummary(data?.summary || {});
      setPagination(data?.pagination || pagination);
    } catch (e) { toast.error(e?.message || "Failed to load inventory"); }
    finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await getInventoryHistory({ page: historyPagination.page, limit: 15, type: historyType, from, to });
      setHistory(Array.isArray(data?.history) ? data.history : []);
      setHistoryPagination(data?.pagination || historyPagination);
    } catch (e) { toast.error(e?.message || "Failed to load stock history"); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { if (user) loadInventory(); }, [user, pagination.page, search, status, threshold]);
  useEffect(() => { if (user) loadHistory(); }, [user, historyPagination.page, historyType, from, to]);

  if (authLoading || (loading && !products.length)) return <div className="loading"><div className="spinner"/><strong>Loading inventory...</strong><style jsx>{styles}</style></div>;

  return <div className="inventory-page">
    <div className="container">
      <header className="header">
        <div><div className="eyebrow">ADMIN PANEL · INVENTORY</div><h1>Inventory</h1><p>Monitor stock levels and review every inventory movement.</p></div>
        <button className="refresh" onClick={async () => { await Promise.all([loadInventory(), loadHistory()]); toast.success("Inventory refreshed."); }} disabled={loading || historyLoading}><RefreshCw size={17} className={loading || historyLoading ? "spin" : ""}/> Refresh</button>
      </header>

      <section className="stats">
        <Stat icon={<Package size={20}/>} label="Total Products" value={summary.totalProducts || 0}/>
        <Stat icon={<ArrowUp size={20}/>} label="In Stock" value={summary.inStockProducts || 0}/>
        <Stat icon={<ArrowDown size={20}/>} label="Out of Stock" value={summary.outOfStockProducts || 0}/>
        <Stat icon={<SlidersHorizontal size={20}/>} label={`Low Stock · ≤ ${summary.lowStockThreshold ?? threshold}`} value={summary.lowStockProducts || 0}/>
        <Stat icon={<span>○</span>} label="Inactive" value={summary.inactiveProducts || 0}/>
      </section>

      <section className="filter-card">
        <div className="search"><Search size={18}/><input value={search} onChange={e => { setSearch(e.target.value); setPagination(p => ({...p, page: 1})); }} placeholder="Search product or category..."/></div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPagination(p => ({...p, page: 1})); }}>{statusOptions.map(x => <option key={x}>{x}</option>)}</select>
        <label className="threshold"><span>Low-stock threshold</span><input type="number" min="0" value={threshold} onChange={e => { setThreshold(Math.max(0, Number(e.target.value) || 0)); setPagination(p => ({...p, page: 1})); }}/></label>
      </section>

      <section className="card">
        <div className="section-head"><div><h2>Current Stock</h2><p>{pagination.totalProducts || 0} products matching your filters</p></div><span className="hint">Stock changes are automatically audited</span></div>
        <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>State</th><th>Updated</th></tr></thead><tbody>
          {products.length ? products.map(p => { const qty=Number(p.countInStock)||0; const low=qty>0 && qty<=threshold; return <tr key={p._id}><td><div className="product"><div className="image">{p.image ? <img src={p.image} alt=""/> : <Package size={22}/>}</div><div><strong>{p.name}</strong><small>{p._id}</small></div></div></td><td><span className="category">{p.category || "Uncategorized"}</span></td><td>{money(p.price)}</td><td><strong className="qty">{qty}</strong></td><td><span className={`badge ${qty===0 ? "out" : low ? "low" : "in"}`}>{qty===0 ? "Out of stock" : low ? "Low stock" : "In stock"}</span></td><td className="muted">{dateTime(p.updatedAt)}</td></tr>; }) : <tr><td colSpan="6"><div className="empty">No inventory records found.</div></td></tr>}
        </tbody></table></div>
        <Pager pagination={pagination} setPagination={setPagination} label="products"/>
      </section>

      <section className="card history-card">
        <div className="section-head history-head"><div><h2>Stock Movement History</h2><p>A complete audit trail of stock changes.</p></div><div className="history-filters"><select value={historyType} onChange={e => {setHistoryType(e.target.value); setHistoryPagination(p=>({...p,page:1}));}}>{typeOptions.map(x=><option key={x}>{x}</option>)}</select><input type="date" value={from} max={to || undefined} onChange={e=>{setFrom(e.target.value);setHistoryPagination(p=>({...p,page:1}));}}/><input type="date" value={to} min={from || undefined} onChange={e=>{setTo(e.target.value);setHistoryPagination(p=>({...p,page:1}));}}/></div></div>
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th>Movement</th><th>Stock</th><th>Reason</th><th>Performed By</th></tr></thead><tbody>
          {history.length ? history.map(h => <tr key={h._id}><td className="muted">{dateTime(h.createdAt)}</td><td><strong>{h.product?.name || "Deleted product"}</strong><small className="sub">{h.product?.category || ""}</small></td><td><span className={`movement ${h.quantityChange > 0 ? "plus" : h.quantityChange < 0 ? "minus" : "adjust"}`}>{h.quantityChange > 0 ? "+" : ""}{h.quantityChange}</span></td><td><span className="stock-flow">{h.previousStock} <b>→</b> {h.newStock}</span></td><td><span className="reason">{h.reason}</span></td><td>{h.performedBy?.name || h.performedBy?.email || "System"}</td></tr>) : <tr><td colSpan="6"><div className="empty">No stock movements found.</div></td></tr>}
        </tbody></table></div>
        <Pager pagination={historyPagination} setPagination={setHistoryPagination} label="movements" history/>
      </section>
    </div>
    <style jsx>{styles}</style>
  </div>;
}

function Stat({icon,label,value}) { return <div className="stat"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function Pager({pagination,setPagination,label}) { return <div className="pager"><span>Showing current page · {pagination.totalProducts ?? pagination.totalTransactions ?? 0} total {label}</span><div><button disabled={!pagination.hasPreviousPage} onClick={()=>setPagination(p=>({...p,page:Math.max(1,p.page-1)}))}>← Previous</button><b>Page {pagination.page || 1} of {pagination.totalPages || 1}</b><button disabled={!pagination.hasNextPage} onClick={()=>setPagination(p=>({...p,page:Math.min(pagination.totalPages || p.page,p.page+1)}))}>Next →</button></div></div>; }

const styles = `
  .inventory-page{min-height:100vh;padding:34px 28px 80px;background:radial-gradient(circle at 8% 8%,rgba(124,58,237,.20),transparent 28%),radial-gradient(circle at 92% 16%,rgba(6,182,212,.16),transparent 30%),linear-gradient(135deg,#090f22 0%,#151331 48%,#092b3b 100%);color:#f8fafc}
  .container{max-width:1540px;margin:0 auto}.header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}.eyebrow{color:#67e8f9;font-size:11px;font-weight:900;letter-spacing:1.8px;margin-bottom:8px}.header h1{margin:0;font-size:clamp(34px,4vw,50px);line-height:1;font-weight:900;letter-spacing:-1.2px}.header p{margin:9px 0 0;color:#aeb9cd;font-size:15px}.refresh{min-height:42px;border:1px solid rgba(148,163,184,.18);border-radius:11px;padding:10px 16px;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.055);color:#e5edf8;font-weight:800;cursor:pointer}.refresh:disabled{opacity:.55;cursor:not-allowed}.stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;margin-bottom:18px}.stat{min-height:120px;padding:18px;border:1px solid rgba(148,163,184,.14);border-radius:18px;background:rgba(255,255,255,.055);box-shadow:0 18px 45px rgba(0,0,0,.16);display:flex;flex-direction:column;justify-content:space-between}.stat-icon{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(14,165,233,.11);color:#67e8f9}.stat span{display:block;color:#9eabc0;font-size:11px;font-weight:700;margin-top:12px}.stat strong{display:block;color:#fff;font-size:28px;line-height:1;margin-top:3px}.filter-card{display:grid;grid-template-columns:minmax(300px,1fr) 210px 220px;gap:12px;padding:14px;margin-bottom:18px;border:1px solid rgba(148,163,184,.14);border-radius:18px;background:rgba(255,255,255,.055);backdrop-filter:blur(16px)}.search,.filter-card select,.threshold{min-height:48px}.search{display:flex;align-items:center;gap:10px;padding:0 14px;border:1px solid rgba(148,163,184,.18);border-radius:11px;background:rgba(7,13,31,.32);color:#9fb0c8}.search input{border:0;outline:0;background:transparent;color:#f8fafc;width:100%;padding:12px 0}.filter-card select,.threshold input,.history-filters select,.history-filters input{box-sizing:border-box;border:1px solid rgba(148,163,184,.18);border-radius:11px;background:rgba(7,13,31,.32);color:#f8fafc;padding:12px;outline:none}.filter-card select option,.history-filters select option{background:#11182e}.threshold{display:flex;align-items:center;gap:8px;padding:0 12px;border:1px solid rgba(148,163,184,.18);border-radius:11px;background:rgba(7,13,31,.32)}.threshold span{font-size:11px;color:#8fa0b8;white-space:nowrap}.threshold input{width:70px;border:0;text-align:center;background:transparent}.card{overflow:hidden;border:1px solid rgba(148,163,184,.15);border-radius:20px;background:rgba(255,255,255,.052);box-shadow:0 24px 65px rgba(0,0,0,.20);margin-bottom:18px}.section-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 22px;border-bottom:1px solid rgba(148,163,184,.09)}.section-head h2{margin:0;font-size:18px}.section-head p{margin:5px 0 0;color:#7f8da5;font-size:12px}.hint{color:#67e8f9;font-size:11px;font-weight:700}.table-wrap{overflow-x:auto}table{width:100%;min-width:980px;border-collapse:collapse}th,td{padding:15px 18px;text-align:left;border-bottom:1px solid rgba(148,163,184,.09);vertical-align:middle}th{background:rgba(255,255,255,.03);color:#8997ad;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:900;white-space:nowrap}td{color:#d6deeb;font-size:13px}tbody tr:hover{background:rgba(255,255,255,.025)}tbody tr:last-child td{border-bottom:0}.product{display:flex;align-items:center;gap:12px;min-width:260px}.image{width:50px;height:50px;flex:0 0 50px;border-radius:11px;border:1px solid rgba(148,163,184,.13);background:rgba(255,255,255,.045);display:flex;align-items:center;justify-content:center;overflow:hidden;color:#67e8f9}.image img{width:100%;height:100%;object-fit:contain;padding:4px}.product strong{display:block;color:#f8fafc;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.product small,.sub{display:block;margin-top:4px;color:#64748b;font-size:9px;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.category{display:inline-flex;padding:6px 9px;border-radius:999px;background:rgba(99,102,241,.10);border:1px solid rgba(99,102,241,.12);color:#c7d2fe;font-size:10px;font-weight:800}.qty{font-size:16px}.badge,.movement,.reason{display:inline-flex;align-items:center;border-radius:999px;font-weight:800}.badge{padding:7px 10px;font-size:10px}.badge.in{background:rgba(34,197,94,.10);border:1px solid rgba(34,197,94,.14);color:#4ade80}.badge.low{background:rgba(245,158,11,.11);border:1px solid rgba(245,158,11,.15);color:#fbbf24}.badge.out{background:rgba(239,68,68,.10);border:1px solid rgba(239,68,68,.14);color:#f87171}.muted{color:#8492a8}.history-card{margin-top:22px}.history-head{align-items:flex-end}.history-filters{display:flex;align-items:center;gap:8px}.history-filters select,.history-filters input{min-height:40px;padding:9px 10px;font-size:11px}.movement{padding:6px 9px;font-size:11px}.movement.plus{background:rgba(34,197,94,.10);color:#4ade80}.movement.minus{background:rgba(239,68,68,.10);color:#f87171}.movement.adjust{background:rgba(56,189,248,.10);color:#67e8f9}.stock-flow{color:#cbd5e1;font-weight:700}.stock-flow b{margin:0 5px;color:#64748b}.reason{padding:6px 9px;background:rgba(255,255,255,.05);color:#aeb9cd;font-size:10px}.pager{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 18px;color:#7f8da5;font-size:11px}.pager>div{display:flex;align-items:center;gap:8px}.pager button{min-height:36px;border:1px solid rgba(148,163,184,.16);border-radius:9px;background:rgba(255,255,255,.05);color:#dbeafe;padding:8px 12px;font-weight:800;cursor:pointer}.pager button:disabled{opacity:.4;cursor:not-allowed}.pager b{min-width:100px;text-align:center;color:#aeb9cd}.empty{text-align:center;padding:45px;color:#748198}.loading{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#090f22;color:#e2e8f0}.spinner{width:38px;height:38px;border:4px solid rgba(148,163,184,.15);border-top-color:#22d3ee;border-radius:50%;animation:spin .8s linear infinite}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:1100px){.stats{grid-template-columns:repeat(3,minmax(0,1fr))}.filter-card{grid-template-columns:1fr 1fr}.threshold{grid-column:1/-1}.history-head{align-items:stretch;flex-direction:column}.history-filters{flex-wrap:wrap}}@media(max-width:700px){.inventory-page{padding:24px 14px 60px}.header{align-items:flex-start;flex-direction:column}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.filter-card{grid-template-columns:1fr}.threshold{grid-column:auto}.history-filters>*{flex:1;min-width:130px}.pager{flex-direction:column;align-items:stretch}.pager>div{justify-content:center}.pager b{min-width:80px}}@media(max-width:480px){.stats{grid-template-columns:1fr}.header h1{font-size:34px}}
`;
