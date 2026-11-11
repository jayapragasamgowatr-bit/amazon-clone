import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, Search, Sparkles, Star } from "lucide-react";

import SEO from "../components/SEO";
import { smartProductSearch } from "../lib/api";

// ============================================================
// SMART SEARCH
// ============================================================
// Describe what you need in your own words. The server asks the
// AI to turn the phrase into filters (keywords, category, budget,
// stock) and then runs them against the live catalogue. If the AI
// is unavailable the same search still works on keywords.
// ============================================================

const EXAMPLES = [
  "Flow meter for a 3-inch water pipeline",
  "Something to monitor my overhead tank level",
  "IoT sensor under ₹20,000 in stock",
  "Top rated water quality sensor",
];

const SORT_LABEL = {
  price_asc: "Lowest price first",
  price_desc: "Highest price first",
  rating: "Top rated first",
};

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function understoodChips(plan) {
  if (!plan) return [];
  const chips = [];
  if (plan.category) chips.push(`Category: ${plan.category}`);
  if (plan.minPrice !== null && plan.maxPrice !== null) {
    chips.push(`${formatPrice(plan.minPrice)} – ${formatPrice(plan.maxPrice)}`);
  } else if (plan.maxPrice !== null && plan.maxPrice !== undefined) {
    chips.push(`Up to ${formatPrice(plan.maxPrice)}`);
  } else if (plan.minPrice !== null && plan.minPrice !== undefined) {
    chips.push(`From ${formatPrice(plan.minPrice)}`);
  }
  if (plan.inStockOnly) chips.push("In stock only");
  if (SORT_LABEL[plan.sort]) chips.push(SORT_LABEL[plan.sort]);
  (plan.keywords || []).slice(0, 6).forEach((word) => chips.push(word));
  return chips;
}

