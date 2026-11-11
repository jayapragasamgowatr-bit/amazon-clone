import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { cancelMyOrder, getReturnPolicy, requestOrderReturn } from "../lib/api";

// ============================================================
// ORDER ACTIONS (customer)
// ============================================================
// Cancel (while Pending / Confirmed), request a return (after
// delivery, inside the return window), download the invoice, and
// see where a return request stands.
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_REASONS = ["Damaged on arrival", "Wrong item received", "Not as described", "Defective / not working", "No longer needed", "Other"];
const RETURN_TONE = { Requested: "ui-warn", Approved: "ui-info", Refunded: "ui-good", Rejected: "ui-bad" };
const RETURN_TEXT = {
  Requested: "We have your return request and will review it shortly.",
  Approved: "Your return is approved. Our team will contact you about pickup and your refund.",
  Refunded: "Your refund has been issued.",
  Rejected: "We could not accept this return.",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

function CancelDialog({ order, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await cancelMyOrder(order._id, reason.trim());
      toast.success(data?.message || "Order cancelled");
      onDone();
    } catch (error) {
      toast.error(error?.message || "The order could not be cancelled.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Cancel order">
      <form className="ui-dialog" onSubmit={submit}>
        <h2>Cancel this order?</h2>
        <p className="ui-muted">The items go back into stock straight away. This cannot be undone, but you can always place a new order.</p>
        <label className="ui-field" style={{ marginTop: 14 }}>
          <span>Reason (optional)</span>
          <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} placeholder="e.g. Ordered the wrong size" />
        </label>
        <div className="ui-dialog-actions">
          <button type="button" className="ui-btn ui-ghost" onClick={onClose}>Keep order</button>
          <button type="submit" className="ui-btn ui-danger" disabled={saving}>{saving ? "Cancelling…" : "Cancel order"}</button>
        </div>
      </form>
    </div>
  );
}

function ReturnDialog({ order, reasons, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = await requestOrderReturn(order._id, reason, details.trim());
      toast.success(data?.message || "Return requested");
      onDone();
    } catch (error) {
      toast.error(error?.message || "The return request could not be sent.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Request a return">
      <form className="ui-dialog" onSubmit={submit}>
        <h2>Request a return</h2>
        <p className="ui-muted">Tell us what went wrong. Our team reviews every request and replies on this page.</p>
        <label className="ui-field" style={{ marginTop: 14 }}>
          <span>Reason</span>
          <select value={reason} onChange={(event) => setReason(event.target.value)} required>
            <option value="" disabled>Choose a reason</option>
            {reasons.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="ui-field" style={{ marginTop: 14 }}>
          <span>Details {reason === "Other" ? "" : "(optional)"}</span>
          <textarea rows={4} value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} required={reason === "Other"} placeholder="Describe the problem so we can help quickly." />
        </label>
        <div className="ui-dialog-actions">
          <button type="button" className="ui-btn ui-ghost" onClick={onClose}>Close</button>
          <button type="submit" className="ui-btn" disabled={saving || !reason}>{saving ? "Sending…" : "Send request"}</button>
        </div>
      </form>
    </div>
  );
}

export default function OrderActions({ order, onChanged }) {
  const [policy, setPolicy] = useState({ windowDays: 7, reasons: FALLBACK_REASONS });
  const [dialog, setDialog] = useState("");

  useEffect(() => {
    getReturnPolicy()
      .then((data) => {
        if (data?.reasons?.length) setPolicy({ windowDays: Number(data.windowDays ?? 7), reasons: data.reasons });
      })
      .catch(() => {
        // Keep the defaults; the server still enforces the real policy.
      });
  }, []);

  if (!order?._id) return null;

  const returnStatus = order.returnRequest?.status || "None";
  const canCancel = ["Pending", "Confirmed"].includes(order.status);
  const deadline = order.deliveredAt ? new Date(new Date(order.deliveredAt).getTime() + policy.windowDays * DAY_MS) : null;
  const canReturn = order.status === "Delivered" && returnStatus === "None" && deadline && Date.now() <= deadline.getTime();
  const returnClosed = order.status === "Delivered" && returnStatus === "None" && deadline && Date.now() > deadline.getTime();

  const done = () => {
    setDialog("");
    onChanged?.();
  };

  return (
    <section className="ui-card wvo" aria-label="Order actions">
      {returnStatus !== "None" && (
        <div className="wvo-return">
          <div className="ui-row">
            <strong>Return request</strong>
            <span className={`ui-badge ${RETURN_TONE[returnStatus] || ""}`}>{returnStatus}</span>
          </div>
          <p className="ui-muted ui-small">
            {RETURN_TEXT[returnStatus]} Reason given: {order.returnRequest.reason}.
            {order.returnRequest.adminNote ? ` Note from our team: ${order.returnRequest.adminNote}` : ""}
          </p>
        </div>
      )}

      <div className="ui-spread">
        <p className="ui-muted ui-small wvo-hint">
          {canCancel && "You can cancel this order until we start preparing it."}
          {canReturn && `You can request a return until ${formatDate(deadline)}.`}
          {returnClosed && `The ${policy.windowDays}-day return window for this order has closed.`}
          {!canCancel && !canReturn && !returnClosed && returnStatus === "None" && order.status !== "Cancelled" && "Need help with this order? Our support team is happy to assist."}
          {order.status === "Cancelled" && "This order was cancelled."}
        </p>
        <div className="ui-row">
          <Link href={`/orders/invoice/${order._id}`} className="ui-btn ui-ghost ui-sm">Invoice</Link>
          <Link href="/ai-support" className="ui-btn ui-ghost ui-sm">Get help</Link>
          {canReturn && <button type="button" className="ui-btn ui-sm" onClick={() => setDialog("return")}>Request a return</button>}
          {canCancel && <button type="button" className="ui-btn ui-danger ui-sm" onClick={() => setDialog("cancel")}>Cancel order</button>}
        </div>
      </div>

      {dialog === "cancel" && <CancelDialog order={order} onClose={() => setDialog("")} onDone={done} />}
      {dialog === "return" && <ReturnDialog order={order} reasons={policy.reasons} onClose={() => setDialog("")} onDone={done} />}

      <style jsx global>{`
        .wvo { margin: 0 0 22px; padding: 18px 22px; }
        .wvo-return { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid rgba(148, 163, 184, 0.14); }
        .wvo-return p { margin: 8px 0 0; line-height: 1.55; }
        .wvo-hint { margin: 0; flex: 1; min-width: min(100%, 240px); line-height: 1.5; }
      `}</style>
    </section>
  );
}
