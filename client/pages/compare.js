import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Plus, Search, Sparkles, Star, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

import SEO from "../components/SEO";
import { compareProductsWithAI, getProductSuggestions } from "../lib/api";
import useCompareStore, { MAX_COMPARE } from "../store/compareStore";

// ============================================================
// COMPARE PRODUCTS
// ============================================================
// Side-by-side table built from live catalogue data, plus an AI
// verdict that explains the differences and who each product suits.
// ============================================================

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatLabel = (key) =>
  String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());

function AddProduct({ onAdd, disabled }) {
  const [term, setTerm] = useState("");
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const value = term.trim();
    if (value.length < 2) {
      setOptions([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      getProductSuggestions(value)
        .then((data) => setOptions(Array.isArray(data) ? data.slice(0, 6) : []))
        .catch(() => setOptions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [term]);

  return (
    <div className="wvx-add">
      <label className="wvx-add-field">
        <Search size={17} />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={disabled ? `You can compare up to ${MAX_COMPARE} products` : "Add a product by name"}
          aria-label="Search for a product to add"
          disabled={disabled}
        />
      </label>
      {options.length > 0 && (
        <ul className="wvx-add-list">
          {options.map((option) => (
            <li key={option._id}>
              <button
                type="button"
                onClick={() => {
                  onAdd(option);
                  setTerm("");
                  setOptions([]);
                }}
              >
                <Plus size={15} /> {option.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ComparePage() {
  const items = useCompareStore((state) => state.items);
  const toggle = useCompareStore((state) => state.toggle);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [need, setNeed] = useState("");
  const [submittedNeed, setSubmittedNeed] = useState("");

  useEffect(() => setMounted(true), []);

  const ids = useMemo(() => (mounted ? items.map((item) => item._id) : []), [items, mounted]);
  const idsKey = ids.join(",");

  useEffect(() => {
    if (ids.length < 2) {
      setData(null);
      setError("");
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError("");

    compareProductsWithAI(ids, submittedNeed)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) {
          setData(null);
          setError(err?.message || "The comparison could not be loaded. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // idsKey stands in for the ids array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, submittedNeed]);

  const addProduct = (product) => {
    if (items.some((item) => item._id === product._id)) {
      toast("That product is already in your comparison");
      return;
    }
    if (toggle(product) === "full") {
      toast.error(`You can compare up to ${MAX_COMPARE} products`);
    }
  };

  const products = data?.products || [];
  const insight = data?.insight || null;
  const specKeys = data?.specificationKeys || [];
  const reasonFor = (id) => insight?.bestFor?.find((item) => item.productId === id)?.reason || "";

  const rows = [
    { label: "Price", render: (product) => <strong className="wvx-price">{formatPrice(product.price)}</strong> },
    {
      label: "Availability",
      render: (product) =>
        Number(product.countInStock) > 0 ? (
          <span className="wvx-in">In stock ({product.countInStock})</span>
        ) : (
          <span className="wvx-out">Out of stock</span>
        ),
    },
    {
      label: "Rating",
      render: (product) =>
        Number(product.numReviews) > 0 ? (
          <span className="wvx-rating"><Star size={14} /> {Number(product.rating || 0).toFixed(1)} ({product.numReviews})</span>
        ) : (
          <span className="wvx-muted">No reviews yet</span>
        ),
    },
    { label: "Category", render: (product) => product.category || <span className="wvx-muted">—</span> },
    ...specKeys.map((key) => ({
      label: formatLabel(key),
      render: (product) => product.specifications?.[key] ?? <span className="wvx-muted">—</span>,
    })),
    {
      label: "Features",
      render: (product) =>
        product.features?.length ? (
          <ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        ) : (
          <span className="wvx-muted">—</span>
        ),
    },
    {
      label: "Applications",
      render: (product) =>
        product.applications?.length ? (
          <ul>{product.applications.map((item) => <li key={item}>{item}</li>)}</ul>
        ) : (
          <span className="wvx-muted">—</span>
        ),
    },
  ];

  return (
    <>
      <SEO
        title="Compare products | Waventra Vetric"
        description="Compare products side by side and get an AI summary of the differences."
        path="/compare"
      />

      <div className="wvx-page">
        <div className="wvx-hero">
          <span className="wvx-eyebrow"><Sparkles size={13} /> AI comparison</span>
          <h1>Compare products</h1>
          <p>See prices, stock and specifications side by side, with a plain-language summary of how they differ.</p>
        </div>

        <div className="wvx-toolbar">
          <AddProduct onAdd={addProduct} disabled={ids.length >= MAX_COMPARE} />
          {ids.length > 0 && (
            <button type="button" className="wvx-ghost" onClick={clear}>
              <Trash2 size={15} /> Clear all
            </button>
          )}
        </div>

        {mounted && ids.length > 0 && (
          <div className="wvx-selected">
            {items.map((item) => (
              <span key={item._id} className="wvx-chip">
                {item.name}
                <button type="button" onClick={() => remove(item._id)} aria-label={`Remove ${item.name}`}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {mounted && ids.length < 2 && (
          <div className="wvx-empty">
            <h2>{ids.length === 0 ? "Nothing to compare yet" : "Add one more product"}</h2>
            <p>
              Pick at least two products. Use the search box above, or open any product and choose
              &ldquo;Add to compare&rdquo;.
            </p>
            <Link href="/products" className="wvx-primary">
              Browse products <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {error && <div className="wvx-error" role="alert">{error}</div>}

        {ids.length >= 2 && loading && !data && (
          <div className="wvx-loading" aria-busy="true">Comparing products…</div>
        )}

        {products.length >= 2 && (
          <>
            <section className="wvx-verdict" aria-live="polite">
              <div className="wvx-verdict-head">
                <span className="wvx-eyebrow"><Sparkles size={13} /> AI verdict</span>
                {loading && <span className="wvx-muted">Updating…</span>}
              </div>

              {insight ? (
                <>
                  <p className="wvx-verdict-text">{insight.verdict}</p>
                  {insight.keyDifferences?.length > 0 && (
                    <ul className="wvx-differences">
                      {insight.keyDifferences.map((item) => (
                        <li key={item}><Check size={15} /> {item}</li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <p className="wvx-muted">
                  The AI summary is unavailable right now. The table below is taken straight from the catalogue.
                </p>
              )}

              <form
                className="wvx-need"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubmittedNeed(need.trim());
                }}
              >
                <input
                  value={need}
                  onChange={(event) => setNeed(event.target.value)}
                  placeholder="Tell us what you need it for, e.g. monitoring a 3-inch water line"
                  aria-label="What do you need the product for?"
                  maxLength={300}
                />
                <button type="submit" disabled={loading || need.trim() === submittedNeed}>
                  Recommend for me
                </button>
              </form>
              <p className="wvx-note">AI can make mistakes. Prices, stock and specifications in the table come directly from our catalogue.</p>
            </section>

            <div className="wvx-table-wrap">
              <table className="wvx-table">
                <thead>
                  <tr>
                    <th scope="col"><span className="wvx-sr">Attribute</span></th>
                    {products.map((product) => (
                      <th scope="col" key={product._id} className={insight?.recommendedId === product._id ? "wvx-recommended" : ""}>
                        {insight?.recommendedId === product._id && <span className="wvx-badge">Best match for you</span>}
                        <Link href={`/product/${product._id}`} className="wvx-product">
                          <span className="wvx-thumb">
                            {(product.images?.[0] || product.image) && (
                              <img src={product.images?.[0] || product.image} alt="" loading="lazy" />
                            )}
                          </span>
                          <span className="wvx-name">{product.name}</span>
                        </Link>
                        {reasonFor(product._id) && <p className="wvx-reason">{reasonFor(product._id)}</p>}
                        <button type="button" className="wvx-remove" onClick={() => remove(product._id)}>
                          <X size={13} /> Remove
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {products.map((product) => (
                        <td key={product._id} className={insight?.recommendedId === product._id ? "wvx-recommended" : ""}>
                          {row.render(product)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row"><span className="wvx-sr">Actions</span></th>
                    {products.map((product) => (
                      <td key={product._id} className={insight?.recommendedId === product._id ? "wvx-recommended" : ""}>
                        <Link href={`/product/${product._id}`} className="wvx-primary wvx-small">
                          View product <ArrowRight size={15} />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        .wvx-page { width: min(1280px, calc(100% - 40px)); margin: 0 auto; padding: 48px 0 96px; color: #f8fafc; }
        .wvx-page button::before { display: none; }
        .wvx-page button:hover { transform: none; filter: none; box-shadow: none; }
        .wvx-page button svg, .wvx-page a svg { width: 15px; height: 15px; min-width: 0; min-height: 0; }
        .wvx-hero { max-width: 720px; margin-bottom: 28px; }
        .wvx-hero h1 { margin: 10px 0 8px; font-size: clamp(32px, 5vw, 44px); letter-spacing: -0.03em; text-wrap: balance; }
        .wvx-hero p { margin: 0; font-size: 16px; line-height: 1.6; color: #94a3b8; }
        .wvx-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #67e8f9; }
        .wvx-toolbar { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .wvx-add { position: relative; flex: 1; min-width: min(100%, 280px); max-width: 520px; }
        .wvx-add-field { display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px; border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 14px; background: rgba(11, 18, 40, 0.8); color: #94a3b8; }
        .wvx-add-field:focus-within { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18); }
        .wvx-add-field input { flex: 1; min-width: 0; width: auto; padding: 0; border: 0; border-radius: 0; background: transparent; backdrop-filter: none; box-shadow: none; color: #fff; font: inherit; font-size: 15px; outline: none; }
        .wvx-add-field input:focus { box-shadow: none; }
        .wvx-add-list { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 20; margin: 0; padding: 6px; list-style: none; border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 14px; background: #0b1228; box-shadow: 0 20px 50px rgba(2, 6, 23, 0.6); }
        .wvx-add-list button { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 0; border-radius: 10px; background: transparent; color: #f8fafc; font: inherit; font-size: 14px; font-weight: 500; text-align: left; cursor: pointer; }
        .wvx-add-list button:hover { background: rgba(56, 189, 248, 0.12); }
        .wvx-ghost { height: 48px; padding: 0 16px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 14px; background: transparent; color: #cbd5e1; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
        .wvx-ghost:hover { border-color: #f87171; color: #fca5a5; }
        .wvx-selected { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
        .wvx-chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 6px 6px 6px 12px; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 999px; background: rgba(148, 163, 184, 0.1); font-size: 13px; font-weight: 600; }
        .wvx-chip button { width: 24px; height: 24px; flex: none; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: rgba(148, 163, 184, 0.18); color: #e2e8f0; cursor: pointer; }
        .wvx-chip button:hover { background: rgba(248, 113, 113, 0.3); }
        .wvx-empty, .wvx-loading { padding: 56px 24px; border: 1px dashed rgba(148, 163, 184, 0.28); border-radius: 24px; text-align: center; color: #94a3b8; }
        .wvx-empty h2 { margin: 0 0 8px; font-size: 22px; }
        .wvx-empty p { max-width: 460px; margin: 0 auto 22px; line-height: 1.6; }
        .wvx-primary { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 20px; border-radius: 12px; background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; font-size: 14px; font-weight: 800; }
        .wvx-primary.wvx-small { height: 40px; padding: 0 14px; font-size: 13px; }
        .wvx-error { margin-bottom: 20px; padding: 14px 16px; border: 1px solid rgba(248, 113, 113, 0.35); border-radius: 14px; background: rgba(248, 113, 113, 0.1); color: #fecaca; font-size: 14px; }
        .wvx-verdict { margin-bottom: 24px; padding: 24px; border: 1px solid rgba(99, 102, 241, 0.32); border-radius: 24px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(99, 102, 241, 0.12)); }
        .wvx-verdict-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .wvx-verdict-text { margin: 0 0 14px; font-size: 17px; line-height: 1.65; max-width: 75ch; }
        .wvx-differences { margin: 0 0 18px; padding: 0; list-style: none; display: grid; gap: 8px; }
        .wvx-differences li { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.5; color: #e2e8f0; }
        .wvx-differences svg { flex: none; margin-top: 3px; color: #4ade80; }
        .wvx-need { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
        .wvx-need input { flex: 1; min-width: min(100%, 240px); width: auto; height: 46px; padding: 0 14px; border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; background: rgba(2, 6, 23, 0.5); backdrop-filter: none; color: #fff; font: inherit; font-size: 14px; }
        .wvx-need input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18); }
        .wvx-need button { height: 46px; padding: 0 18px; border: 0; border-radius: 12px; background: #f8fafc; color: #0f172a; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
        .wvx-need button:disabled { opacity: 0.45; cursor: not-allowed; }
        .wvx-note { margin: 12px 0 0; font-size: 12px; color: #64748b; }
        .wvx-muted { color: #64748b; }
        .wvx-table-wrap { overflow-x: auto; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 24px; background: rgba(11, 18, 40, 0.82); }
        .wvx-table { width: 100%; min-width: 640px; border-collapse: collapse; table-layout: fixed; font-size: 14px; }
        .wvx-table th, .wvx-table td { padding: 16px 18px; border-bottom: 1px solid rgba(148, 163, 184, 0.12); text-align: left; vertical-align: top; line-height: 1.5; overflow-wrap: anywhere; }
        .wvx-table tbody tr:last-child th, .wvx-table tbody tr:last-child td { border-bottom: 0; }
        .wvx-table th[scope="row"], .wvx-table thead th:first-child { width: 150px; position: sticky; left: 0; z-index: 1; background: #0d1530; color: #94a3b8; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .wvx-table thead th { font-weight: 600; }
        .wvx-table .wvx-recommended { background: rgba(56, 189, 248, 0.07); }
        .wvx-badge { display: inline-block; margin-bottom: 10px; padding: 4px 10px; border-radius: 999px; background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; font-size: 11px; font-weight: 800; }
        .wvx-product { display: grid; gap: 10px; color: #f8fafc; }
        .wvx-thumb { display: grid; place-items: center; width: 100%; max-width: 200px; aspect-ratio: 4 / 3; overflow: hidden; border-radius: 14px; background: #fff; }
        .wvx-thumb img { width: 100%; height: 100%; object-fit: contain; }
        .wvx-name { font-size: 15px; font-weight: 800; line-height: 1.35; }
        .wvx-product:hover .wvx-name { color: #7dd3fc; }
        .wvx-reason { margin: 8px 0 0; font-size: 13px; font-weight: 400; color: #cbd5e1; }
        .wvx-remove { margin-top: 10px; padding: 0; display: inline-flex; align-items: center; gap: 4px; border: 0; background: none; color: #94a3b8; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
        .wvx-remove:hover { color: #fca5a5; }
        .wvx-price { font-size: 18px; font-variant-numeric: tabular-nums; }
        .wvx-in { color: #4ade80; font-weight: 600; }
        .wvx-out { color: #f87171; font-weight: 600; }
        .wvx-rating { display: inline-flex; align-items: center; gap: 5px; font-variant-numeric: tabular-nums; }
        .wvx-rating svg { color: #fbbf24; }
        .wvx-table ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; }
        .wvx-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .wvx-page button:focus-visible, .wvx-page a:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
        @media (max-width: 640px) {
          .wvx-page { width: calc(100% - 24px); padding-top: 28px; }
          .wvx-verdict { padding: 18px; }
          .wvx-table th[scope="row"], .wvx-table thead th:first-child { width: 110px; }
        }
      `}</style>
    </>
  );
}
