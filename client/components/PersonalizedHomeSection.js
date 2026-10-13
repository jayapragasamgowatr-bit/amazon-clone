import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getPersonalizedRecommendations, logRecommendationEvent } from "../lib/api";

const SESSION_KEY = "wv_analytics_session";

function getSessionId() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

function getRecentlyViewedIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const rows = JSON.parse(localStorage.getItem("wv_recently_viewed_products") || "[]");
    return new Set(Array.isArray(rows) ? rows.map((item) => String(item?._id || "")) : []);
  } catch {
    return new Set();
  }
}

export default function PersonalizedHomeSection({ limit = 6 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personalized, setPersonalized] = useState(false);
  const logged = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const sessionId = getSessionId();
        const data = await getPersonalizedRecommendations({ limit: Math.max(limit + 4, 10), sessionId });
        if (cancelled) return;

        const recentIds = getRecentlyViewedIds();
        const list = Array.isArray(data?.products) ? data.products : [];
        const filtered = list.filter((product) => !recentIds.has(String(product?._id || ""))).slice(0, limit);

        setProducts(filtered);
        setPersonalized(Boolean(data?.personalized));
      } catch (error) {
        if (!cancelled) {
          console.error("PERSONALIZED HOME ERROR:", error);
          setProducts([]);
          setPersonalized(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [limit]);

  useEffect(() => {
    if (!products.length || logged.current) return;
    logged.current = true;
    const sessionId = getSessionId();
    if (!sessionId) return;

    products.forEach((product, index) => {
      if (product?._id) {
        logRecommendationEvent({
          source: "personalized",
          productId: product._id,
          action: "impression",
          sessionId,
          position: index + 1,
        });
      }
    });
  }, [products]);

  if (!loading && !products.length) return null;

  return (
    <section className="personalized-home-section" aria-label="Personalized product recommendations">
      <div className="personalized-home-header">
        <div>
          <div className="personalized-home-title-row">
            <span className="personalized-home-icon"><Sparkles size={19} /></span>
            <h2>{personalized ? "Picked for You" : "Popular Picks for You"}</h2>
          </div>
          <p>
            {personalized
              ? "Selected from your recent shopping activity and product interests."
              : "A smart starting point while we learn what you like."}
          </p>
        </div>
        <span className="personalized-home-badge">AI PERSONALIZED</span>
      </div>

      <div className="personalized-home-grid">
        {loading
          ? Array.from({ length: Math.min(limit, 6) }).map((_, index) => (
              <div className="personalized-home-skeleton" key={index} />
            ))
          : products.map((product, index) => (
              <Link
                key={product._id}
                href={`/product/${product._id}`}
                className="personalized-home-link"
                onClick={() =>
                  logRecommendationEvent({
                    source: "personalized",
                    productId: product._id,
                    action: "click",
                    sessionId: getSessionId(),
                    position: index + 1,
                  })
                }
              >
                <article className="personalized-home-card">
                  <div className="personalized-home-image-wrap">
                    {product.image ? (
                      <img src={product.image} alt={product.name || "Product"} />
                    ) : (
                      <div className="personalized-home-no-image">No image</div>
                    )}
                  </div>
                  <div className="personalized-home-body">
                    <small>{product.category || "Product"}</small>
                    <h3>{product.name || "Product"}</h3>
                    <strong>₹{Number(product.price || 0).toLocaleString("en-IN")}</strong>
                    <span>
                      {Number(product.rating || 0).toFixed(1)} ★ · {Number(product.numReviews || 0)} reviews
                    </span>
                  </div>
                </article>
              </Link>
            ))}
      </div>

      <style jsx>{`
        .personalized-home-section {
          margin: 0 0 55px;
          padding: 26px;
          border: 1px solid rgba(34, 211, 238, 0.14);
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(8, 47, 73, 0.34), rgba(15, 23, 42, 0.58));
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.10);
        }
        .personalized-home-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }
        .personalized-home-title-row {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .personalized-home-title-row h2 {
          margin: 0;
          font-size: clamp(23px, 3vw, 30px);
          font-weight: 900;
          letter-spacing: -0.03em;
        }
        .personalized-home-icon {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          color: #67e8f9;
          background: rgba(34, 211, 238, 0.10);
        }
        .personalized-home-header p {
          margin: 7px 0 0 47px;
          opacity: 0.62;
          font-size: 13px;
        }
        .personalized-home-badge {
          flex: 0 0 auto;
          padding: 7px 10px;
          border: 1px solid rgba(103, 232, 249, 0.18);
          border-radius: 999px;
          color: #67e8f9;
          background: rgba(34, 211, 238, 0.06);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }
        .personalized-home-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 14px;
        }
        .personalized-home-link {
          color: inherit;
          text-decoration: none;
          min-width: 0;
        }
        .personalized-home-card {
          height: 100%;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 18px;
          background: rgba(255,255,255,.035);
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }
        .personalized-home-card:hover {
          transform: translateY(-4px);
          border-color: rgba(103,232,249,.24);
          background: rgba(255,255,255,.055);
        }
        .personalized-home-image-wrap {
          aspect-ratio: 1 / 1;
          background: rgba(255,255,255,.04);
          overflow: hidden;
        }
        .personalized-home-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .personalized-home-no-image {
          height: 100%;
          display: grid;
          place-items: center;
          opacity: .45;
          font-size: 12px;
        }
        .personalized-home-body {
          padding: 13px;
        }
        .personalized-home-body small {
          display: block;
          margin-bottom: 6px;
          color: #67e8f9;
          font-size: 10px;
          font-weight: 800;
        }
        .personalized-home-body h3 {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.35;
          min-height: 38px;
        }
        .personalized-home-body strong {
          display: block;
          font-size: 16px;
        }
        .personalized-home-body span {
          display: block;
          margin-top: 5px;
          opacity: .58;
          font-size: 10px;
        }
        .personalized-home-skeleton {
          aspect-ratio: .82 / 1;
          border-radius: 18px;
          background: linear-gradient(110deg, rgba(255,255,255,.035) 30%, rgba(255,255,255,.08) 45%, rgba(255,255,255,.035) 60%);
          background-size: 200% 100%;
          animation: personalized-shimmer 1.25s linear infinite;
        }
        @keyframes personalized-shimmer {
          to { background-position: -200% 0; }
        }
        @media (max-width: 1100px) {
          .personalized-home-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .personalized-home-section { padding: 20px; }
          .personalized-home-header { align-items: flex-start; flex-direction: column; }
          .personalized-home-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .personalized-home-badge { align-self: flex-start; }
        }
      `}</style>
    </section>
  );
}
