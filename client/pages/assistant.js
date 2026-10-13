import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Bot, User, ArrowRight, SlidersHorizontal, Gauge, Ruler, Wifi, Droplets, RefreshCw } from "lucide-react";
import { askShoppingAssistant } from "../lib/api";
import { getAssistantSuggestions } from "../lib/assistantSuggestions";

const STARTERS = [
  "I need a flow meter for a 3-inch water pipeline.",
  "Show me products under ₹20,000 for water monitoring.",
  "I need a product with cloud monitoring and IoT connectivity.",
  "Help me choose a sensor for tank level monitoring.",
];

const TECHNICAL_HINTS = [
  { icon: Ruler, label: "Pipeline size", text: "3-inch pipeline" },
  { icon: Gauge, label: "Application", text: "Water consumption" },
  { icon: Wifi, label: "Connectivity", text: "IoT / cloud" },
  { icon: Droplets, label: "Medium", text: "Water" },
];

function productImage(product) {
  return product?.images?.[0] || product?.image || "/file.svg";
}

function ProductResult({ product }) {
  const stock = Number(product?.countInStock || 0);
  return (
    <Link href={`/product/${product._id}`} className="assistant-product-card">
      <div className="assistant-product-image-wrap">
        <img src={productImage(product)} alt={product?.name || "Product"} className="assistant-product-image" />
        <span className={stock > 0 ? "assistant-stock good" : "assistant-stock bad"}>
          {stock > 0 ? `${stock} in stock` : "Out of stock"}
        </span>
      </div>
      <div className="assistant-product-body">
        <span className="assistant-category">{product?.category || "Product"}</span>
        <h3>{product?.name || "Product"}</h3>
        <div className="assistant-product-meta">
          <strong>₹{Number(product?.price || 0).toLocaleString("en-IN")}</strong>
          <span>★ {Number(product?.rating || 0).toFixed(1)} ({product?.numReviews || 0})</span>
        </div>
        <span className="assistant-view">View product <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}

export default function Assistant() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [lastProducts, setLastProducts] = useState([]);
  const [suggestions, setSuggestions] = useState(STARTERS);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [seenSuggestions, setSeenSuggestions] = useState([]);

  useEffect(() => {
    let active = true;

    getAssistantSuggestions()
      .then((data) => {
        const next = Array.isArray(data?.suggestions)
          ? data.suggestions.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
          : [];

        if (active && next.length) {
          setSuggestions(next);
          setSeenSuggestions(next);
        }
      })
      .catch(() => {
        // Keep the built-in starter questions if the suggestions API is unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshSuggestions = async (context = "", extraExclude = []) => {
    if (suggestionsLoading) return;
    setSuggestionsLoading(true);

    const exclude = [...new Set([
      ...seenSuggestions,
      ...suggestions,
      ...extraExclude,
    ].filter((item) => typeof item === "string" && item.trim()))].slice(-12);

    try {
      const data = await getAssistantSuggestions(exclude, context);
      const next = Array.isArray(data?.suggestions)
        ? data.suggestions.filter((item) => typeof item === "string" && item.trim()).slice(0, 4)
        : [];

      if (next.length) {
        setSuggestions(next);
        setSeenSuggestions((previous) => [...new Set([...previous, ...suggestions, ...extraExclude, ...next])].slice(-24));
      }
    } catch (_) {
      // Keep the current questions if dynamic suggestions cannot be loaded.
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const canSend = useMemo(() => q.trim().length > 0 && !loading, [q, loading]);

  const ask = async (message = q) => {
    const clean = message.trim();
    if (!clean || loading) return;

    setQ("");
    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: clean }]);

    try {
      const data = await askShoppingAssistant(clean);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data?.message || "I couldn't find a useful answer from the current catalogue.",
          model: data?.model,
        },
      ]);
      setLastProducts(Array.isArray(data?.products) ? data.products : []);
      refreshSuggestions(clean, [clean]);
    } catch (err) {
      const message = err?.message || "Assistant request failed. Please try again.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I couldn't reach the shopping assistant right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    ask();
  };

  return (
    <main className="assistant-page">
      <section className="assistant-shell">
        <div className="assistant-hero">
          <div className="assistant-hero-copy">
            <span className="assistant-badge"><Sparkles size={15} /> AI SHOPPING & TECHNICAL ASSISTANT</span>
            <h1>Tell us what you need.<br /><span>We'll help you find it.</span></h1>
            <p>
              Ask in normal language about products, budget, applications, pipeline size,
              connectivity, stock or technical requirements. The assistant uses your live catalogue
              to guide the search.
            </p>
          </div>
          <div className="assistant-orbit" aria-hidden="true">
            <div className="assistant-orbit-ring ring-one" />
            <div className="assistant-orbit-ring ring-two" />
            <div className="assistant-orbit-core"><Bot size={48} /></div>
            <span className="assistant-orbit-dot dot-one" />
            <span className="assistant-orbit-dot dot-two" />
            <span className="assistant-orbit-dot dot-three" />
          </div>
        </div>

        <div className="assistant-layout">
          <aside className="assistant-sidebar">
            <div className="assistant-side-card">
              <div className="assistant-suggestions-heading">
                <div className="assistant-side-title"><Sparkles size={18} /> Suggested questions</div>
                <button
                  type="button"
                  className="assistant-suggestion-refresh"
                  onClick={() => refreshSuggestions(messages.filter((item) => item.role === "user").slice(-1)[0]?.text || "")}
                  disabled={suggestionsLoading || loading}
                  aria-label="Refresh suggested questions"
                  title="Refresh suggested questions"
                >
                  <RefreshCw size={15} className={suggestionsLoading ? "assistant-refresh-spin" : ""} />
                  <span>{suggestionsLoading ? "Updating" : "Refresh"}</span>
                </button>
              </div>
              <div className="assistant-starters">
                {suggestions.map((starter, index) => (
                  <button key={`${starter}-${index}`} type="button" onClick={() => ask(starter)} disabled={loading}>
                    {starter}
                  </button>
                ))}
              </div>
            </div>

            <div className="assistant-side-card">
              <div className="assistant-side-title">Technical context</div>
              <p className="assistant-side-note">Include any of these details when they matter.</p>
              <div className="assistant-hints">
                {TECHNICAL_HINTS.map(({ icon: Icon, label, text }) => (
                  <div key={label} className="assistant-hint">
                    <span><Icon size={16} /></span>
                    <div><b>{label}</b><small>{text}</small></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="assistant-chat-card">
            <div className="assistant-chat-head">
              <div>
                <span className="assistant-live-dot" /> Live catalogue assistant
              </div>
              <span className="assistant-safe-label">Catalogue-grounded answers</span>
            </div>

            <div className="assistant-messages">
              {messages.length === 0 && (
                <div className="assistant-empty">
                  <div className="assistant-empty-icon"><Bot size={30} /></div>
                  <h2>What are you looking for?</h2>
                  <p>
                    For example: “I need a flow meter for a 3-inch pipeline with cloud monitoring.”
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`assistant-message ${message.role}`}>
                  <div className="assistant-message-avatar">
                    {message.role === "user" ? <User size={17} /> : <Bot size={17} />}
                  </div>
                  <div className="assistant-message-bubble">
                    <p>{message.text}</p>
                    {message.model && <small>{message.model}</small>}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="assistant-message assistant">
                  <div className="assistant-message-avatar"><Bot size={17} /></div>
                  <div className="assistant-message-bubble assistant-thinking">
                    <span /><span /><span />
                    <em>Checking the live catalogue…</em>
                  </div>
                </div>
              )}
            </div>

            {lastProducts.length > 0 && (
              <div className="assistant-results">
                <div className="assistant-results-head">
                  <div>
                    <span className="assistant-results-kicker">LIVE CATALOGUE</span>
                    <h2>Products that may fit your request</h2>
                  </div>
                  <span>{Math.min(lastProducts.length, 6)} matches</span>
                </div>
                <div className="assistant-product-grid">
                  {lastProducts.slice(0, 6).map((product) => <ProductResult key={product._id} product={product} />)}
                </div>
              </div>
            )}

            {error && <div className="assistant-error">{error}</div>}

            <form className="assistant-composer" onSubmit={submit}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask about a product, budget, application or technical requirement…"
                aria-label="Ask the Waventra Vetric AI assistant"
              />
              <button type="submit" disabled={!canSend} aria-label="Send question">
                <Send size={18} />
                <span>{loading ? "Thinking" : "Ask AI"}</span>
              </button>
            </form>
            <p className="assistant-disclaimer">Product facts, prices and stock are based on the current catalogue. Always verify critical technical requirements before purchase.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
