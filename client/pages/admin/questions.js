import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import ProtectedRoute from "../../components/ProtectedRoute";
import SEO from "../../components/SEO";
import { answerProductQuestion, deleteProductQuestion, getAdminQuestions, setQuestionHidden } from "../../lib/api";

const TABS = ["Pending", "Answered", "Hidden"];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function QuestionCard({ item, onChanged }) {
  const [answer, setAnswer] = useState(item.answer || "");
  const [saving, setSaving] = useState(false);

  const run = async (action, success) => {
    setSaving(true);
    try {
      await action();
      toast.success(success);
      onChanged();
    } catch (error) {
      toast.error(error?.message || "That could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="ui-card">
      <div className="ui-spread">
        <div className="ui-small ui-muted">
          {item.product?._id ? <Link href={`/product/${item.product._id}`} style={{ color: "#7dd3fc", fontWeight: 700 }}>{item.product.name}</Link> : "Product removed"}
          {" · "}{item.user?.name || item.askedBy}{item.user?.email ? ` (${item.user.email})` : ""} · {formatDate(item.createdAt)}
        </div>
        <span className={`ui-badge ${item.status === "Pending" ? "ui-warn" : item.status === "Answered" ? "ui-good" : "ui-bad"}`}>{item.status}</span>
      </div>

      <p style={{ margin: "12px 0", fontSize: 16, fontWeight: 600 }}>{item.question}</p>

      <label className="ui-field">
        <span>Public answer</span>
        <textarea rows={3} value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={1500} placeholder="Write a clear, factual answer. It will be shown on the product page." />
      </label>

      <div className="ui-row" style={{ marginTop: 12, justifyContent: "flex-end" }}>
        <button
          type="button"
          className="ui-btn ui-danger ui-sm"
          disabled={saving}
          onClick={() => window.confirm("Delete this question permanently?") && run(() => deleteProductQuestion(item._id), "Question deleted")}
        >
          Delete
        </button>
        <button
          type="button"
          className="ui-btn ui-ghost ui-sm"
          disabled={saving}
          onClick={() => run(() => setQuestionHidden(item._id, item.status !== "Hidden"), item.status === "Hidden" ? "Question restored" : "Question hidden")}
        >
          {item.status === "Hidden" ? "Unhide" : "Hide"}
        </button>
        <button
          type="button"
          className="ui-btn ui-sm"
          disabled={saving || answer.trim().length < 2 || answer.trim() === (item.answer || "")}
          onClick={() => run(() => answerProductQuestion(item._id, answer.trim()), "Answer published")}
        >
          {item.answer ? "Update answer" : "Publish answer"}
        </button>
      </div>
    </article>
  );
}

function Questions() {
  const [tab, setTab] = useState("Pending");
  const [data, setData] = useState({ questions: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (status = tab) => {
    setLoading(true);
    getAdminQuestions(status)
      .then((result) => {
        setData({ questions: result?.questions || [], counts: result?.counts || {} });
        setError("");
      })
      .catch((err) => setError(err?.message || "Questions could not be loaded."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(tab);
    // Reload whenever the tab changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="ui-page">
      <SEO title="Product questions | Admin" noIndex />

      <div className="ui-head">
        <div>
          <span className="ui-eyebrow">Customer questions</span>
          <h1 className="ui-title">Product Q&amp;A</h1>
          <p className="ui-lead">Answer what customers ask on product pages. A question becomes public once it has an answer.</p>
        </div>
      </div>

      <div className="ui-tabs" role="tablist">
        {TABS.map((name) => (
          <button type="button" role="tab" key={name} aria-selected={tab === name} onClick={() => setTab(name)}>
            {name} ({data.counts[name] || 0})
          </button>
        ))}
      </div>

      {error && <div className="ui-alert" role="alert">{error}</div>}
      {loading && <div className="ui-loading"><span className="wv-spinner" /> Loading questions…</div>}

      {!loading && !error && data.questions.length === 0 && (
        <div className="ui-empty">
          <h2>{tab === "Pending" ? "All caught up" : "Nothing here"}</h2>
          <p>{tab === "Pending" ? "There are no questions waiting for an answer." : `There are no ${tab.toLowerCase()} questions.`}</p>
        </div>
      )}

      <div className="ui-stack">
        {!loading && data.questions.map((item) => <QuestionCard key={item._id} item={item} onChanged={() => load()} />)}
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return <ProtectedRoute adminOnly><Questions /></ProtectedRoute>;
}
