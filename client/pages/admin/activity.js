import { useEffect, useState } from "react";

import ProtectedRoute from "../../components/ProtectedRoute";
import SEO from "../../components/SEO";
import { getAdminActivity } from "../../lib/api";
import { ROLE_LABELS } from "../../lib/permissions";

const AREAS = [
  { value: "", label: "Everything" },
  { value: "product", label: "Products" },
  { value: "inventory", label: "Inventory" },
  { value: "order", label: "Orders" },
  { value: "return", label: "Returns" },
  { value: "coupon", label: "Coupons" },
  { value: "user", label: "Accounts" },
  { value: "question", label: "Questions" },
  { value: "review", label: "Reviews" },
];

const ACTION_LABELS = {
  "product.create": "Added a product",
  "product.update": "Edited a product",
  "product.delete": "Deleted a product",
  "product.images": "Uploaded product images",
  "inventory.adjust": "Adjusted stock",
  "order.status": "Changed an order status",
  "order.shipping": "Updated shipping details",
  "order.delete": "Deleted an order",
  "return.decide": "Decided a return",
  "coupon.create": "Created a coupon",
  "coupon.update": "Edited a coupon",
  "coupon.delete": "Deleted a coupon",
  "user.role": "Changed a role",
  "user.block": "Suspended or restored an account",
  "user.update": "Edited an account",
  "user.delete": "Deleted an account",
  "question.answer": "Answered or moderated a question",
  "question.delete": "Deleted a question",
  "review.update": "Edited a review",
  "review.delete": "Deleted a review",
};

const formatWhen = (value) =>
  new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

function Activity() {
  const [area, setArea] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminActivity({ page, action: area, limit: 30 })
      .then((result) => {
        if (!active) return;
        setData({ items: result?.items || [], pages: result?.pages || 1, total: result?.total || 0 });
        setError("");
      })
      .catch((err) => active && setError(err?.message || "The activity log could not be loaded."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, area]);

  return (
    <div className="ui-page">
      <SEO title="Activity log | Admin" noIndex />

      <div className="ui-head">
        <div>
          <span className="ui-eyebrow">Audit trail</span>
          <h1 className="ui-title">Activity log</h1>
          <p className="ui-lead">A record of every change staff make to products, orders, coupons and accounts. Entries cannot be edited.</p>
        </div>
        <label className="ui-field" style={{ minWidth: 200 }}>
          <span>Show</span>
          <select
            value={area}
            onChange={(event) => {
              setArea(event.target.value);
              setPage(1);
            }}
          >
            {AREAS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
      </div>

      {error && <div className="ui-alert" role="alert">{error}</div>}
      {loading && <div className="ui-loading"><span className="wv-spinner" /> Loading activity…</div>}

      {!loading && !error && data.items.length === 0 && (
        <div className="ui-empty">
          <h2>No activity recorded yet</h2>
          <p>Changes made in the admin panel from now on will appear here.</p>
        </div>
      )}

      {!loading && data.items.length > 0 && (
        <>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item._id}>
                    <td className="ui-small ui-num" style={{ whiteSpace: "nowrap" }}>{formatWhen(item.createdAt)}</td>
                    <td>
                      <strong>{item.actorName || "Staff"}</strong>
                      <div className="ui-muted ui-small">{ROLE_LABELS[item.actorRole] || item.actorRole}</div>
                    </td>
                    <td>{ACTION_LABELS[item.action] || item.action}</td>
                    <td className="ui-small ui-muted" style={{ overflowWrap: "anywhere" }}>
                      {item.summary || (item.targetId ? `${item.targetType} …${String(item.targetId).slice(-8)}` : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ui-spread" style={{ marginTop: 16 }}>
            <span className="ui-muted ui-small">{data.total} entr{data.total === 1 ? "y" : "ies"} · page {page} of {data.pages}</span>
            <div className="ui-row">
              <button type="button" className="ui-btn ui-ghost ui-sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
              <button type="button" className="ui-btn ui-ghost ui-sm" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ActivityPage() {
  return <ProtectedRoute adminOnly><Activity /></ProtectedRoute>;
}
