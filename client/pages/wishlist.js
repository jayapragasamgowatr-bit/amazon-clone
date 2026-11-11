import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProtectedRoute from "../components/ProtectedRoute";
import { useWishlist } from "../context/WishlistContext";
import useCartStore from "../store/cartStore";
import { Heart, ShoppingCart, Bell, TrendingDown, PackageCheck, Eye, X } from "lucide-react";
import SEO from "../components/SEO";
import { trackEvent } from "../lib/eventTracker";
import { createPriceAlert, deletePriceAlert, getPriceAlerts } from "../lib/api";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const addToCart = useCartStore((state) => state.addToCart);
  const [alerts, setAlerts] = useState([]);
  const [alertTarget, setAlertTarget] = useState({});
  const [savingAlert, setSavingAlert] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const loadAlerts = async () => {
    try {
      const data = await getPriceAlerts();
      setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
    } catch { setAlerts([]); }
  };

  useEffect(() => { loadAlerts(); }, []);

  const alertFor = (productId) => alerts.find((a) => String(a?.product?._id || a?.product) === String(productId));

  const saveAlert = async (product) => {
    const target = Number(alertTarget[product._id]);
    if (!Number.isFinite(target) || target < 0 || target >= Number(product.price)) {
      setAlertMessage(`Target price must be lower than ${money(product.price)}.`);
      return;
    }
    try {
      setSavingAlert(product._id); setAlertMessage("");
      await createPriceAlert(product._id, target);
      await loadAlerts();
      setAlertMessage("Price-drop alert saved. We will email you when the target is reached.");
      trackEvent("price_alert_created", { productId: product._id, category: product.category, metadata: { targetPrice: target } });
    } catch (error) { setAlertMessage(error?.message || "Unable to save price alert."); }
    finally { setSavingAlert(""); }
  };

  const removeAlert = async (alert) => {
    try { await deletePriceAlert(alert._id); await loadAlerts(); }
    catch (error) { setAlertMessage(error?.message || "Unable to remove price alert."); }
  };

  return (
    <ProtectedRoute>
      <SEO title="My Wishlist | Waventra Vetric" description="Your saved Waventra Vetric products." path="/wishlist" noIndex />
      <main className="wishlist-page">
        <section className="wishlist-hero">
          <div>
            <span className="eyebrow">YOUR COLLECTION</span>
            <h1>My Wishlist <span>♥</span></h1>
            <p>Save products, watch price changes and get notified when the right deal arrives.</p>
          </div>
          <div className="hero-stat"><strong>{wishlist.length}</strong><span>Saved products</span></div>
        </section>

        {alertMessage && <div className="notice">{alertMessage}<button onClick={() => setAlertMessage("")}><X size={16}/></button></div>}

        {wishlist.length === 0 ? (
          <div className="empty-card"><Heart size={48}/><h2>Your wishlist is empty</h2><p>Save products you want to keep an eye on.</p><Link href="/products" className="primary">Browse products</Link></div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((product) => {
              const insight = product?.wishlistInsights || {};
              const alert = alertFor(product._id);
              const stock = Number(product.countInStock || 0);
              return (
                <motion.article key={product._id} whileHover={{ y: -5 }} className="wishlist-card">
                  <button type="button" className="remove-button" onClick={() => toggleWishlist(product._id)} aria-label="Remove from wishlist"><Heart size={18} fill="currentColor"/></button>
                  <Link href={`/product/${product._id}`} className="image-wrap">
                    <img src={product.images?.[0] || product.image || "/file.svg"} alt={product.name} loading="lazy" />
                  </Link>
                  <div className="card-body">
                    <div className="badges">
                      {insight.priceDrop > 0 && <span className="badge green"><TrendingDown size={13}/> Price dropped {money(insight.priceDrop)}</span>}
                      {insight.backInStock && <span className="badge blue"><PackageCheck size={13}/> Back in stock</span>}
                      {insight.lowStock && <span className="badge amber">Only {stock} left</span>}
                    </div>
                    <Link href={`/product/${product._id}`}><h2>{product.name}</h2></Link>
                    <div className="price-row"><strong>{money(product.price)}</strong>{insight.priceDrop > 0 && <del>{money(insight.addedPrice)}</del>}</div>
                    <div className="activity"><span><Eye size={14}/> Viewed {Number(insight.viewCount || 0)} time{Number(insight.viewCount || 0) === 1 ? "" : "s"}</span><span className={stock > 0 ? "in" : "out"}>{stock > 0 ? `${stock} in stock` : "Out of stock"}</span></div>

                    <div className="alert-box">
                      {alert ? (
                        <div className="alert-active"><div><Bell size={17}/><span>Target {money(alert.targetPrice)}</span></div><button onClick={() => removeAlert(alert)}>Remove alert</button></div>
                      ) : (
                        <>
                          <div className="alert-title"><Bell size={17}/><strong>Price-drop alert</strong></div>
                          <div className="alert-controls"><span>₹</span><input type="number" min="0" max={Math.max(0, Number(product.price) - 1)} placeholder={`Below ${money(product.price)}`} value={alertTarget[product._id] || ""} onChange={(e) => setAlertTarget((s) => ({ ...s, [product._id]: e.target.value }))}/><button disabled={savingAlert === product._id} onClick={() => saveAlert(product)}>{savingAlert === product._id ? "Saving..." : "Notify me"}</button></div>
                        </>
                      )}
                    </div>

                    <button className="cart-button" disabled={stock <= 0} onClick={() => stock > 0 && addToCart(product)}><ShoppingCart size={18}/> {stock > 0 ? "Add to cart" : "Out of stock"}</button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>
      {/* Global (prefixed with .wishlist-page) because the card and image are rendered by
          <motion.article> and <Link>, which scoped styles do not reach. */}
      <style jsx global>{`
        .wishlist-page { width: min(1400px, calc(100% - 40px)); margin: 0 auto; padding: 48px 0 90px; color: #e5eefc; }
        .wishlist-page button::before { display: none; }
        .wishlist-page button:hover { transform: none; filter: none; box-shadow: none; }
        .wishlist-page button svg, .wishlist-page a svg { width: 1em; height: 1em; min-width: 0; min-height: 0; }
        .wishlist-page .wishlist-hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 28px; }
        .wishlist-page .eyebrow { font-size: 11px; letter-spacing: 0.16em; color: #67e8f9; font-weight: 800; }
        .wishlist-page .wishlist-hero h1 { font-size: clamp(30px, 4.6vw, 42px); line-height: 1.1; letter-spacing: -0.03em; margin: 10px 0 8px; font-weight: 900; }
        .wishlist-page .wishlist-hero h1 span { color: #fb7185; }
        .wishlist-page .wishlist-hero p { margin: 0; color: #94a3b8; max-width: 650px; font-size: 16px; line-height: 1.6; }
        .wishlist-page .hero-stat { min-width: 140px; padding: 16px 20px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.06); border-radius: 18px; text-align: center; }
        .wishlist-page .hero-stat strong { display: block; font-size: 28px; font-variant-numeric: tabular-nums; }
        .wishlist-page .hero-stat span { color: #94a3b8; font-size: 12px; }
        .wishlist-page .notice { display: flex; justify-content: space-between; align-items: center; gap: 15px; padding: 12px 16px; border: 1px solid rgba(103, 232, 249, 0.2); background: rgba(34, 211, 238, 0.06); border-radius: 12px; margin-bottom: 20px; color: #a5f3fc; font-size: 14px; }
        .wishlist-page .notice button { padding: 4px; background: none; border: 0; color: #94a3b8; cursor: pointer; }

        /* Same card rhythm as the product grid on the home page. */
        .wishlist-page .wishlist-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 20px; align-items: stretch; }
        .wishlist-page .wishlist-card { position: relative; display: flex; flex-direction: column; gap: 12px; height: 100%; padding: 12px; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(14px); border-radius: 22px; }
        .wishlist-page .remove-button { position: absolute; right: 22px; top: 22px; z-index: 4; display: grid; place-items: center; width: 38px; height: 38px; padding: 0; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 50%; background: rgba(2, 6, 23, 0.72); color: #fb7185; font-size: 18px; cursor: pointer; }
        .wishlist-page .remove-button:hover { background: rgba(251, 113, 133, 0.2); }
        .wishlist-page .image-wrap { flex: none; display: flex; align-items: center; justify-content: center; width: 100%; height: 190px; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 14px; overflow: hidden; }
        .wishlist-page .image-wrap img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: center; }
        .wishlist-page .card-body { flex: 1; display: flex; flex-direction: column; padding: 4px 6px 6px; min-width: 0; }
        .wishlist-page .badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .wishlist-page .badges:empty { display: none; }
        .wishlist-page .badge { display: inline-flex; align-items: center; gap: 5px; border-radius: 999px; padding: 4px 9px; font-size: 11px; font-weight: 700; margin-bottom: 8px; }
        .wishlist-page .badge.green { color: #86efac; background: rgba(34, 197, 94, 0.12); }
        .wishlist-page .badge.blue { color: #7dd3fc; background: rgba(14, 165, 233, 0.12); }
        .wishlist-page .badge.amber { color: #fcd34d; background: rgba(245, 158, 11, 0.12); }
        .wishlist-page .card-body h2 { font-size: 16px; font-weight: 800; line-height: 1.35; margin: 0 0 8px; color: #f8fafc; min-height: 2.7em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .wishlist-page .card-body a:hover h2 { color: #7dd3fc; }
        .wishlist-page .price-row { display: flex; align-items: baseline; gap: 10px; font-variant-numeric: tabular-nums; }
        .wishlist-page .price-row strong { font-size: 20px; }
        .wishlist-page .price-row del { color: #64748b; font-size: 13px; }
        .wishlist-page .activity { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; color: #94a3b8; font-size: 12px; }
        .wishlist-page .activity span { display: inline-flex; align-items: center; gap: 5px; }
        .wishlist-page .activity .in { color: #4ade80; font-weight: 600; }
        .wishlist-page .activity .out { color: #f87171; font-weight: 600; }
        .wishlist-page .alert-box { margin: 14px 0; padding: 12px; border: 1px solid rgba(103, 232, 249, 0.14); background: rgba(2, 6, 23, 0.32); border-radius: 14px; }
        .wishlist-page .alert-title, .wishlist-page .alert-active > div { display: flex; align-items: center; gap: 7px; color: #a5f3fc; font-size: 13px; }
        .wishlist-page .alert-controls { display: flex; align-items: center; gap: 6px; margin-top: 9px; }
        .wishlist-page .alert-controls > span { color: #64748b; }
        .wishlist-page .alert-controls input { min-width: 0; flex: 1; width: auto; height: 38px; padding: 0 10px; background: rgba(255, 255, 255, 0.05); backdrop-filter: none; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 10px; color: #e5e7eb; font-size: 13px; }
        .wishlist-page .alert-controls button, .wishlist-page .alert-active button { flex: none; height: 38px; padding: 0 12px; border: 0; border-radius: 10px; background: #0891b2; color: #fff; font-weight: 800; font-size: 12px; white-space: nowrap; cursor: pointer; }
        .wishlist-page .alert-controls button:disabled { opacity: 0.5; }
        .wishlist-page .alert-active { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .wishlist-page .alert-active button { background: rgba(239, 68, 68, 0.14); color: #fca5a5; }
        .wishlist-page .cart-button { width: 100%; height: 46px; margin-top: auto; padding: 0 12px; border: 0; border-radius: 12px; background: linear-gradient(135deg, #0891b2, #2563eb); color: #fff; font-size: 14px; font-weight: 800; display: flex; justify-content: center; align-items: center; gap: 8px; cursor: pointer; }
        .wishlist-page .cart-button:hover { filter: brightness(1.1); }
        .wishlist-page .cart-button:disabled { background: rgba(148, 163, 184, 0.16); color: #94a3b8; cursor: not-allowed; filter: none; }
        .wishlist-page .empty-card { padding: 72px 24px; text-align: center; border: 1px dashed rgba(148, 163, 184, 0.28); border-radius: 22px; color: #94a3b8; }
        .wishlist-page .empty-card h2 { color: #f8fafc; font-size: 26px; margin: 16px 0 8px; }
        .wishlist-page .empty-card p { margin: 0 0 22px; }
        .wishlist-page .primary { display: inline-flex; align-items: center; height: 46px; padding: 0 20px; border-radius: 12px; background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; font-weight: 800; }
        .wishlist-page button:focus-visible, .wishlist-page a:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
        @media (max-width: 650px) {
          .wishlist-page { width: calc(100% - 24px); padding: 28px 0 60px; }
          .wishlist-page .wishlist-hero { align-items: flex-start; flex-direction: column; }
          .wishlist-page .hero-stat { width: 100%; }
          .wishlist-page .alert-active { align-items: flex-start; flex-direction: column; }
        }
      `}</style>
    </ProtectedRoute>
  );
}
