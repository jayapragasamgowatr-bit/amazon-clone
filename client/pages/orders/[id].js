import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  Clock3,
  Home,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";

import ProtectedRoute from "../../components/ProtectedRoute";
import { getOrderById } from "../../lib/api";

const STEPS = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const dateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const shortId = (value) => {
  const id = String(value || "");
  return id ? `#${id.slice(-8).toUpperCase()}` : "—";
};

export default function OrderDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = useCallback(async () => {
    if (!id) return;

    try {
      setError("");
      const data = await getOrderById(id);
      setOrder(data?.order || data?.data?.order || null);
    } catch (err) {
      console.error("LOAD ORDER DETAILS ERROR:", err);
      setError(err?.message || "Unable to load order");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (!router.isReady) return;
    loadOrder();
  }, [router.isReady, loadOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
    toast.success("Order details refreshed.");
  };

  const currentIndex = useMemo(() => {
    if (!order || order.status === "Cancelled") return -1;
    return STEPS.indexOf(order.status);
  }, [order]);

  const totals = useMemo(() => {
    if (!order) return { subtotal: 0, shipping: 0, total: 0 };
    return {
      subtotal: Number(order.subtotal || 0),
      shipping: Number(order.shipping || 0),
      total: Number(order.totalPrice || 0),
    };
  }, [order]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="loading-page">
          <div className="spinner" />
          <strong>Loading order...</strong>
          <span>Fetching your order details.</span>
          <style jsx>{`
            .loading-page {
              min-height: 70vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 9px;
              color: #e8f0f9;
            }
            .loading-page span { color: #71809a; font-size: 12px; }
            .spinner {
              width: 40px;
              height: 40px;
              border: 4px solid rgba(56,189,248,.13);
              border-top-color: #38bdf8;
              border-radius: 50%;
              animation: spin .8s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <main className="page">
          <div className="empty">
            <XCircle size={45} />
            <h1>Order not found</h1>
            <p>{error || "This order could not be found."}</p>
            <Link href="/orders" className="back-button">
              <ArrowLeft size={16} /> Back to My Orders
            </Link>
          </div>
          <style jsx>{`
            .page {
              min-height: 100vh;
              padding: 50px 20px;
              background: #070b20;
              color: white;
            }
            .empty {
              min-height: 55vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 10px;
              color: #71809a;
              text-align: center;
            }
            h1 { margin: 0; color: #f8fafc; font-size: 30px; }
            p { margin: 0 0 10px; max-width: 500px; font-size: 13px; }
            .back-button {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              padding: 10px 14px;
              border-radius: 9px;
              background: linear-gradient(135deg,#0891b2,#4f46e5);
              color: white;
              text-decoration: none;
              font-size: 11px;
              font-weight: 900;
            }
          `}</style>
        </main>
      </ProtectedRoute>
    );
  }

  const address = order.shippingAddress || {};
  const customer = order.customer || {};

  return (
    <ProtectedRoute>
      <main className="page">
        <div className="shell">
          <div className="topbar">
            <Link href="/orders" className="back-link">
              <ArrowLeft size={16} />
              My Orders
            </Link>

            <button
              type="button"
              className="refresh"
              disabled={refreshing}
              onClick={handleRefresh}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <header className="hero">
            <div>
              <span className="eyebrow">WAVENTRA VETRIC</span>
              <h1>Order Details</h1>
              <p>
                Order {shortId(order._id)} · Placed {dateTime(order.createdAt)}
              </p>
            </div>

            <span
              className={`status-pill ${String(order.status || "Pending").toLowerCase()}`}
            >
              {order.status || "Pending"}
            </span>
          </header>

          {error && (
            <div className="error-banner">
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <section className="tracking-card">
            <div className="section-heading">
              <div>
                <strong>Order Tracking</strong>
                <span>Live status from your order</span>
              </div>
              <Truck size={20} />
            </div>

            {order.status === "Cancelled" ? (
              <div className="cancelled">
                <div className="cancel-icon">
                  <XCircle size={25} />
                </div>
                <div>
                  <strong>Order Cancelled</strong>
                  <p>
                    {order.cancellationReason ||
                      "This order has been cancelled."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="tracking">
                {STEPS.map((step, index) => {
                  const active = currentIndex >= index;
                  const current = currentIndex === index;

                  return (
                    <div className="tracking-step" key={step}>
                      <div
                        className={`track-marker ${active ? "active" : ""} ${
                          current ? "current" : ""
                        }`}
                      >
                        {active ? <Check size={15} /> : index + 1}
                      </div>

                      <div className="track-copy">
                        <strong>{step}</strong>
                        <span>
                          {step === "Pending" && "Order received"}
                          {step === "Confirmed" && "Order confirmed"}
                          {step === "Processing" && "Being prepared"}
                          {step === "Shipped" && "On the way"}
                          {step === "Delivered" && "Delivered to you"}
                        </span>
                      </div>

                      {index < STEPS.length - 1 && (
                        <div
                          className={`track-line ${
                            currentIndex > index ? "active" : ""
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="content-grid">
            <section className="card items-card">
              <div className="section-heading">
                <div>
                  <strong>Items in this order</strong>
                  <span>
                    {order.items?.length || 0} product
                    {(order.items?.length || 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <ShoppingBag size={19} />
              </div>

              <div className="items">
                {(order.items || []).map((item, index) => {
                  const product = item.product || {};
                  const image = item.image || product.image;

                  return (
                    <div
                      className="item"
                      key={`${product?._id || item?.name || "item"}-${index}`}
                    >
                      <div className="item-image">
                        {image ? (
                          <img src={image} alt={item?.name || "Product"} />
                        ) : (
                          <Package size={23} />
                        )}
                      </div>

                      <div className="item-copy">
                        <strong>{item?.name || product?.name || "Product"}</strong>
                        <span>
                          Qty: {Number(item?.quantity || 0)} ×{" "}
                          {money(item?.price)}
                        </span>
                      </div>

                      <strong className="item-total">
                        {money(Number(item?.price || 0) * Number(item?.quantity || 0))}
                      </strong>
                    </div>
                  );
                })}
              </div>

              <div className="totals">
                <div><span>Subtotal</span><strong>{money(totals.subtotal)}</strong></div>
                <div><span>Shipping</span><strong>{totals.shipping ? money(totals.shipping) : "Free"}</strong></div>
                <div className="grand"><span>Total</span><strong>{money(totals.total)}</strong></div>
              </div>
            </section>

            <div className="side-column">
              <section className="card">
                <div className="section-heading">
                  <div>
                    <strong>Delivery Address</strong>
                    <span>Shipping information</span>
                  </div>
                  <MapPin size={19} />
                </div>

                <div className="address">
                  <strong>{address.name || customer.name || "Customer"}</strong>
                  <p>{address.address || "—"}</p>
                  <p>
                    {[address.city, address.state, address.postalCode || address.pincode]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  {address.phone && (
                    <span><Phone size={13} /> {address.phone}</span>
                  )}
                  {address.email && (
                    <span><Mail size={13} /> {address.email}</span>
                  )}
                </div>
              </section>

              <section className="card summary-card">
                <div className="section-heading">
                  <div>
                    <strong>Payment</strong>
                    <span>Payment information</span>
                  </div>
                  <Clock3 size={19} />
                </div>

                <div className="payment-row">
                  <span>Method</span>
                  <strong>{order.paymentMethod || "COD"}</strong>
                </div>
                <div className="payment-row">
                  <span>Payment status</span>
                  <strong>{order.paymentStatus || "Pending"}</strong>
                </div>
              </section>

              <div className="help-card">
                <Home size={18} />
                <div>
                  <strong>Need help?</strong>
                  <span>Contact support with your order ID {shortId(order._id)}.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            padding: 35px 20px 80px;
            background:
              radial-gradient(circle at 10% 5%, rgba(124,58,237,.2), transparent 28%),
              radial-gradient(circle at 90% 10%, rgba(6,182,212,.14), transparent 30%),
              linear-gradient(135deg,#080d20,#151330 50%,#092936);
            color: #f8fafc;
          }
          .shell { max-width: 1120px; margin: 0 auto; }
          .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 23px;
          }
          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #8ea0b9;
            font-size: 11px;
            font-weight: 900;
            text-decoration: none;
          }
          .back-link:hover { color: #67e8f9; }
          .refresh {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 38px;
            padding: 0 12px;
            border: 1px solid rgba(148,163,184,.15);
            border-radius: 9px;
            background: rgba(255,255,255,.045);
            color: #b9c6d8;
            font-size: 10px;
            font-weight: 900;
            cursor: pointer;
          }
          .refresh:disabled { opacity: .5; cursor: wait; }
          .spin { animation: spin 1s linear infinite; }
          .hero {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 18px;
          }
          .eyebrow {
            color: #67e8f9;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.7px;
          }
          h1 {
            margin: 7px 0 6px;
            font-size: clamp(32px,5vw,48px);
            line-height: 1;
            letter-spacing: -1.4px;
            font-weight: 900;
          }
          .hero p {
            margin: 0;
            color: #7f8da4;
            font-size: 11px;
          }
          .status-pill {
            display: inline-flex;
            padding: 8px 11px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 900;
          }
          .status-pill.pending { background: rgba(251,146,60,.11); color: #fdba74; }
          .status-pill.confirmed { background: rgba(96,165,250,.11); color: #93c5fd; }
          .status-pill.processing { background: rgba(167,139,250,.11); color: #c4b5fd; }
          .status-pill.shipped { background: rgba(34,211,238,.11); color: #67e8f9; }
          .status-pill.delivered { background: rgba(52,211,153,.11); color: #6ee7b7; }
          .status-pill.cancelled { background: rgba(248,113,113,.11); color: #fca5a5; }
          .error-banner {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 13px;
            padding: 10px 12px;
            border: 1px solid rgba(248,113,113,.22);
            border-radius: 10px;
            background: rgba(127,29,29,.22);
            color: #fecaca;
            font-size: 10px;
          }
          .tracking-card, .card {
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.13);
            border-radius: 17px;
            background: rgba(255,255,255,.05);
            box-shadow: 0 18px 55px rgba(0,0,0,.17);
            backdrop-filter: blur(14px);
          }
          .tracking-card { margin-bottom: 13px; }
          .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 16px 18px;
            border-bottom: 1px solid rgba(148,163,184,.08);
            color: #67e8f9;
          }
          .section-heading strong, .section-heading span { display: block; }
          .section-heading strong { color: #f2f7fc; font-size: 13px; }
          .section-heading span { margin-top: 3px; color: #687890; font-size: 9px; }
          .tracking {
            display: grid;
            grid-template-columns: repeat(5,1fr);
            padding: 27px 30px 25px;
          }
          .tracking-step {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .track-marker {
            position: relative;
            z-index: 2;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(148,163,184,.16);
            border-radius: 50%;
            background: #151c34;
            color: #65738a;
            font-size: 10px;
            font-weight: 900;
          }
          .track-marker.active {
            border-color: rgba(34,211,238,.38);
            background: linear-gradient(135deg,#0891b2,#4f46e5);
            color: white;
          }
          .track-marker.current {
            box-shadow: 0 0 0 5px rgba(34,211,238,.08);
          }
          .track-copy { margin-top: 9px; }
          .track-copy strong { display: block; color: #dce6f2; font-size: 10px; }
          .track-copy span { display: block; margin-top: 3px; color: #64738b; font-size: 8px; }
          .track-line {
            position: absolute;
            top: 17px;
            left: 50%;
            width: 100%;
            height: 2px;
            background: rgba(148,163,184,.11);
          }
          .track-line.active {
            background: linear-gradient(90deg,#22d3ee,#6366f1);
          }
          .cancelled {
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 23px;
          }
          .cancel-icon {
            width: 47px;
            height: 47px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: rgba(248,113,113,.1);
            color: #f87171;
          }
          .cancelled strong { color: #fca5a5; font-size: 13px; }
          .cancelled p { margin: 5px 0 0; color: #7e8ca3; font-size: 10px; }
          .content-grid {
            display: grid;
            grid-template-columns: minmax(0,1.55fr) minmax(290px,.75fr);
            gap: 13px;
          }
          .items { padding: 3px 18px; }
          .item {
            display: grid;
            grid-template-columns: 54px minmax(0,1fr) auto;
            align-items: center;
            gap: 11px;
            padding: 12px 0;
            border-bottom: 1px solid rgba(148,163,184,.07);
          }
          .item:last-child { border-bottom: 0; }
          .item-image {
            width: 54px;
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            border: 1px solid rgba(148,163,184,.11);
            border-radius: 11px;
            background: rgba(255,255,255,.035);
            color: #61718a;
          }
          .item-image img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
          .item-copy { min-width: 0; }
          .item-copy strong, .item-copy span { display: block; }
          .item-copy strong {
            overflow: hidden;
            color: #e8f0f8;
            font-size: 11px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .item-copy span { margin-top: 4px; color: #71809a; font-size: 9px; }
          .item-total { color: #bff7ff; font-size: 11px; white-space: nowrap; }
          .totals {
            padding: 13px 18px 18px;
            border-top: 1px solid rgba(148,163,184,.08);
          }
          .totals div {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 6px 0;
            color: #74839b;
            font-size: 10px;
          }
          .totals strong { color: #dce6f2; }
          .totals .grand {
            margin-top: 5px;
            padding-top: 11px;
            border-top: 1px dashed rgba(148,163,184,.1);
            color: #f2f7fc;
            font-size: 12px;
          }
          .totals .grand strong { color: #67e8f9; font-size: 16px; }
          .side-column { display: flex; flex-direction: column; gap: 13px; }
          .address { padding: 17px 18px 20px; }
          .address strong { color: #edf4fb; font-size: 12px; }
          .address p {
            margin: 6px 0 0;
            color: #8190a8;
            font-size: 10px;
            line-height: 1.55;
          }
          .address span {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            color: #71809a;
            font-size: 9px;
          }
          .summary-card { padding-bottom: 7px; }
          .payment-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 11px 18px;
            border-bottom: 1px solid rgba(148,163,184,.06);
            color: #77869e;
            font-size: 10px;
          }
          .payment-row strong { color: #dfe9f3; }
          .help-card {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 14px;
            border: 1px solid rgba(34,211,238,.11);
            border-radius: 14px;
            background: rgba(34,211,238,.045);
            color: #67e8f9;
          }
          .help-card strong, .help-card span { display: block; }
          .help-card strong { color: #dceff7; font-size: 10px; }
          .help-card span { margin-top: 4px; color: #71839b; font-size: 9px; line-height: 1.4; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (max-width: 800px) {
            .page { padding: 24px 14px 60px; }
            .hero { align-items: flex-start; flex-direction: column; }
            .content-grid { grid-template-columns: 1fr; }
            .tracking { padding: 20px 12px; }
            .track-copy span { display: none; }
          }
          @media (max-width: 520px) {
            .tracking { display: block; padding: 15px 20px; }
            .tracking-step {
              min-height: 58px;
              flex-direction: row;
              align-items: center;
              gap: 11px;
              text-align: left;
            }
            .track-line {
              top: 34px;
              bottom: -25px;
              left: 16px;
              width: 2px;
              height: auto;
            }
            .track-copy { margin-top: 0; }
            .track-copy span { display: block; }
            .item { grid-template-columns: 45px minmax(0,1fr) auto; }
            .item-image { width: 45px; height: 45px; }
          }
        `}</style>
      </main>
    </ProtectedRoute>
  );
}
