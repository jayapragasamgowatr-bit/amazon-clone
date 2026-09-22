import { useState } from "react";
import Link from "next/link";
import { askAISupport } from "../lib/api";

export default function AISupport() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async (e) => {
    e.preventDefault();
    const q = message.trim();
    if (!q || loading) return;
    setLoading(true); setError("");
    try {
      const data = await askAISupport(q);
      setAnswer(data.message || "No response returned.");
      setProducts(data.products || []);
      setMessage("");
    } catch (err) { setError(err.message || "AI support request failed."); }
    finally { setLoading(false); }
  };

  return <main style={s.page}><div style={s.wrap}>
    <div style={s.hero}><span style={s.badge}>REAL GEMINI AI SUPPORT</span><h1>How can we help?</h1><p>Ask about products, your orders, availability, specifications and shopping questions.</p></div>
    <form onSubmit={ask} style={s.form}><input value={message} onChange={e=>setMessage(e.target.value)} placeholder="e.g. Where is my latest order?" style={s.input}/><button disabled={loading} style={s.button}>{loading ? "Checking…" : "Ask AI"}</button></form>
    <div style={s.hints}><button onClick={()=>setMessage("Where is my latest order?")} style={s.hint}>Order status</button><button onClick={()=>setMessage("Show me products under ₹5000")} style={s.hint}>Find products</button><button onClick={()=>setMessage("Tell me about available products")} style={s.hint}>Product help</button></div>
    {error && <div style={s.error}>{error}</div>}
    {answer && <section style={s.answer}><strong>AI SUPPORT</strong><p>{answer}</p></section>}
    {products.length > 0 && <section><h2 style={s.title}>Relevant products</h2><div style={s.grid}>{products.map(p=><Link key={p._id} href={`/product/${p._id}`} style={s.card}><img src={p.image || "/placeholder.png"} alt="" style={s.img}/><h3>{p.name}</h3><b>₹{Number(p.price||0).toLocaleString("en-IN")}</b><small>{p.category || "Product"} · Stock {p.countInStock || 0}</small></Link>)}</div></section>}
  </div></main>;
}
const s={page:{minHeight:"80vh",background:"#07111f",color:"#eef6ff",padding:"50px 20px"},wrap:{maxWidth:1050,margin:"auto"},hero:{padding:"25px 0"},badge:{fontSize:12,letterSpacing:2,color:"#67e8f9"},form:{display:"flex",gap:12,margin:"20px 0 12px"},input:{flex:1,padding:16,borderRadius:12,border:"1px solid #27415d",background:"#0d1b2d",color:"white",fontSize:16},button:{padding:"0 24px",border:0,borderRadius:12,background:"#22d3ee",color:"#04111e",fontWeight:800},hints:{display:"flex",gap:8,flexWrap:"wrap"},hint:{padding:"8px 12px",borderRadius:999,border:"1px solid #27415d",background:"#0d1b2d",color:"#bdefff",cursor:"pointer"},answer:{marginTop:25,padding:22,borderRadius:16,background:"#0d1b2d",border:"1px solid #27415d",lineHeight:1.6},error:{marginTop:20,color:"#fecaca"},title:{marginTop:30},grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14},card:{textDecoration:"none",color:"inherit",background:"#0d1b2d",border:"1px solid #20364e",borderRadius:16,padding:14,display:"block"},img:{width:"100%",height:150,objectFit:"contain",background:"#081321",borderRadius:10},cardSmall:{display:"block"}};
