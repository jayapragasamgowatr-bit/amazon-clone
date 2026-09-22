import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import SEO from "../../components/SEO";
import { getRecommendationAnalytics } from "../../lib/api";
import { Sparkles, MousePointerClick, Eye, TrendingUp, RefreshCw } from "lucide-react";

export default function RecommendationAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ bySource: {} });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const result = await getRecommendationAnalytics({ days });
      setData(result || { bySource: {} });
    } catch (error) {
      console.error("RECOMMENDATION ANALYTICS ERROR:", error);
      setData({ bySource: {} });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [days]);

  const rows = Object.entries(data.bySource || {});
  const totals = rows.reduce((a, [, v]) => ({ impressions: a.impressions + Number(v.impressions || 0), clicks: a.clicks + Number(v.clicks || 0) }), { impressions: 0, clicks: 0 });
  const ctr = totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0.00";

  return <ProtectedRoute adminOnly>
    <SEO title="AI Recommendations | Waventra Vetric" description="Recommendation engine analytics." noIndex />
    <main className="page">
      <div className="header">
        <div><div className="eyebrow"><Sparkles size={16}/> AI ENGINE</div><h1>Recommendation Analytics</h1><p>Measure how personalized and trending recommendations perform.</p></div>
        <div className="controls"><select value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select><button onClick={load} disabled={loading}><RefreshCw size={16}/> Refresh</button></div>
      </div>
      <section className="stats">
        <article><Eye/><span>Impressions</span><strong>{totals.impressions.toLocaleString()}</strong></article>
        <article><MousePointerClick/><span>Clicks</span><strong>{totals.clicks.toLocaleString()}</strong></article>
        <article><TrendingUp/><span>Overall CTR</span><strong>{ctr}%</strong></article>
      </section>
      <section className="panel">
        <h2>Performance by Recommendation Type</h2>
        {loading ? <p>Loading analytics...</p> : rows.length ? <div className="table-wrap"><table><thead><tr><th>Type</th><th>Impressions</th><th>Clicks</th><th>CTR</th></tr></thead><tbody>{rows.map(([source, value]) => <tr key={source}><td>{source.replaceAll("_", " ")}</td><td>{Number(value.impressions || 0).toLocaleString()}</td><td>{Number(value.clicks || 0).toLocaleString()}</td><td>{Number(value.ctr || 0).toFixed(2)}%</td></tr>)}</tbody></table></div> : <div className="empty"><Sparkles size={30}/><p>No recommendation interactions yet. Browse the storefront to generate recommendation impressions and clicks.</p></div>}
      </section>
      <style jsx>{`
        .page{max-width:1400px;margin:0 auto;padding:40px 20px 70px}.header{display:flex;justify-content:space-between;gap:20px;align-items:end}.eyebrow{display:flex;gap:7px;align-items:center;font-size:12px;font-weight:900;letter-spacing:.12em;opacity:.7}.header h1{font-size:clamp(30px,5vw,48px);margin:8px 0 5px}.header p{margin:0;opacity:.65}.controls{display:flex;gap:10px}.controls select,.controls button{padding:11px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:inherit}.controls button{display:flex;align-items:center;gap:7px;cursor:pointer}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:30px 0}.stats article{padding:22px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(255,255,255,.04)}.stats svg{width:20px}.stats span{display:block;opacity:.6;margin:10px 0 4px}.stats strong{font-size:30px}.panel{padding:24px;border:1px solid rgba(255,255,255,.08);border-radius:20px;background:rgba(255,255,255,.035)}.panel h2{margin-top:0}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:14px;border-bottom:1px solid rgba(255,255,255,.07)}th{opacity:.6;font-size:12px;text-transform:uppercase}.empty{text-align:center;padding:55px 20px;opacity:.65}.empty p{max-width:550px;margin:12px auto}.controls option{color:#111}@media(max-width:700px){.header{align-items:flex-start;flex-direction:column}.controls{width:100%}.controls select,.controls button{flex:1}.stats{grid-template-columns:1fr}}
      `}</style>
    </main>
  </ProtectedRoute>;
}
