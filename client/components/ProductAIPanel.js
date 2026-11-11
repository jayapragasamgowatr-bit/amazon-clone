import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown, Check, Minus, Plus, Send, Sparkles, Star } from "lucide-react";
import toast from "react-hot-toast";

import { askAboutProduct, getProductReviewSummary } from "../lib/api";
import useCompareStore, { MAX_COMPARE } from "../store/compareStore";

// ============================================================
// PRODUCT AI PANEL
// ============================================================
// Shown on the product page:
//   1. "What customers say"  - AI summary of this product's reviews
//   2. "Ask about this product" - answers grounded in the listing
//   3. Add to compare
// ============================================================

const QUICK_QUESTIONS = [
  "What is this best used for?",
  "What are the key specifications?",
  "Is there anything I should know before buying?",
];

const SENTIMENT_LABEL = {
  positive: "Mostly positive",
  mixed: "Mixed opinions",
  negative: "Mostly critical",
};

function ReviewInsights({ productId, reviewCount }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);

    getProductReviewSummary(productId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        // The page works without the summary; the full reviews are still listed below.
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // Reload when a review is added or removed.
  }, [productId, reviewCount]);

  if (loading) {
    return (
      <div className="wvp-card" aria-busy="true">
        <div className="wvp-skeleton wvp-skeleton-title" />
        <div className="wvp-skeleton" />
        <div className="wvp-skeleton wvp-skeleton-short" />
      </div>
    );
  }

  if (!data?.available) return null;

  const total = Math.max(1, Number(data.reviewCount || 0));

  return (
    <div className="wvp-card">
      <div className="wvp-card-head">
        <div>
          <span className="wvp-eyebrow">
            <Sparkles size={13} /> {data.aiGenerated ? "AI review summary" : "Review snapshot"}
          </span>
          <h3>What customers say</h3>
        </div>
        <div className="wvp-score">
          <strong>{Number(data.rating || 0).toFixed(1)}</strong>
          <span>
            <Star size={13} /> {data.reviewCount} review{data.reviewCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <p className="wvp-summary">{data.summary}</p>

      {data.sentiment && (
        <span className={`wvp-sentiment wvp-${data.sentiment}`}>
          {SENTIMENT_LABEL[data.sentiment] || data.sentiment}
        </span>
      )}

      {(data.pros?.length > 0 || data.cons?.length > 0) && (
        <div className="wvp-columns">
          {data.pros?.length > 0 && (
            <div>
              <h4>Customers liked</h4>
              <ul>
                {data.pros.map((item) => (
                  <li key={item}><Check size={14} className="wvp-pro" /> {item}</li>
                ))}
              </ul>
            </div>
          )}
          {data.cons?.length > 0 && (
            <div>
              <h4>Worth knowing</h4>
              <ul>
                {data.cons.map((item) => (
                  <li key={item}><Minus size={14} className="wvp-con" /> {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {data.bestFor && (
        <p className="wvp-bestfor"><strong>Best for:</strong> {data.bestFor}</p>
      )}

      {Array.isArray(data.distribution) && (
        <div className="wvp-bars" aria-label="Rating breakdown">
          {data.distribution.map((row) => (
            <div className="wvp-bar-row" key={row.stars}>
              <span>{row.stars}★</span>
              <div className="wvp-bar"><i style={{ width: `${(row.count / total) * 100}%` }} /></div>
              <span>{row.count}</span>
            </div>
          ))}
        </div>
      )}

      {data.aiGenerated && (
        <p className="wvp-note">Summarised by AI from customer reviews. Read the full reviews below.</p>
      )}
    </div>
  );
}

function AskProduct({ productId }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    setAnswers([]);
    setQuestion("");
  }, [productId]);

  const ask = async (text) => {
    const value = String(text ?? "").trim();
    if (!value || loading) return;

    setLoading(true);
    setQuestion("");

    try {
      const data = await askAboutProduct(productId, value);
      setAnswers((previous) => [
        { question: value, answer: data?.answer || "No answer was returned." },
        ...previous,
      ].slice(0, 4));
    } catch (error) {
      setAnswers((previous) => [
        {
          question: value,
          error: true,
          answer:
            error?.message && /too many|quickly|wait/i.test(error.message)
              ? error.message
              : "The assistant is unavailable right now. Please try again shortly or contact support.",
        },
        ...previous,
      ].slice(0, 4));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wvp-card">
      <div className="wvp-card-head">
        <div>
          <span className="wvp-eyebrow"><Sparkles size={13} /> AI product expert</span>
          <h3>Ask about this product</h3>
        </div>
      </div>

      <form
        className="wvp-ask"
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. Does it work with a 3-inch pipeline?"
          aria-label="Your question about this product"
          maxLength={400}
        />
        <button type="submit" disabled={!question.trim() || loading}>
          {loading ? "Thinking…" : <>Ask <Send size={15} /></>}
        </button>
      </form>

      {answers.length === 0 && !loading && (
        <div className="wvp-chips">
          {QUICK_QUESTIONS.map((item) => (
            <button type="button" key={item} onClick={() => ask(item)}>{item}</button>
          ))}
        </div>
      )}

      <div className="wvp-answers" aria-live="polite">
        {loading && <div className="wvp-answer wvp-pending">Checking the product details…</div>}
        {answers.map((item, index) => (
          <div className={`wvp-answer${item.error ? " wvp-answer-error" : ""}`} key={`${item.question}-${index}`}>
            <strong>{item.question}</strong>
            <p>{item.answer}</p>
          </div>
        ))}
      </div>

      <p className="wvp-note">Answers use this listing and its reviews only. AI can make mistakes; check the specifications before ordering.</p>
    </div>
  );
}

function CompareBar({ product }) {
  const items = useCompareStore((state) => state.items);
  const toggle = useCompareStore((state) => state.toggle);
  const [mounted, setMounted] = useState(false);

  // The compare list lives in localStorage, so wait for the browser before reading it.
  useEffect(() => setMounted(true), []);

  const count = mounted ? items.length : 0;
  const selected = mounted && items.some((item) => item._id === product._id);

  const onToggle = () => {
    const result = toggle(product);
    if (result === "added") toast.success("Added to compare");
    if (result === "removed") toast.success("Removed from compare");
    if (result === "full") toast.error(`You can compare up to ${MAX_COMPARE} products`);
  };

  return (
    <div className="wvp-compare">
      <div>
        <strong><ArrowUpDown size={16} /> Not sure which one to pick?</strong>
        <span>Add products to compare and get a side-by-side view with an AI verdict.</span>
      </div>
      <div className="wvp-compare-actions">
        <button type="button" className={selected ? "wvp-selected" : ""} onClick={onToggle} aria-pressed={selected}>
          {selected ? <><Check size={15} /> In compare</> : <><Plus size={15} /> Add to compare</>}
        </button>
        {count > 0 && (
          <Link href="/compare" className="wvp-compare-link">
            Compare ({count}) <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ProductAIPanel({ product }) {
  if (!product?._id) return null;

  return (
    <section className="wvp-panel" aria-label="AI tools for this product">
      <CompareBar product={product} />

      <div className="wvp-grid">
        <AskProduct productId={product._id} />
        <ReviewInsights productId={product._id} reviewCount={product.reviews?.length || 0} />
      </div>

      <style jsx global>{`
        .wvp-panel { width: 100%; margin: 45px 0 0; display: grid; gap: 20px; color: #f8fafc; }
        .wvp-panel button::before { display: none; }
        .wvp-panel button:hover { transform: none; filter: none; box-shadow: none; }
        .wvp-panel button svg, .wvp-panel a svg { width: 15px; height: 15px; min-width: 0; min-height: 0; }
        .wvp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr)); gap: 20px; align-items: start; }
        .wvp-card { padding: 28px; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(14px); }
        .wvp-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
        .wvp-card-head h3 { margin: 6px 0 0; font-size: 20px; letter-spacing: -0.02em; }
        .wvp-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #67e8f9; }
        .wvp-score { text-align: right; flex: none; }
        .wvp-score strong { display: block; font-size: 30px; line-height: 1; font-variant-numeric: tabular-nums; }
        .wvp-score span { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; font-size: 12px; color: #94a3b8; }
        .wvp-score svg { color: #fbbf24; }
        .wvp-summary { margin: 0 0 14px; font-size: 15px; line-height: 1.65; color: #e2e8f0; }
        .wvp-sentiment { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .wvp-positive { background: rgba(74, 222, 128, 0.14); color: #86efac; }
        .wvp-mixed { background: rgba(251, 191, 36, 0.14); color: #fcd34d; }
        .wvp-negative { background: rgba(248, 113, 113, 0.14); color: #fca5a5; }
        .wvp-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 18px; margin-top: 18px; }
        .wvp-columns h4 { margin: 0 0 8px; font-size: 13px; color: #cbd5e1; }
        .wvp-columns ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 7px; }
        .wvp-columns li { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; line-height: 1.45; color: #e2e8f0; }
        .wvp-columns li svg { flex: none; margin-top: 3px; }
        .wvp-pro { color: #4ade80; }
        .wvp-con { color: #fbbf24; }
        .wvp-bestfor { margin: 16px 0 0; font-size: 14px; color: #cbd5e1; }
        .wvp-bars { display: grid; gap: 6px; margin-top: 18px; }
        .wvp-bar-row { display: grid; grid-template-columns: 28px 1fr 28px; align-items: center; gap: 10px; font-size: 12px; color: #94a3b8; font-variant-numeric: tabular-nums; }
        .wvp-bar-row span:last-child { text-align: right; }
        .wvp-bar { height: 6px; border-radius: 999px; background: rgba(148, 163, 184, 0.16); overflow: hidden; }
        .wvp-bar i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #06b6d4, #6366f1); }
        .wvp-note { margin: 16px 0 0; font-size: 12px; line-height: 1.5; color: #64748b; }
        .wvp-ask { display: flex; gap: 8px; }
        .wvp-ask input { flex: 1; min-width: 0; height: 46px; padding: 0 14px; border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 12px; background: rgba(2, 6, 23, 0.5); backdrop-filter: none; color: #fff; font: inherit; font-size: 14px; }
        .wvp-ask input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18); }
        .wvp-ask button { flex: none; height: 46px; padding: 0 18px; display: inline-flex; align-items: center; gap: 8px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; }
        .wvp-ask button:disabled { opacity: 0.45; cursor: not-allowed; }
        .wvp-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .wvp-chips button { padding: 8px 12px; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 999px; background: rgba(56, 189, 248, 0.08); color: #bae6fd; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
        .wvp-chips button:hover { background: rgba(56, 189, 248, 0.18); }
        .wvp-answers { display: grid; gap: 10px; margin-top: 14px; }
        .wvp-answers:empty { display: none; }
        .wvp-answer { padding: 14px 16px; border-radius: 14px; background: rgba(148, 163, 184, 0.1); }
        .wvp-answer strong { display: block; margin-bottom: 6px; font-size: 13px; color: #7dd3fc; }
        .wvp-answer p { margin: 0; font-size: 14px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; overflow-wrap: anywhere; }
        .wvp-answer-error { background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.28); }
        .wvp-answer-error p { color: #fecaca; }
        .wvp-pending { font-size: 14px; color: #94a3b8; }
        .wvp-compare { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px 24px; padding: 16px 20px; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(99, 102, 241, 0.12)); }
        .wvp-compare > div:first-child { display: grid; gap: 4px; min-width: 0; }
        .wvp-compare strong { display: inline-flex; align-items: center; gap: 8px; font-size: 15px; }
        .wvp-compare span { font-size: 13px; color: #94a3b8; }
        .wvp-compare-actions { display: flex; flex-wrap: wrap; gap: 10px; }
        .wvp-compare-actions button, .wvp-compare-link { height: 42px; padding: 0 16px; display: inline-flex; align-items: center; gap: 8px; border-radius: 12px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
        .wvp-compare-actions button { border: 1px solid rgba(148, 163, 184, 0.3); background: rgba(15, 23, 42, 0.7); color: #f8fafc; }
        .wvp-compare-actions button:hover { border-color: #38bdf8; }
        .wvp-compare-actions button.wvp-selected { border-color: rgba(74, 222, 128, 0.5); background: rgba(74, 222, 128, 0.12); color: #86efac; }
        .wvp-compare-link { background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; }
        .wvp-skeleton { height: 14px; margin-bottom: 12px; border-radius: 8px; background: linear-gradient(90deg, rgba(148, 163, 184, 0.1), rgba(148, 163, 184, 0.22), rgba(148, 163, 184, 0.1)); background-size: 200% 100%; animation: wvp-shimmer 1.4s linear infinite; }
        .wvp-skeleton-title { width: 45%; height: 20px; }
        .wvp-skeleton-short { width: 70%; }
        @keyframes wvp-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
        .wvp-panel button:focus-visible, .wvp-panel a:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
        @media (max-width: 520px) {
          .wvp-card { padding: 18px; }
          .wvp-ask { flex-direction: column; }
          .wvp-ask button { justify-content: center; }
        }
        @media (prefers-reduced-motion: reduce) { .wvp-skeleton { animation: none; } }
      `}</style>
    </section>
  );
}
