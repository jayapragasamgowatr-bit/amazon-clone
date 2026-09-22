import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, TrendingUp, ShoppingBag } from "lucide-react";
import { getPersonalizedRecommendations, getTrendingRecommendations, logRecommendationEvent } from "../lib/api";

const STORAGE_KEY = "wv_analytics_session";

function getSessionId() {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
}

export default function RecommendationSection({ type = "personalized", title, subtitle, productId, limit = 6 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const logged = useRef(false);
  const source = productId ? "similar" : type;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const data = productId
          ? await import("../lib/api").then((m) => m.getSimilarRecommendations(productId, { limit }))
          : type === "trending"
          ? await getTrendingRecommendations({ limit })
          : await getPersonalizedRecommendations({ limit, sessionId: getSessionId() });
        if (!cancelled) setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch { if (!cancelled) setProducts([]); }
      finally { if (!cancelled) setLoading(false); }
    };
    run();
    return () => { cancelled = true; };
  }, [type, productId, limit]);

  useEffect(() => {
    if (!products.length || logged.current) return;
    logged.current = true;
    const sessionId = getSessionId();
    products.forEach((product, index) => {
      if (sessionId && product?._id) logRecommendationEvent({ source, productId: product._id, action: "impression", sessionId, position: index + 1 });
    });
  }, [products, source]);

  const heading = useMemo(() => title || (productId ? "You May Also Like" : type === "trending" ? "Trending Products" : "Recommended for You"), [title, productId, type]);
  if (!loading && products.length === 0) return null;

  return (
    <section style={{ marginTop: 55 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {type === "trending" ? <TrendingUp size={21} /> : productId ? <ShoppingBag size={21} /> : <Sparkles size={21} />}
            <h2 style={{ margin: 0, fontSize: "clamp(24px,3vw,32px)", fontWeight: 900 }}>{heading}</h2>
          </div>
          <p style={{ margin: "7px 0 0", opacity: 0.65 }}>{subtitle || (productId ? "Products selected using category and feature similarity." : "Recommendations improve as your shopping activity grows.")}</p>
        </div>
      </div>
      <div className="recommendation-grid">
        {loading ? Array.from({ length: Math.min(limit, 6) }).map((_, i) => <div key={i} className="recommendation-skeleton" />) : products.map((product, index) => (
          <Link key={product._id} href={`/product/${product._id}`} style={{ textDecoration: "none", color: "inherit" }} onClick={() => logRecommendationEvent({ source, productId: product._id, action: "click", sessionId: getSessionId(), position: index + 1 })}>
            <article className="recommendation-card">
              <img src={product.image || ""} alt={product.name || "Product"} />
              <div className="recommendation-body">
                <small>{product.category || "Product"}</small>
                <h3>{product.name}</h3>
                <strong>₹{Number(product.price || 0).toLocaleString("en-IN")}</strong>
                <span>{Number(product.rating || 0).toFixed(1)} ★ · {Number(product.numReviews || 0)} reviews</span>
              </div>
            </article>
          </Link>
        ))}
      </div>
      <style jsx>{`
        .recommendation-grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:14px; }
        .recommendation-card { height:100%; border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); transition:transform .2s ease,border-color .2s ease; }
        .recommendation-card:hover { transform:translateY(-4px); border-color:rgba(14,165,233,.45); }
        .recommendation-card img { width:100%; height:145px; object-fit:contain; padding:10px; box-sizing:border-box; background:rgba(255,255,255,.03); }
        .recommendation-body { padding:13px; }
        .recommendation-body small,.recommendation-body span { display:block; opacity:.62; font-size:12px; }
        .recommendation-body h3 { margin:6px 0 8px; font-size:14px; line-height:1.35; min-height:38px; }
        .recommendation-body strong { display:block; margin-bottom:6px; }
        .recommendation-skeleton { height:235px; border-radius:18px; background:rgba(255,255,255,.05); animation:pulse 1.4s infinite ease-in-out; }
        @keyframes pulse { 50% { opacity:.45; } }
        @media(max-width:1100px){ .recommendation-grid{grid-template-columns:repeat(3,minmax(0,1fr));} }
        @media(max-width:600px){ .recommendation-grid{grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px;} .recommendation-card img{height:125px;} }
      `}</style>
    </section>
  );
}
