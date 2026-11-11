import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MapPin, X } from "lucide-react";

import { getAddresses, validateCoupon } from "../lib/api";

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// ============================================================
// COUPON BOX
// ============================================================
// Shows a preview of the discount. The server recalculates it from
// live prices when the order is placed, so the preview can never be
// used to change what is charged.
// ============================================================

export function CouponBox({ subtotal, applied, onChange }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apply = async () => {
    const value = code.trim();
    if (!value || loading) return;

    setLoading(true);
    setError("");
    try {
      const data = await validateCoupon(value, subtotal);
      onChange({ code: data.coupon.code, discount: Number(data.discount || 0), description: data.coupon.description });
      setCode("");
    } catch (err) {
      setError(err?.message || "That coupon could not be applied.");
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="ui-alert ui-good ui-spread" style={{ marginBottom: 16 }}>
        <span>
          <Check size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          <strong>{applied.code}</strong> applied. You save {formatPrice(applied.discount)}.
        </span>
        <button type="button" className="ui-btn ui-ghost ui-sm" onClick={() => onChange(null)}>
          <X size={14} /> Remove
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="ui-field">
        <span>Have a coupon?</span>
        <div className="ui-row" style={{ flexWrap: "nowrap" }}>
          <input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                apply();
              }
            }}
            placeholder="Enter code"
            maxLength={30}
            autoComplete="off"
            style={{ textTransform: "uppercase" }}
          />
          <button type="button" className="ui-btn ui-ghost" onClick={apply} disabled={!code.trim() || loading}>
            {loading ? "Checking…" : "Apply"}
          </button>
        </div>
      </label>
      {error && (
        <p className="ui-small" role="alert" style={{ margin: "8px 0 0", color: "#fca5a5" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// SAVED ADDRESS PICKER
// ============================================================

export function SavedAddressPicker({ onPick }) {
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getAddresses()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.addresses) ? data.addresses : [];
        setAddresses(list);
        // Pre-fill with the default address so returning customers can check out quickly.
        const preferred = list.find((item) => item.isDefault);
        if (preferred) {
          setSelected(preferred._id);
          onPick(preferred);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
    // Load once when the checkout opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) return null;

  if (!addresses.length) {
    return (
      <p className="ui-small ui-muted" style={{ margin: "0 0 20px" }}>
        <MapPin size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        Tip: save addresses in <Link href="/profile" style={{ color: "#7dd3fc", fontWeight: 600 }}>your profile</Link> to fill this form in one tap next time.
      </p>
    );
  }

  return (
    <div className="ui-stack" style={{ marginBottom: 24 }} role="radiogroup" aria-label="Saved addresses">
      <span className="ui-small" style={{ fontWeight: 600, color: "#cbd5e1" }}>Deliver to a saved address</span>
      {addresses.map((item) => {
        const active = selected === item._id;
        return (
          <button
            type="button"
            key={item._id}
            role="radio"
            aria-checked={active}
            className="wv-address-option"
            data-active={active}
            onClick={() => {
              setSelected(item._id);
              onPick(item);
            }}
          >
            <span className="wv-address-dot" aria-hidden="true" />
            <span>
              <strong>{item.label}</strong> · {item.name}, {item.phone}
              <br />
              <span className="ui-muted">{item.address}, {item.city}, {item.state} {item.postalCode}</span>
            </span>
          </button>
        );
      })}
      <span className="ui-small ui-muted">You can still edit the details below for this order.</span>

      <style jsx global>{`
        .wv-address-option { display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 12px 14px; border: 1px solid rgba(148, 163, 184, 0.28); border-radius: 14px; background: rgba(2, 6, 23, 0.4); color: #f8fafc; font: inherit; font-size: 14px; font-weight: 400; line-height: 1.5; text-align: left; cursor: pointer; }
        .wv-address-option::before { display: none; }
        .wv-address-option:hover { transform: none; filter: none; box-shadow: none; border-color: #38bdf8; }
        .wv-address-option[data-active="true"] { border-color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
        .wv-address-dot { width: 16px; height: 16px; flex: none; margin-top: 3px; border: 2px solid #64748b; border-radius: 50%; }
        .wv-address-option[data-active="true"] .wv-address-dot { border-color: #38bdf8; background: radial-gradient(circle, #38bdf8 45%, transparent 50%); }
      `}</style>
    </div>
  );
}
