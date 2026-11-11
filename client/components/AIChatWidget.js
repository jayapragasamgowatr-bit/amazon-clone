import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, Send, Sparkles, Trash2, X } from "lucide-react";

import { sendAiChat } from "../lib/api";

// ============================================================
// VETRA — site-wide AI shopping concierge
// ============================================================
// A floating chat that follows the shopper around the store.
// It remembers the conversation for the browser tab, knows which
// product page is open, and answers from the live catalogue.
// ============================================================

const STORAGE_KEY = "wv_ai_chat_v1";
const MAX_SAVED_MESSAGES = 30;

// Pages where the widget would get in the way or duplicate a full-page tool.
const HIDDEN_ON = ["/assistant", "/ai-support", "/checkout", "/login", "/register", "/signup"];

const DEFAULT_STARTERS = [
  "Help me choose a flow meter",
  "What's popular right now?",
  "Where is my latest order?",
];

const PRODUCT_STARTERS = [
  "Is this right for my application?",
  "What are the key specifications?",
  "Show me similar products",
];

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getSessionId = () => {
  try {
    return localStorage.getItem("wv_analytics_session") || "";
  } catch {
    return "";
  }
};

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v5" />
    </svg>
  );
}

function ChatProduct({ product, onNavigate }) {
  const image = product?.images?.[0] || product?.image;
  const inStock = Number(product?.countInStock || 0) > 0;

  return (
    <Link href={`/product/${product._id}`} className="wvc-product" onClick={onNavigate}>
      <span className="wvc-product-thumb">
        {image ? <img src={image} alt="" loading="lazy" /> : <Sparkles size={16} />}
      </span>
      <span className="wvc-product-text">
        <strong>{product.name}</strong>
        <span>
          {formatPrice(product.price)}
          <i className={inStock ? "wvc-in" : "wvc-out"}>{inStock ? "In stock" : "Out of stock"}</i>
        </span>
      </span>
      <ArrowRight size={15} />
    </Link>
  );
}

