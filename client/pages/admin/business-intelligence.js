import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { askBusinessIntelligence, getBusinessIntelligence } from "../../lib/api";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const pct = (v) => v === null || v === undefined ? "—" : `${Number(v).toFixed(1)}%`;

export default function BusinessIntelligence() {
  return <ProtectedRoute adminOnly><Inner /></ProtectedRoute>;
}

function Inner() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const to = new Date().toISOString().slice(0, 10);
      const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - Number(range) + 1);
      const from = fromDate.toISOString().slice(0, 10);
      setData(await getBusinessIntelligence({ from, to }));
    } catch (e) { setError(e?.message || "Unable to load business intelligence"); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const ask = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true); setError("");
    try {
      const to = new Date().toISOString().slice(0, 10);
      const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - Number(range) + 1);
      const from = fromDate.toISOString().slice(0, 10);
      const result = await askBusinessIntelligence(question.trim(), { from, to });
      setAnswer(result.answer || "No answer returned.");
    } catch (e) { setError(e?.message || "AI request failed"); }
    finally { setAsking(false); }
  };

  const s = data?.snapshot || {};
  const c = s.current || {}, p = s.previous || {}, inv = s.inventory || {}, cust = s.customers || {};
  const products = Array.isArray(s.topProducts) ? s.topProducts : [];
  const daily = Array.isArray(s.dailySales) ? s.dailySales : [];

  return <main style={styles.page}><div style={styles.wrap}>
    <div style={styles.top}><div><Link href="/admin" style={styles.back}>← Dashboard</Link><div style={styles.eyebrow}>WAVENTRA VETRIC • PHASE 21</div><h1 style={styles.h1}>AI Business Forecasting & Decision Intelligence</h1><p style={styles.sub}>Live MongoDB business data analyzed by Gemini. No simulated metrics or hardcoded business answers.</p></div><div><select value={range} onChange={e=>setRange(e.target.value)} style={styles.select}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="180">Last 180 days</option></select><button onClick={load} style={styles.btn} disabled={loading}>{loading?"Refreshing…":"Refresh"}</button></div></div>
    {error && <div style={styles.error}>{error}</div>}
    {data && <>
      <div style={styles.grid}>{[
        ["Revenue", money(c.revenue)], ["Orders", c.orders], ["AOV", money(c.averageOrderValue)], ["Revenue vs previous", pct(s.change?.revenuePct)], ["Customers", cust.uniqueCustomers], ["Repeat rate", pct(cust.repeatRate)], ["Low stock", inv.lowStock], ["Out of stock", inv.outOfStock]
      ].map(([k,v])=><div style={styles.card} key={k}><small>{k}</small><strong>{v}</strong></div>)}</div>
      <section style={styles.panel}><h2>Gemini management analysis</h2><div style={styles.ai}>{data.analysis || "No analysis returned."}</div></section>
      <section style={styles.panel}><h2>Ask the live business data</h2><form onSubmit={ask} style={styles.form}><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Why did revenue change? Which products need attention?" style={styles.input}/><button style={styles.btn} disabled={asking}>{asking?"Thinking…":"Ask Gemini"}</button></form>{answer && <div style={styles.answer}>{answer}</div>}</section>
      <div style={styles.cols}><section style={styles.panel}><h2>Top products</h2>{products.map(x=><div style={styles.row} key={String(x.id)}><span>{x.name}</span><b>{x.units} units · {money(x.revenue)}</b></div>)}</section><section style={styles.panel}><h2>Period comparison</h2><div style={styles.row}><span>Current revenue</span><b>{money(c.revenue)}</b></div><div style={styles.row}><span>Previous revenue</span><b>{money(p.revenue)}</b></div><div style={styles.row}><span>Current orders</span><b>{c.orders}</b></div><div style={styles.row}><span>Previous orders</span><b>{p.orders}</b></div><div style={styles.row}><span>Inventory value</span><b>{money(inv.inventoryValue)}</b></div></section></div>
      <section style={styles.panel}><h2>Daily sales data</h2><div style={{overflowX:"auto"}}><table style={styles.table}><thead><tr><th>Date</th><th>Orders</th><th>Revenue</th><th>Cancelled</th></tr></thead><tbody>{daily.map(x=><tr key={x.date}><td>{x.date}</td><td>{x.orders}</td><td>{money(x.revenue)}</td><td>{x.cancelled}</td></tr>)}</tbody></table></div></section>
    </>}
  </div></main>;
}

const styles={page:{minHeight:"100vh",background:"#06111f",color:"#edf7ff",padding:"34px 18px",fontFamily:"Arial,sans-serif"},wrap:{maxWidth:1200,margin:"auto"},top:{display:"flex",justifyContent:"space-between",gap:20,alignItems:"flex-end",marginBottom:22},back:{color:"#67e8f9",textDecoration:"none"},eyebrow:{fontSize:12,letterSpacing:2,color:"#67e8f9",marginTop:16},h1:{fontSize:34,margin:"8px 0"},sub:{color:"#9fb2c7",maxWidth:760},select:{padding:11,borderRadius:10,background:"#0d1b2d",color:"white",border:"1px solid #27415d",marginRight:8},btn:{padding:"11px 16px",border:0,borderRadius:10,background:"#22d3ee",color:"#03111d",fontWeight:800,cursor:"pointer"},grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12},card:{background:"#0d1b2d",border:"1px solid #20364e",borderRadius:14,padding:17},cardSmall:{},panel:{background:"#0d1b2d",border:"1px solid #20364e",borderRadius:16,padding:20,marginTop:16},ai:{whiteSpace:"pre-wrap",lineHeight:1.7,color:"#dbeafe"},form:{display:"flex",gap:10},input:{flex:1,padding:12,borderRadius:10,border:"1px solid #27415d",background:"#081525",color:"white"},answer:{marginTop:16,whiteSpace:"pre-wrap",lineHeight:1.7,padding:15,borderRadius:10,background:"#081525"},cols:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16},row:{display:"flex",justifyContent:"space-between",gap:15,padding:"11px 0",borderBottom:"1px solid #20364e"},table:{width:"100%",borderCollapse:"collapse"},error:{padding:14,borderRadius:10,background:"#3b1720",color:"#fecaca",marginBottom:14}}
