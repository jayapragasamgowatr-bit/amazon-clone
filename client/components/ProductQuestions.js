import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { useAuth } from "../context/AuthContext";
import { askProductQuestion, getProductQuestions } from "../lib/api";

// ============================================================
// PRODUCT QUESTIONS AND ANSWERS
// ============================================================
// Customers post a question; it appears publicly once our team
// has answered it. The person who asked can see their own
// question while it is waiting.
// ============================================================

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export default function ProductQuestions({ productId }) {
  const { user } = useAuth();

  const [data, setData] = useState({ questions: [], pending: [] });
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = () => {
    if (!productId) return;
    getProductQuestions(productId)
      .then((result) => setData({ questions: result?.questions || [], pending: result?.pending || [] }))
      .catch(() => {
        // The product page works without this section.
      })
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    setLoaded(false);
    setShowAll(false);
    load();
    // Reload when the product or the signed-in customer changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user?._id]);

  const submit = async (event) => {
    event.preventDefault();
    const question = text.trim();
    if (question.length < 8 || sending) return;

    setSending(true);
    try {
      const result = await askProductQuestion(productId, question);
      toast.success(result?.message || "Question sent");
      setText("");
      load();
    } catch (error) {
      toast.error(error?.message || "Your question could not be sent.");
    } finally {
      setSending(false);
    }
  };

  const visible = showAll ? data.questions : data.questions.slice(0, 4);

  return (
    <section className="ui-card wvq" aria-label="Questions and answers">
      <span className="ui-eyebrow">Questions &amp; answers</span>
      <h2>Ask our team</h2>
      <p className="ui-muted wvq-lead">Have a question about compatibility, installation or delivery? Our team answers here so every customer can benefit.</p>

      {user ? (
        <form className="wvq-form" onSubmit={submit}>
          <label className="ui-field">
            <span>Your question</span>
            <textarea rows={2} value={text} onChange={(event) => setText(event.target.value)} maxLength={400} placeholder="e.g. Can this be installed on a vertical pipe?" />
          </label>
          <button type="submit" className="ui-btn" disabled={sending || text.trim().length < 8}>
            {sending ? "Sending…" : "Post question"}
          </button>
        </form>
      ) : (
        <div className="ui-alert ui-info">
          <Link href="/login" style={{ fontWeight: 700, textDecoration: "underline" }}>Sign in</Link> to ask a question about this product.
        </div>
      )}

      {data.pending.length > 0 && (
        <div className="wvq-list">
          {data.pending.map((item) => (
            <div className="wvq-item wvq-pending" key={item._id}>
              <p className="wvq-q">{item.question}</p>
              <p className="ui-small ui-muted">Waiting for an answer from our team. Only you can see this for now.</p>
            </div>
          ))}
        </div>
      )}

      {loaded && data.questions.length === 0 && data.pending.length === 0 && (
        <p className="ui-muted ui-small" style={{ margin: "18px 0 0" }}>No questions yet. Be the first to ask.</p>
      )}

      {visible.length > 0 && (
        <div className="wvq-list">
          {visible.map((item) => (
            <div className="wvq-item" key={item._id}>
              <p className="wvq-q">{item.question}</p>
              <p className="wvq-a">{item.answer}</p>
              <p className="ui-small ui-muted">Asked by {item.askedBy}{item.answeredAt ? ` · answered ${formatDate(item.answeredAt)}` : ""}</p>
            </div>
          ))}
        </div>
      )}

      {data.questions.length > 4 && !showAll && (
        <button type="button" className="ui-btn ui-ghost ui-sm" style={{ marginTop: 16 }} onClick={() => setShowAll(true)}>
          Show all {data.questions.length} questions
        </button>
      )}

      <style jsx global>{`
        .wvq { margin-top: 45px; padding: 28px; border-radius: 24px; }
        .wvq h2 { margin: 8px 0 6px; font-size: 26px; }
        .wvq-lead { margin: 0 0 18px; max-width: 68ch; line-height: 1.6; }
        .wvq-form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
        .wvq-form .ui-field { flex: 1; min-width: min(100%, 300px); }
        .wvq-form textarea { resize: vertical; }
        .wvq-list { display: grid; gap: 12px; margin-top: 20px; }
        .wvq-item { padding: 16px 18px; border-radius: 16px; background: rgba(148, 163, 184, 0.08); }
        .wvq-item p { margin: 0; }
        .wvq-q { font-weight: 700; font-size: 15px; line-height: 1.5; }
        .wvq-q::before { content: "Q. "; color: #7dd3fc; }
        .wvq-item .wvq-a { margin: 8px 0; line-height: 1.65; color: #e2e8f0; white-space: pre-wrap; overflow-wrap: anywhere; }
        .wvq-a::before { content: "A. "; font-weight: 700; color: #86efac; }
        .wvq-pending { border: 1px dashed rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.06); }
        .wvq-pending .ui-small { margin-top: 6px; }
      `}</style>
    </section>
  );
}
