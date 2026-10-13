import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { getCustomerDashboard2 } from "../lib/api";
import Link from "next/link";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const orderId = (id) => `#${String(id || "").slice(-8).toUpperCase()}`;

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [e, setE] = useState("");

  useEffect(() => {
    getCustomerDashboard2().then(setD).catch((x) => setE(x.message || "Unable to load dashboard"));
  }, []);

  return (
    <ProtectedRoute>
      <main className="dashboard-page">
        <div className="dashboard-shell">
          <header className="hero">
            <div>
              <span className="eyebrow">CUSTOMER EXPERIENCE</span>
              <h1>Dashboard <span>2.0</span></h1>
              <p>Everything you need to track orders, spending and account activity in one place.</p>
            </div>
            <Link href="/products" className="shop-button">Continue Shopping →</Link>
          </header>

          {e && <div className="alert">{e}</div>}

          {!d && !e && <div className="loading-panel">Loading your dashboard…</div>}

          {d && (
            <>
              <section className="stats-grid">
                {[
                  ["Orders", d.summary?.orders || 0, "Total orders", "📦"],
                  ["Total Spent", money(d.summary?.totalSpent), "Lifetime spending", "₹"],
                  ["Active", d.summary?.pending || 0, "Orders in progress", "◷"],
                  ["Cancelled", d.summary?.cancelled || 0, "Cancelled orders", "×"],
                ].map(([label, value, caption, icon]) => (
                  <div className="stat-card" key={label}>
                    <div className="stat-top"><span className="stat-icon">{icon}</span><small>{label}</small></div>
                    <strong>{value}</strong>
                    <span>{caption}</span>
                  </div>
                ))}
              </section>

              <section className="content-grid">
                <div className="panel orders-panel">
                  <div className="panel-head">
                    <div><span className="section-kicker">ACTIVITY</span><h2>Recent Orders</h2></div>
                    <Link href="/orders">View all →</Link>
                  </div>
                  <div className="order-list">
                    {d.recentOrders?.map((o) => (
                      <Link href={`/orders/${o._id}`} className="order-row" key={o._id}>
                        <div className="order-main"><span className="order-number">{orderId(o._id)}</span><small>{new Date(o.createdAt).toLocaleDateString("en-IN")}</small></div>
                        <span className={`status status-${String(o.status || "").toLowerCase().replace(/\s+/g, "-")}`}>{o.status}</span>
                        <strong>{money(o.total)}</strong>
                        <span className="arrow">→</span>
                      </Link>
                    ))}
                    {!d.recentOrders?.length && <div className="empty"><span>📦</span><b>No orders yet</b><p>Your recent purchases will appear here.</p><Link href="/products">Browse products →</Link></div>}
                  </div>
                </div>

                <div className="panel wishlist-panel">
                  <div className="panel-head"><div><span className="section-kicker">SAVED FOR LATER</span><h2>Wishlist</h2></div><Link href="/wishlist">View all →</Link></div>
                  <div className="wishlist-list">
                    {d.wishlist?.slice(0, 5).map((p) => (
                      <Link href={`/product/${p._id}`} className="wish-row" key={p._id}>
                        <div className="wish-image"><img src={p.image} alt="" /></div>
                        <div><b>{p.name}</b><span>{money(p.price)}</span></div>
                        <span className="arrow">→</span>
                      </Link>
                    ))}
                    {!d.wishlist?.length && <div className="empty compact"><span>♡</span><b>Your wishlist is empty</b><p>Save products you want to compare later.</p><Link href="/products">Explore products →</Link></div>}
                  </div>
                </div>
              </section>

              <section className="quick-actions">
                <Link href="/orders"><span>📦</span><div><b>Track Orders</b><small>Check delivery status and history</small></div><strong>→</strong></Link>
                <Link href="/wishlist"><span>♡</span><div><b>Manage Wishlist</b><small>Review saved products and alerts</small></div><strong>→</strong></Link>
                <Link href="/profile"><span>◎</span><div><b>Account Settings</b><small>Update your profile and preferences</small></div><strong>→</strong></Link>
              </section>
            </>
          )}
        </div>

        <style jsx>{`
          .dashboard-page{min-height:calc(100vh - 90px);background:linear-gradient(135deg,#07111f 0%,#10172d 52%,#102c3d 100%);color:#f8fafc;padding:42px 0 80px}
          .dashboard-shell{width:min(1240px,calc(100% - 48px));margin:0 auto}
          .hero{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;padding:10px 0 30px;border-bottom:1px solid rgba(148,163,184,.14)}
          .eyebrow,.section-kicker{font-size:11px;letter-spacing:.16em;font-weight:800;color:#38bdf8}
          h1{margin:8px 0 8px;font-size:38px;line-height:1.1;letter-spacing:-.04em}.hero h1 span{color:#38bdf8}.hero p{margin:0;color:#94a3b8;font-size:15px}
          .shop-button{padding:13px 18px;border-radius:12px;text-decoration:none;color:#fff;font-weight:800;background:linear-gradient(135deg,#0ea5e9,#6366f1);box-shadow:0 12px 30px rgba(14,165,233,.16)}
          .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
          .stat-card{padding:20px 22px;border:1px solid rgba(148,163,184,.14);border-radius:18px;background:rgba(11,19,41,.82);box-shadow:0 14px 35px rgba(0,0,0,.12)}
          .stat-top{display:flex;align-items:center;gap:10px;color:#94a3b8}.stat-top small{font-size:12px;font-weight:700}.stat-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:rgba(56,189,248,.1);color:#38bdf8}.stat-card strong{display:block;font-size:29px;margin:15px 0 5px}.stat-card>span:last-child{font-size:12px;color:#64748b}
          .content-grid{display:grid;grid-template-columns:1.45fr .85fr;gap:18px}.panel{border:1px solid rgba(148,163,184,.14);border-radius:18px;background:rgba(8,17,36,.88);overflow:hidden}.panel-head{display:flex;justify-content:space-between;align-items:center;padding:21px 22px;border-bottom:1px solid rgba(148,163,184,.12)}.panel-head h2{margin:5px 0 0;font-size:19px}.panel-head a{font-size:13px;color:#38bdf8;text-decoration:none;font-weight:700}
          .order-row{display:grid;grid-template-columns:1.6fr auto auto 22px;align-items:center;gap:15px;padding:17px 22px;color:#fff;text-decoration:none;border-bottom:1px solid rgba(148,163,184,.09);transition:.18s}.order-row:last-child{border-bottom:0}.order-row:hover,.wish-row:hover{background:rgba(56,189,248,.045)}.order-main{display:flex;flex-direction:column;gap:5px}.order-number{font-weight:800}.order-main small{color:#64748b;font-size:12px}.order-row>strong{font-size:14px}.arrow{color:#64748b}.status{font-size:11px;padding:6px 9px;border-radius:999px;background:rgba(56,189,248,.1);color:#67e8f9;font-weight:800;white-space:nowrap}
          .wishlist-list{padding:5px 0}.wish-row{display:grid;grid-template-columns:48px 1fr 20px;gap:12px;align-items:center;padding:13px 18px;color:#fff;text-decoration:none;border-bottom:1px solid rgba(148,163,184,.09)}.wish-image{width:48px;height:48px;border-radius:10px;background:#111827;overflow:hidden;display:grid;place-items:center}.wish-image img{width:100%;height:100%;object-fit:contain}.wish-row b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wish-row span{display:block;color:#94a3b8;font-size:12px;margin-top:4px}.wish-row .arrow{display:block}
          .empty{text-align:center;padding:46px 20px;color:#64748b}.empty>span{display:block;font-size:28px;margin-bottom:10px}.empty b{display:block;color:#e2e8f0}.empty p{margin:7px 0 14px;font-size:13px}.empty a{color:#38bdf8;text-decoration:none;font-size:13px;font-weight:700}.empty.compact{padding:38px 20px}.quick-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}.quick-actions a{display:grid;grid-template-columns:38px 1fr 20px;align-items:center;gap:12px;padding:17px;border:1px solid rgba(148,163,184,.14);border-radius:16px;background:rgba(11,19,41,.72);color:#fff;text-decoration:none}.quick-actions a>span{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:rgba(99,102,241,.12);color:#818cf8}.quick-actions b{display:block;font-size:13px}.quick-actions small{display:block;color:#64748b;margin-top:4px}.quick-actions strong{color:#64748b}.alert{padding:14px 16px;margin:20px 0;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#fca5a5}.loading-panel{margin-top:24px;padding:50px;text-align:center;border:1px solid rgba(148,163,184,.14);border-radius:18px;background:rgba(8,17,36,.8);color:#94a3b8}
          @media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr)}.content-grid{grid-template-columns:1fr}.quick-actions{grid-template-columns:1fr}.hero{align-items:flex-start;flex-direction:column}.order-row{grid-template-columns:1fr auto}.order-row>strong,.order-row>.arrow{display:none}}@media(max-width:560px){.dashboard-shell{width:min(100% - 28px,1240px)}.stats-grid{grid-template-columns:1fr}.hero h1{font-size:30px}.order-row{gap:8px}.order-row .status{font-size:10px}}
        `}</style>
      </main>
    </ProtectedRoute>
  );
}
