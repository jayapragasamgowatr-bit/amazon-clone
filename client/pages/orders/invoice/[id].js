import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import ProtectedRoute from "../../../components/ProtectedRoute";
import SEO from "../../../components/SEO";
import { getOrderById } from "../../../lib/api";
import siteConfig, { formatAddress, isPlaceholder } from "../../../lib/siteConfig";

// ============================================================
// INVOICE
// ============================================================
// A print-ready invoice built from the saved order. "Print / save
// as PDF" uses the browser's own print dialog, so no extra
// software is needed. Company details come from lib/siteConfig.js.
// ============================================================

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

function Invoice() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!router.isReady || !id) return;
    getOrderById(id)
      .then((data) => setOrder(data?.order || data))
      .catch((err) => setError(err?.message || "This invoice could not be loaded."));
  }, [router.isReady, id]);

  if (error) {
    return (
      <div className="ui-page ui-narrow">
        <div className="ui-empty">
          <h2>Invoice unavailable</h2>
          <p>{error}</p>
          <Link href="/orders" className="ui-btn">Back to orders</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="ui-loading" style={{ minHeight: "60vh" }}><span className="wv-spinner" /> Preparing invoice…</div>;
  }

  const address = order.shippingAddress || {};
  const customer = order.customer || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal ?? items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0));
  const discount = Number(order.discount || 0);
  const shipping = Number(order.shipping || 0);
  const number = `INV-${String(order._id).slice(-8).toUpperCase()}`;
  const missingDetails = [siteConfig.legalName, siteConfig.address.line1, siteConfig.gstin].some(isPlaceholder);

  return (
    <div className="wvi-page">
      <SEO title={`Invoice ${number} | ${siteConfig.name}`} noIndex />

      <div className="wvi-toolbar">
        <Link href={`/orders/${order._id}`} className="ui-btn ui-ghost ui-sm">Back to order</Link>
        <button type="button" className="ui-btn ui-sm" onClick={() => window.print()}>Print / save as PDF</button>
      </div>

      {order.status === "Cancelled" && (
        <div className="ui-alert wvi-note">This order was cancelled. The invoice is shown for your records only.</div>
      )}
      {missingDetails && (
        <div className="ui-alert ui-info wvi-note">
          Some company details are still placeholders (shown in [brackets]). The store owner can fill them in <code>client/lib/siteConfig.js</code>.
        </div>
      )}

      <article className="wvi-sheet">
        <div className="wvi-top">
          <div>
            <div className="wvi-brand">{siteConfig.name}</div>
            <div>{siteConfig.legalName}</div>
            <div>{formatAddress()}</div>
            <div>GSTIN: {siteConfig.gstin}</div>
          </div>
          <div className="wvi-meta">
            <h1>Invoice</h1>
            <dl>
              <dt>Invoice no.</dt><dd>{number}</dd>
              <dt>Order date</dt><dd>{formatDate(order.createdAt)}</dd>
              <dt>Order ID</dt><dd>{String(order._id)}</dd>
              <dt>Payment</dt><dd>{order.paymentMethod || "—"}{order.paymentStatus ? ` (${order.paymentStatus})` : ""}</dd>
            </dl>
          </div>
        </div>

        <section className="wvi-parties">
          <div>
            <h2>Billed to</h2>
            <strong>{address.name || customer.name || "Customer"}</strong>
            {customer.email && <div>{customer.email}</div>}
            {(address.phone || customer.phone) && <div>{address.phone || customer.phone}</div>}
          </div>
          <div>
            <h2>Shipped to</h2>
            <strong>{address.name || customer.name || "Customer"}</strong>
            <div>{address.address || "—"}</div>
            <div>{[address.city, address.state, address.postalCode || address.pincode].filter(Boolean).join(", ")}</div>
          </div>
        </section>

        <table className="wvi-table">
          <thead>
            <tr><th>#</th><th>Item</th><th className="wvi-r">Qty</th><th className="wvi-r">Unit price</th><th className="wvi-r">Amount</th></tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td className="wvi-r">{item.quantity}</td>
                <td className="wvi-r">{money(item.price)}</td>
                <td className="wvi-r">{money(Number(item.price || 0) * Number(item.quantity || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="wvi-totals">
          <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
          {discount > 0 && <div><span>Coupon{order.coupon?.code ? ` (${order.coupon.code})` : ""}</span><span>- {money(discount)}</span></div>}
          <div><span>Shipping</span><span>{shipping ? money(shipping) : "Free"}</span></div>
          <div className="wvi-grand"><span>Total</span><span>{money(order.totalPrice)}</span></div>
        </div>

        <div className="wvi-foot">
          <p>Prices are as charged at the time of the order. Questions about this invoice? Contact {siteConfig.supportEmail}.</p>
          <p>This is a computer-generated document and does not need a signature.</p>
        </div>
      </article>

      <style jsx global>{`
        .wvi-page { width: min(880px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 80px; }
        .wvi-toolbar { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
        .wvi-note { margin-bottom: 16px; }
        .wvi-note code { font-size: 13px; }
        .wvi-sheet { padding: 44px; border-radius: 6px; background: #ffffff; color: #0f172a; font-size: 14px; line-height: 1.55; box-shadow: 0 30px 80px rgba(2, 6, 23, 0.5); }
        .wvi-sheet h1, .wvi-sheet h2, .wvi-sheet strong { color: #0f172a; text-shadow: none; }
        .wvi-top { display: flex; justify-content: space-between; gap: 32px; flex-wrap: wrap; padding-bottom: 24px; border-bottom: 2px solid #0f172a; }
        .wvi-brand { font-size: 22px; font-weight: 900; letter-spacing: -0.02em; }
        .wvi-meta h1 { margin: 0 0 10px; font-size: 28px; letter-spacing: -0.02em; text-align: right; }
        .wvi-meta dl { margin: 0; display: grid; grid-template-columns: auto auto; gap: 3px 16px; }
        .wvi-meta dt { color: #64748b; }
        .wvi-meta dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
        .wvi-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 28px 0; }
        .wvi-parties h2 { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; }
        .wvi-table { width: 100%; border-collapse: collapse; }
        .wvi-table th { padding: 10px 8px; border-bottom: 1px solid #0f172a; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; text-align: left; color: #475569; }
        .wvi-table td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .wvi-table .wvi-r { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .wvi-totals { width: min(100%, 320px); margin: 20px 0 0 auto; display: grid; gap: 8px; font-variant-numeric: tabular-nums; }
        .wvi-totals div { display: flex; justify-content: space-between; gap: 16px; }
        .wvi-grand { margin-top: 6px; padding-top: 12px; border-top: 2px solid #0f172a; font-size: 18px; font-weight: 800; }
        .wvi-foot { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; }
        .wvi-foot p { margin: 0 0 4px; color: #64748b; }
        @media (max-width: 600px) {
          .wvi-sheet { padding: 22px; }
          .wvi-parties { grid-template-columns: 1fr; gap: 18px; }
          .wvi-meta h1 { text-align: left; }
          .wvi-meta dd { text-align: left; }
        }
        @media print {
          @page { margin: 14mm; }
          html, body, #__next { background: #ffffff !important; }
          body::before { display: none !important; }
          header, footer, .wv-header, .wvc-fab, .wvc-panel, .wvn, .wvi-toolbar, .wvi-note { display: none !important; }
          main { min-height: 0 !important; }
          .wvi-page { width: 100%; padding: 0; }
          .wvi-sheet { padding: 0; border-radius: 0; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}

export default function InvoicePage() {
  return <ProtectedRoute><Invoice /></ProtectedRoute>;
}
