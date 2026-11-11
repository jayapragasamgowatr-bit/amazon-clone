import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import ProtectedRoute from "../../components/ProtectedRoute";
import SEO from "../../components/SEO";
import { createCoupon, deleteCoupon, getCoupons, updateCoupon } from "../../lib/api";

const EMPTY = {
  code: "", description: "", type: "percent", value: "", minOrder: "", maxDiscount: "",
  usageLimit: "", perUserLimit: "1", startsAt: "", expiresAt: "", isActive: true,
};

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const dateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function couponState(coupon) {
  const now = Date.now();
  if (!coupon.isActive) return { label: "Off", tone: "ui-bad" };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now) return { label: "Expired", tone: "ui-bad" };
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return { label: "Scheduled", tone: "ui-info" };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return { label: "Used up", tone: "ui-warn" };
  return { label: "Active", tone: "ui-good" };
}

function CouponDialog({ coupon, onClose, onSaved }) {
  const editing = Boolean(coupon?._id);
  const [form, setForm] = useState(
    editing
      ? {
          ...EMPTY, ...coupon,
          value: String(coupon.value ?? ""),
          minOrder: coupon.minOrder ? String(coupon.minOrder) : "",
          maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
          usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
          perUserLimit: coupon.perUserLimit ? String(coupon.perUserLimit) : "",
          startsAt: dateInput(coupon.startsAt),
          expiresAt: dateInput(coupon.expiresAt),
        }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);

  const set = (key) => (event) =>
    setForm((previous) => ({
      ...previous,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        // An expiry date means "valid through the end of that day".
        expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59` : "",
      };
      if (editing) await updateCoupon(coupon._id, payload);
      else await createCoupon(payload);
      toast.success(editing ? "Coupon updated" : "Coupon created");
      onSaved();
    } catch (error) {
      toast.error(error?.message || "The coupon could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label={editing ? "Edit coupon" : "New coupon"}>
      <form className="ui-dialog" onSubmit={submit}>
        <h2>{editing ? `Edit ${coupon.code}` : "New coupon"}</h2>

        <div className="ui-grid ui-cols-2">
          <label className="ui-field">
            <span>Code</span>
            <input value={form.code} onChange={set("code")} placeholder="WELCOME10" maxLength={30} required disabled={editing} style={{ textTransform: "uppercase" }} />
            {editing && <small>The code cannot be changed after it is created.</small>}
          </label>
          <label className="ui-field">
            <span>Discount type</span>
            <select value={form.type} onChange={set("type")}>
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off (₹)</option>
            </select>
          </label>
          <label className="ui-field">
            <span>{form.type === "percent" ? "Percent off" : "Amount off (₹)"}</span>
            <input type="number" min="1" max={form.type === "percent" ? 100 : undefined} step="any" value={form.value} onChange={set("value")} required />
          </label>
          {form.type === "percent" && (
            <label className="ui-field">
              <span>Maximum discount (₹)</span>
              <input type="number" min="0" step="any" value={form.maxDiscount} onChange={set("maxDiscount")} placeholder="No cap" />
            </label>
          )}
          <label className="ui-field">
            <span>Minimum order (₹)</span>
            <input type="number" min="0" step="any" value={form.minOrder} onChange={set("minOrder")} placeholder="No minimum" />
          </label>
          <label className="ui-field">
            <span>Total uses allowed</span>
            <input type="number" min="0" step="1" value={form.usageLimit} onChange={set("usageLimit")} placeholder="Unlimited" />
          </label>
          <label className="ui-field">
            <span>Uses per customer</span>
            <input type="number" min="0" step="1" value={form.perUserLimit} onChange={set("perUserLimit")} placeholder="Unlimited" />
          </label>
          <label className="ui-field">
            <span>Starts on</span>
            <input type="date" value={form.startsAt} onChange={set("startsAt")} />
          </label>
          <label className="ui-field">
            <span>Expires on</span>
            <input type="date" value={form.expiresAt} onChange={set("expiresAt")} />
          </label>
        </div>

        <label className="ui-field" style={{ marginTop: 14 }}>
          <span>Description shown to customers</span>
          <input value={form.description} onChange={set("description")} placeholder="10% off your first order" maxLength={200} />
        </label>

        <label className="ui-check" style={{ marginTop: 14 }}>
          <input type="checkbox" checked={form.isActive} onChange={set("isActive")} />
          <span>Active (customers can use this code)</span>
        </label>

        <div className="ui-dialog-actions">
          <button type="button" className="ui-btn ui-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="ui-btn" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create coupon"}</button>
        </div>
      </form>
    </div>
  );
}

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);

  const load = () => {
    setLoading(true);
    getCoupons()
      .then((data) => {
        setCoupons(data?.coupons || []);
        setError("");
      })
      .catch((err) => setError(err?.message || "Coupons could not be loaded."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}? Orders that already used it are not affected.`)) return;
    try {
      await deleteCoupon(coupon._id);
      toast.success("Coupon deleted");
      load();
    } catch (err) {
      toast.error(err?.message || "The coupon could not be deleted.");
    }
  };

  return (
    <div className="ui-page">
      <SEO title="Coupons | Admin" noIndex />

      <div className="ui-head">
        <div>
          <span className="ui-eyebrow">Promotions</span>
          <h1 className="ui-title">Coupon codes</h1>
          <p className="ui-lead">Create discount codes for customers to apply at checkout. Discounts are always recalculated on the server from live prices.</p>
        </div>
        <button type="button" className="ui-btn" onClick={() => setDialog({})}><Plus size={16} /> New coupon</button>
      </div>

      {error && <div className="ui-alert" role="alert">{error}</div>}
      {loading && <div className="ui-loading"><span className="wv-spinner" /> Loading coupons…</div>}

      {!loading && !error && coupons.length === 0 && (
        <div className="ui-empty">
          <h2>No coupons yet</h2>
          <p>Create your first code, for example a welcome discount for new customers.</p>
          <button type="button" className="ui-btn" onClick={() => setDialog({})}><Plus size={16} /> New coupon</button>
        </div>
      )}

      {coupons.length > 0 && (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Code</th><th>Discount</th><th>Conditions</th><th>Used</th><th>Valid</th><th>Status</th><th className="ui-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const state = couponState(coupon);
                return (
                  <tr key={coupon._id}>
                    <td><strong>{coupon.code}</strong>{coupon.description && <div className="ui-muted ui-small">{coupon.description}</div>}</td>
                    <td className="ui-num">
                      {coupon.type === "percent" ? `${coupon.value}% off` : `${formatPrice(coupon.value)} off`}
                      {coupon.type === "percent" && coupon.maxDiscount > 0 && <div className="ui-muted ui-small">up to {formatPrice(coupon.maxDiscount)}</div>}
                    </td>
                    <td className="ui-small">
                      {coupon.minOrder > 0 ? `Min. order ${formatPrice(coupon.minOrder)}` : "Any order"}
                      <div className="ui-muted">{coupon.perUserLimit > 0 ? `${coupon.perUserLimit} per customer` : "No per-customer limit"}</div>
                    </td>
                    <td className="ui-num">{coupon.usedCount}{coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ""}</td>
                    <td className="ui-small">{formatDate(coupon.startsAt)} to {formatDate(coupon.expiresAt)}</td>
                    <td><span className={`ui-badge ${state.tone}`}>{state.label}</span></td>
                    <td className="ui-right">
                      <div className="ui-row" style={{ justifyContent: "flex-end" }}>
                        <button type="button" className="ui-btn ui-ghost ui-sm" onClick={() => setDialog(coupon)}><Pencil size={14} /> Edit</button>
                        <button type="button" className="ui-btn ui-danger ui-sm" onClick={() => remove(coupon)} aria-label={`Delete ${coupon.code}`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <CouponDialog
          coupon={dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function CouponsPage() {
  return <ProtectedRoute adminOnly><Coupons /></ProtectedRoute>;
}