export default function AIChatWidget() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const hidden =
    router.pathname.startsWith("/admin") || HIDDEN_ON.includes(router.pathname);

  const productId =
    router.pathname === "/product/[id]" && typeof router.query.id === "string"
      ? router.query.id
      : "";

  // Restore the conversation for this browser tab.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) {
        setMessages(saved.filter((item) => item && typeof item.text === "string"));
      }
    } catch {
      // Storage can be unavailable (private mode); the chat still works in memory.
    }
    setVoiceSupported(
      typeof window !== "undefined" &&
        Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES))
      );
    } catch {
      // ignore
    }
  }, [messages, ready]);

  // Keep the newest message in view.
  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
    },
    []
  );

  const send = useCallback(
    async (text) => {
      const message = String(text ?? "").trim();
      if (!message || loading) return;

      const history = messages
        .filter((item) => !item.error)
        .slice(-8)
        .map((item) => ({ role: item.role, text: item.text }));

      setInput("");
      setLoading(true);
      setMessages((previous) => [...previous, { role: "user", text: message }]);

      try {
        const data = await sendAiChat({
          message,
          history,
          productId,
          page: router.asPath?.split("?")[0] || "/",
          sessionId: getSessionId(),
        });

        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            text: data?.message || "I couldn't find an answer to that just now.",
            products: Array.isArray(data?.products) ? data.products : [],
            followUps: Array.isArray(data?.followUps) ? data.followUps : [],
          },
        ]);
      } catch (error) {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            error: true,
            text:
              error?.message && /too many|quickly|wait/i.test(error.message)
                ? error.message
                : "I can't reach the assistant right now. Please try again in a moment, or use the search bar at the top.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, productId, router.asPath]
  );

  const submit = (event) => {
    event.preventDefault();
    send(input);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    try {
      const recognition = new Recognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        if (transcript) setInput((current) => `${current} ${transcript}`.trim());
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  if (hidden) return null;

  const starters = productId ? PRODUCT_STARTERS : DEFAULT_STARTERS;
  const lastMessage = messages[messages.length - 1];
  const followUps =
    !loading && lastMessage?.role === "assistant" ? lastMessage.followUps || [] : [];

  return (
    <>
      {open && (
        <section className="wvc-panel" role="dialog" aria-label="Vetra shopping assistant">
          <div className="wvc-head">
            <span className="wvc-avatar"><Sparkles size={18} /></span>
            <div className="wvc-title">
              <strong>Vetra</strong>
              <span>AI shopping assistant</span>
            </div>
            {messages.length > 0 && (
              <button type="button" className="wvc-icon-btn" onClick={clearChat} aria-label="Clear conversation" title="Clear conversation">
                <Trash2 size={16} />
              </button>
            )}
            <button type="button" className="wvc-icon-btn" onClick={() => setOpen(false)} aria-label="Close assistant" title="Close">
              <X size={18} />
            </button>
          </div>

          <div className="wvc-body" ref={scrollRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="wvc-welcome">
                <h3>Hi, I'm Vetra.</h3>
                <p>
                  Ask me to find a product, explain a specification
                  {productId ? ", answer questions about this product" : ""} or check on your order.
                </p>
                <div className="wvc-chips">
                  {starters.map((starter) => (
                    <button type="button" key={starter} onClick={() => send(starter)}>
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`wvc-row wvc-${message.role}`}>
                <div className={`wvc-bubble${message.error ? " wvc-error" : ""}`}>{message.text}</div>
                {message.products?.length > 0 && (
                  <div className="wvc-products">
                    {message.products.map((product) => (
                      <ChatProduct key={product._id} product={product} onNavigate={() => setOpen(false)} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="wvc-row wvc-assistant">
                <div className="wvc-bubble wvc-typing" aria-label="Vetra is typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            {followUps.length > 0 && (
              <div className="wvc-chips wvc-followups">
                {followUps.map((question) => (
                  <button type="button" key={question} onClick={() => send(question)}>
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className="wvc-form" onSubmit={submit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={listening ? "Listening…" : "Ask about products or orders"}
              aria-label="Message Vetra"
              maxLength={600}
            />
            {voiceSupported && (
              <button
                type="button"
                className={`wvc-icon-btn wvc-mic${listening ? " wvc-live" : ""}`}
                onClick={toggleVoice}
                aria-label={listening ? "Stop voice input" : "Speak your question"}
                aria-pressed={listening}
                title={listening ? "Stop listening" : "Speak"}
              >
                <MicIcon />
              </button>
            )}
            <button type="submit" className="wvc-send" disabled={!input.trim() || loading} aria-label="Send message">
              <Send size={17} />
            </button>
          </form>

          <div className="wvc-foot">
            Answers come from our live catalogue. AI can make mistakes.{" "}
            <Link href="/assistant" onClick={() => setOpen(false)}>Open full assistant</Link>
          </div>
        </section>
      )}

      <button
        type="button"
        className={`wvc-fab${open ? " wvc-fab-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        {open ? <X size={24} /> : <Sparkles size={24} />}
        {!open && <span className="wvc-fab-label">Ask Vetra</span>}
      </button>

      <style jsx global>{`
        .wvc-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 99980;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 56px;
          padding: 0 20px 0 16px;
          border: 0;
          border-radius: 999px;
          background: linear-gradient(135deg, #06b6d4, #6366f1);
          color: #fff;
          font: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 14px 36px rgba(6, 182, 212, 0.35), 0 2px 8px rgba(2, 6, 23, 0.5);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .wvc-fab:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 44px rgba(99, 102, 241, 0.45), 0 2px 8px rgba(2, 6, 23, 0.5);
        }
        .wvc-fab-open {
          width: 56px;
          padding: 0;
          justify-content: center;
          background: #1e293b;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.6);
        }
        .wvc-panel {
          position: fixed;
          right: 24px;
          bottom: 94px;
          z-index: 99981;
          width: min(400px, calc(100vw - 32px));
          height: min(620px, calc(100vh - 130px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 20px;
          background: #0b1228;
          color: #f8fafc;
          box-shadow: 0 30px 80px rgba(2, 6, 23, 0.7);
          animation: wvc-rise 0.22s ease-out;
        }
        @keyframes wvc-rise {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
        /* The site's global button styles add a shimmer, lift and em-sized icons;
           switch those off inside the widget so its controls stay calm. */
        .wvc-panel button::before,
        .wvc-fab::before { display: none; }
        .wvc-panel button:hover { transform: none; filter: none; box-shadow: none; }
        .wvc-fab svg { width: 24px; height: 24px; }
        .wvc-panel button svg,
        .wvc-panel a svg { width: 18px; height: 18px; min-width: 0; min-height: 0; }
        .wvc-head {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 14px 14px 16px;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(99, 102, 241, 0.16));
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }
        .wvc-avatar {
          width: 38px;
          height: 38px;
          flex: none;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #06b6d4, #6366f1);
          color: #fff;
        }
        .wvc-title { flex: 1; min-width: 0; display: grid; line-height: 1.25; }
        .wvc-title strong { font-size: 15px; }
        .wvc-title span { font-size: 12px; color: #94a3b8; }
        .wvc-panel .wvc-icon-btn {
          width: 36px;
          height: 36px;
          flex: none;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #cbd5e1;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .wvc-panel .wvc-icon-btn:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
        .wvc-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
        }
        .wvc-welcome h3 { margin: 4px 0 6px; font-size: 20px; letter-spacing: -0.02em; }
        .wvc-welcome p { margin: 0 0 14px; color: #94a3b8; font-size: 14px; line-height: 1.55; }
        .wvc-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .wvc-chips button {
          padding: 8px 12px;
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.08);
          color: #bae6fd;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .wvc-chips button:hover { background: rgba(56, 189, 248, 0.18); border-color: rgba(56, 189, 248, 0.6); }
        .wvc-row { display: flex; flex-direction: column; gap: 8px; max-width: 100%; }
        .wvc-user { align-items: flex-end; }
        .wvc-assistant { align-items: flex-start; }
        .wvc-bubble {
          max-width: 88%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .wvc-user .wvc-bubble { background: linear-gradient(135deg, #0891b2, #4f46e5); color: #fff; border-bottom-right-radius: 6px; }
        .wvc-assistant .wvc-bubble { background: rgba(148, 163, 184, 0.12); color: #e2e8f0; border-bottom-left-radius: 6px; }
        .wvc-bubble.wvc-error { background: rgba(248, 113, 113, 0.12); border: 1px solid rgba(248, 113, 113, 0.3); color: #fecaca; }
        .wvc-typing { display: inline-flex; gap: 5px; padding: 14px; }
        .wvc-typing span { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; animation: wvc-blink 1.2s infinite ease-in-out; }
        .wvc-typing span:nth-child(2) { animation-delay: 0.15s; }
        .wvc-typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes wvc-blink { 0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); } 40% { opacity: 1; transform: scale(1); } }
        .wvc-products { width: 100%; display: grid; gap: 8px; }
        .wvc-product {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px 8px 8px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.8);
          color: #f8fafc;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .wvc-product:hover { border-color: rgba(56, 189, 248, 0.55); background: rgba(30, 41, 59, 0.9); }
        .wvc-product-thumb { width: 48px; height: 48px; flex: none; display: grid; place-items: center; overflow: hidden; border-radius: 10px; background: #fff; color: #64748b; }
        .wvc-product-thumb img { width: 100%; height: 100%; object-fit: contain; }
        .wvc-product-text { flex: 1; min-width: 0; display: grid; gap: 2px; }
        .wvc-product-text strong { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .wvc-product-text > span { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #7dd3fc; font-variant-numeric: tabular-nums; }
        .wvc-product-text i { font-style: normal; font-size: 11px; font-weight: 600; }
        .wvc-in { color: #4ade80; }
        .wvc-out { color: #f87171; }
        .wvc-form { display: flex; align-items: center; gap: 6px; padding: 10px 12px; border-top: 1px solid rgba(148, 163, 184, 0.14); background: #0f172a; }
        .wvc-form input {
          flex: 1;
          min-width: 0;
          height: 42px;
          padding: 0 14px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          background: rgba(2, 6, 23, 0.6);
          backdrop-filter: none;
          color: #fff;
          font: inherit;
          font-size: 14px;
          outline: none;
        }
        .wvc-form input::placeholder { color: #64748b; }
        .wvc-form input:focus { border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18); }
        .wvc-panel .wvc-mic.wvc-live { background: rgba(248, 113, 113, 0.18); color: #fca5a5; animation: wvc-pulse 1.2s infinite; }
        @keyframes wvc-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.4); } 50% { box-shadow: 0 0 0 6px rgba(248, 113, 113, 0); } }
        .wvc-send {
          width: 42px;
          height: 42px;
          flex: none;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #06b6d4, #6366f1);
          color: #fff;
          cursor: pointer;
        }
        .wvc-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .wvc-foot { padding: 8px 14px 10px; background: #0f172a; color: #64748b; font-size: 11px; line-height: 1.4; text-align: center; }
        .wvc-foot a { color: #7dd3fc; font-weight: 600; }
        .wvc-foot a:hover { text-decoration: underline; }
        .wvc-fab:focus-visible,
        .wvc-send:focus-visible,
        .wvc-chips button:focus-visible,
        .wvc-product:focus-visible,
        .wvc-panel .wvc-icon-btn:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
        @media (max-width: 520px) {
          .wvc-fab { right: 16px; bottom: 16px; }
          .wvc-fab-label { display: none; }
          .wvc-fab { width: 56px; padding: 0; justify-content: center; }
          .wvc-panel { right: 0; bottom: 0; width: 100vw; height: 100dvh; max-height: 100dvh; border: 0; border-radius: 0; z-index: 100001; }
          .wvc-fab-open { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wvc-panel, .wvc-typing span, .wvc-panel .wvc-mic.wvc-live { animation: none; }
          .wvc-fab { transition: none; }
        }
      `}</style>
    </>
  );
}