export default function SmartSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef(0);

  const run = async (text) => {
    const value = String(text ?? "").trim();
    if (!value) return;

    const requestId = ++requestRef.current;
    setSubmitted(value);
    setLoading(true);
    setError("");

    try {
      const result = await smartProductSearch(value);
      // Ignore answers to an older search that arrive late.
      if (requestId === requestRef.current) setData(result);
    } catch (err) {
      if (requestId === requestRef.current) {
        setData(null);
        setError(err?.message || "Search is unavailable right now. Please try again.");
      }
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  // Support links such as /semantic-search?q=flow+meter
  useEffect(() => {
    if (!router.isReady) return;
    const initial = typeof router.query.q === "string" ? router.query.q.trim() : "";
    if (initial) {
      setQuery(initial);
      run(initial);
    }
    // Run once when the router is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const submit = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    router.replace({ pathname: "/semantic-search", query: { q: value } }, undefined, { shallow: true });
    run(value);
  };

  const results = data?.results || [];
  const chips = understoodChips(data?.interpretation);

  return (
    <>
      <SEO
        title="Smart search | Waventra Vetric"
        description="Describe what you need and let AI find matching products in the Waventra Vetric catalogue."
        path="/semantic-search"
      />

      <div className="wvs-page">
        <div className="wvs-hero">
          <span className="wvs-eyebrow"><Sparkles size={13} /> AI smart search</span>
          <h1>Describe what you need</h1>
          <p>Search by application, specification or budget in plain language. No exact product names required.</p>
        </div>

        <form className="wvs-form" onSubmit={submit} role="search">
          <Search size={20} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. sensor to monitor water flow in a 3-inch pipe under ₹25,000"
            aria-label="Describe the product you need"
            maxLength={200}
          />
          <button type="submit" disabled={loading || !query.trim()}>
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {!submitted && (
          <div className="wvs-examples">
            <span>Try:</span>
            {EXAMPLES.map((example) => (
              <button
                type="button"
                key={example}
                onClick={() => {
                  setQuery(example);
                  run(example);
                }}
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {error && <div className="wvs-error" role="alert">{error}</div>}

        {submitted && !error && (
          <div className="wvs-result-head" aria-live="polite">
            <h2>
              {loading
                ? "Searching the catalogue…"
                : results.length
                  ? `${results.length} matching product${results.length === 1 ? "" : "s"}`
                  : "No matching products"}
            </h2>
            {!loading && chips.length > 0 && (
              <div className="wvs-understood">
                <span>{data?.aiUsed ? "AI understood:" : "Searching for:"}</span>
                {chips.map((chip) => (
                  <em key={chip}>{chip}</em>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="wvs-grid" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => <div className="wvs-card wvs-skeleton" key={index} />)}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="wvs-grid">
            {results.map((product) => {
              const image = product.images?.[0] || product.image;
              const inStock = Number(product.countInStock) > 0;
              return (
                <Link href={`/product/${product._id}`} className="wvs-card" key={product._id}>
                  <span className="wvs-image">{image && <img src={image} alt="" loading="lazy" />}</span>
                  <span className="wvs-info">
                    <small>{product.category || "Product"}</small>
                    <strong>{product.name}</strong>
                    <span className="wvs-meta">
                      <b>{formatPrice(product.price)}</b>
                      {Number(product.numReviews) > 0 && (
                        <span><Star size={13} /> {Number(product.rating || 0).toFixed(1)}</span>
                      )}
                    </span>
                    <span className={inStock ? "wvs-in" : "wvs-out"}>{inStock ? "In stock" : "Out of stock"}</span>
                  </span>
                  <span className="wvs-view">View product <ArrowRight size={15} /></span>
                </Link>
              );
            })}
          </div>
        )}

        {submitted && !loading && !error && results.length === 0 && (
          <div className="wvs-empty">
            <p>
              Nothing in the catalogue matched &ldquo;{submitted}&rdquo;. Try describing the application
              or product type in different words, or remove the budget.
            </p>
            <Link href="/products">Browse all products <ArrowRight size={15} /></Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        .wvs-page { width: min(1240px, calc(100% - 40px)); margin: 0 auto; padding: 56px 0 96px; color: #f8fafc; }
        .wvs-page button::before { display: none; }
        .wvs-page button:hover { transform: none; filter: none; box-shadow: none; }
        .wvs-page button svg, .wvs-page a svg { width: 15px; height: 15px; min-width: 0; min-height: 0; }
        .wvs-hero { max-width: 760px; margin: 0 auto 28px; text-align: center; }
        .wvs-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #67e8f9; }
        .wvs-hero h1 { margin: 12px 0 10px; font-size: clamp(32px, 5vw, 46px); letter-spacing: -0.03em; text-wrap: balance; }
        .wvs-hero p { margin: 0; font-size: 16px; line-height: 1.6; color: #94a3b8; }
        .wvs-form { display: flex; align-items: center; gap: 10px; max-width: 880px; margin: 0 auto 16px; padding: 8px 8px 8px 18px; border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 18px; background: rgba(11, 18, 40, 0.9); color: #64748b; box-shadow: 0 24px 60px rgba(2, 6, 23, 0.4); }
        .wvs-form:focus-within { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18), 0 24px 60px rgba(2, 6, 23, 0.4); }
        .wvs-form > svg { flex: none; }
        .wvs-form input { flex: 1; min-width: 0; width: auto; height: 48px; padding: 0; border: 0; border-radius: 0; background: transparent; backdrop-filter: none; box-shadow: none; color: #fff; font: inherit; font-size: 16px; outline: none; }
        .wvs-form input:focus { box-shadow: none; }
        .wvs-form button { flex: none; height: 48px; padding: 0 24px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; font: inherit; font-size: 15px; font-weight: 800; cursor: pointer; }
        .wvs-form button:disabled { opacity: 0.45; cursor: not-allowed; }
        .wvs-examples { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; max-width: 880px; margin: 0 auto 40px; font-size: 13px; color: #64748b; }
        .wvs-examples button { padding: 8px 12px; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 999px; background: rgba(56, 189, 248, 0.08); color: #bae6fd; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .wvs-examples button:hover { background: rgba(56, 189, 248, 0.18); }
        .wvs-error { max-width: 880px; margin: 0 auto 24px; padding: 14px 16px; border: 1px solid rgba(248, 113, 113, 0.35); border-radius: 14px; background: rgba(248, 113, 113, 0.1); color: #fecaca; font-size: 14px; }
        .wvs-result-head { margin: 36px 0 18px; display: grid; gap: 10px; }
        .wvs-result-head h2 { margin: 0; font-size: 22px; letter-spacing: -0.02em; }
        .wvs-understood { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 13px; color: #94a3b8; }
        .wvs-understood em { padding: 4px 10px; border-radius: 999px; background: rgba(148, 163, 184, 0.14); color: #e2e8f0; font-style: normal; font-weight: 600; }
        .wvs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }
        .wvs-card { display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 20px; background: rgba(11, 18, 40, 0.85); color: #f8fafc; transition: transform 0.2s ease, border-color 0.2s ease; }
        .wvs-card:hover { transform: translateY(-3px); border-color: rgba(56, 189, 248, 0.55); }
        .wvs-image { display: grid; place-items: center; aspect-ratio: 4 / 3; background: #fff; overflow: hidden; }
        .wvs-image img { width: 100%; height: 100%; object-fit: contain; }
        .wvs-info { flex: 1; display: grid; align-content: start; gap: 6px; padding: 16px 16px 8px; }
        .wvs-info small { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #67e8f9; }
        .wvs-info strong { font-size: 15px; line-height: 1.4; }
        .wvs-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 4px; font-variant-numeric: tabular-nums; }
        .wvs-meta b { font-size: 18px; }
        .wvs-meta span { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #cbd5e1; }
        .wvs-meta svg { color: #fbbf24; }
        .wvs-in { font-size: 12px; font-weight: 600; color: #4ade80; }
        .wvs-out { font-size: 12px; font-weight: 600; color: #f87171; }
        .wvs-view { display: flex; align-items: center; justify-content: space-between; margin: 8px 16px 16px; padding-top: 12px; border-top: 1px solid rgba(148, 163, 184, 0.14); font-size: 13px; font-weight: 700; color: #7dd3fc; }
        .wvs-skeleton { height: 300px; background: linear-gradient(90deg, rgba(148, 163, 184, 0.08), rgba(148, 163, 184, 0.18), rgba(148, 163, 184, 0.08)); background-size: 200% 100%; animation: wvs-shimmer 1.4s linear infinite; }
        @keyframes wvs-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        .wvs-empty { padding: 48px 24px; border: 1px dashed rgba(148, 163, 184, 0.28); border-radius: 24px; text-align: center; color: #94a3b8; }
        .wvs-empty p { max-width: 520px; margin: 0 auto 18px; line-height: 1.6; }
        .wvs-empty a { display: inline-flex; align-items: center; gap: 8px; color: #7dd3fc; font-weight: 700; }
        .wvs-page button:focus-visible, .wvs-page a:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
        @media (max-width: 560px) {
          .wvs-page { width: calc(100% - 24px); padding-top: 32px; }
          .wvs-form { flex-wrap: wrap; padding: 10px; }
          .wvs-form > svg { display: none; }
          .wvs-form input { flex-basis: 100%; padding: 0 8px; }
          .wvs-form button { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wvs-skeleton { animation: none; }
          .wvs-card { transition: none; }
        }
      `}</style>
    </>
  );
}
