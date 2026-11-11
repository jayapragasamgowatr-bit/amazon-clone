import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import ProtectedRoute from "../../components/ProtectedRoute";
import SEO from "../../components/SEO";
import { decideReturn, getAdminReturns } from "../../lib/api";

const TABS = ["Requested", "Approved", "Refunded", "Rejected"];
const TONE = { Requested: "ui-warn", Approved: "ui-info", Refunded: "ui-good", Rejected: "ui-bad" };

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function DecisionDialog({ order, decision, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const needsNote = decision === "Rejected";

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await decideReturn(order._id, decision, note.trim());
      toast.success(`Return marked ${decision.toLowerCase()}`);
      onDone();
    } catch (error) {
      toast.error(error?.message || "The return could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  const title = { Approved: "Approve this return?", Rejected: "Reject this return?", Refunded: "Mark as refunded?" }[decision];

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <form className="ui-dialog" onSubmit={submit}>
        <h2>{title}</h2>
        <p className="ui-muted">
          Order #{String(order._id).slice(-8).toUpperCase()} · {order.customer?.name || "Customer"} · {formatPrice(order.totalPrice)}
        </p>
        {decision === "Refunded" && (
          <div className="ui-alert ui-info">This only records the refund here. Send the money back through your payment method first.</div>
        )}
        <label className="ui-field" style={{ marginTop: 14 }}>
          <span>{needsNote ? "Reason shown to the customer" : "Note for the customer (optional)"}</span>
          <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} required={needsNote} />
        </label>
        <div className="ui-dialog-actions">
          <button type="button" className="ui-btn ui-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className={`ui-btn${decision === "Rejected" ? " ui-danger" : ""}`} disabled={saving}>
            {saving ? "Saving…" : `Mark ${decision.toLowerCase()}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function Returns() {
  const [tab, setTab] = useState("Requested");
  const [data, setData] = useState({ returns: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);

  const load = (status = tab) => {
    setLoading(true);
    getAdminReturns(status)
      .then((result) => {
        setData({ returns: result?.returns || [], counts: result?.counts || {} });
        setError("");
      })
      .catch((err) => setError(err?.message || "Returns could not be loaded."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(tab);
    // Reload whenever the tab changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="ui-page">
      <SEO title="Returns | Admin" noIndex />

      <div className="ui-head">
        <div>
          <span className="ui-eyebrow">After-sales</span>
          <h1 className="ui-title">Return requests</h1>
          <p className="ui-lead">Review what customers have asked to send back, then approve, reject or record the refund.</p>
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
      {loading && <div className="ui-loading"><span className="wv-spinner" /> Loading returns…</div>}

      {!loading && !error && data.returns.length === 0 && (
        <div className="ui-empty">
          <h2>Nothing here</h2>
          <p>There are no returns with the status &ldquo;{tab}&rdquo;.</p>
        </div>
      )}

      <div className="ui-stack">
        {!loading && data.returns.map((order) => {
          const request = order.returnRequest || {};
          return (
            <article className="ui-card" key={order._id}>
              <div className="ui-spread">
                <div>
                  <Link href={`/orders/${order._id}`} style={{ fontWeight: 800 }}>Order #{String(order._id).slice(-8).toUpperCase()}</Link>
                  <div className="ui-muted ui-small">
                    {order.customer?.name || "Customer"}{order.customer?.email ? ` · ${order.customer.email}` : ""} · {formatPrice(order.totalPrice)} · {order.paymentMethod || "—"}
                  </div>
                </div>
                <span className={`ui-badge ${TONE[request.status] || ""}`}>{request.status}</span>
              </div>

              <p style={{ margin: "14px 0 6px" }}><strong>{request.reason}</strong></p>
              {request.details && <p className="ui-muted" style={{ margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{request.details}</p>}

              <ul className="ui-small ui-muted" style={{ margin: "0 0 14px", paddingLeft: 18 }}>
                {(order.items || []).map((item, index) => <li key={index}>{item.quantity} × {item.name}</li>)}
              </ul>

              <div className="ui-spread">
                <span className="ui-small ui-muted">
                  Delivered {formatDate(order.deliveredAt)} · Requested {formatDate(request.requestedAt)}
                  {request.adminNote ? ` · Note: ${request.adminNote}` : ""}
                </span>
                <div className="ui-row">
                  {request.status === "Requested" && (
                    <>
                      <button type="button" className="ui-btn ui-danger ui-sm" onClick={() => setDialog({ order, decision: "Rejected" })}>Reject</button>
                      <button type="button" className="ui-btn ui-sm" onClick={() => setDialog({ order, decision: "Approved" })}>Approve</button>
                    </>
                  )}
                  {request.status === "Approved" && (
                    <button type="button" className="ui-btn ui-sm" onClick={() => setDialog({ order, decision: "Refunded" })}>Mark refunded</button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {dialog && (
        <DecisionDialog
          {...dialog}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function ReturnsPage() {
  return <ProtectedRoute adminOnly><Returns /></ProtectedRoute>;
}
