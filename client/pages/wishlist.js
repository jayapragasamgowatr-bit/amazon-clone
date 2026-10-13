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
          <div className="empty-card"><Heart size={48}/><h2>Your wishlist is empty</h2><p>Save products you want to keep an eye on.</p><Link href="/" className="primary">Browse Products</Link></div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((product) => {
              const insight = product?.wishlistInsights || {};
              const alert = alertFor(product._id);
              const stock = Number(product.countInStock || 0);
              return (
                <motion.article key={product._id} whileHover={{ y: -5 }} className="wishlist-card">
                  <button className="remove-button" onClick={() => toggleWishlist(product._id)} aria-label="Remove from wishlist"><Heart size={20} fill="currentColor"/></button>
                  <Link href={`/product/${product._id}`} className="image-wrap">
                    <img src={product.image || product.images?.[0] || "/file.svg"} alt={product.name} />
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
                          <div className="alert-controls"><span>₹</span><input type="number" min="0" max={Math.max(0, Number(product.price) - 1)} placeholder={`Below ${money(product.price)}`} value={alertTarget[product._id] || ""} onChange={(e) => setAlertTarget((s) => ({ ...s, [product._id]: e.target.value }))}/><button disabled={savingAlert === product._id} onClick={() => saveAlert(product)}>{savingAlert === product._id ? "Saving..." : "Notify Me"}</button></div>
                        </>
                      )}
                    </div>

                    <button className="cart-button" disabled={stock <= 0} onClick={() => stock > 0 && addToCart(product)}><ShoppingCart size={18}/> {stock > 0 ? "Add to Cart" : "Out of Stock"}</button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>
      <style jsx>{`
        .wishlist-page{max-width:1500px;margin:0 auto;padding:54px 24px 90px;color:#e5eefc}.wishlist-hero{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:34px}.eyebrow{font-size:11px;letter-spacing:.18em;color:#67e8f9;font-weight:800}.wishlist-hero h1{font-size:clamp(38px,5vw,64px);line-height:1;margin:10px 0 14px;font-weight:900}.wishlist-hero h1 span{color:#fb7185}.wishlist-hero p{color:#94a3b8;max-width:650px;font-size:16px}.hero-stat{min-width:150px;padding:20px;border:1px solid rgba(103,232,249,.12);background:rgba(15,23,42,.58);border-radius:18px;text-align:center}.hero-stat strong{display:block;font-size:30px}.hero-stat span{color:#64748b;font-size:12px}.notice{display:flex;justify-content:space-between;gap:15px;padding:13px 16px;border:1px solid rgba(103,232,249,.16);background:rgba(34,211,238,.05);border-radius:12px;margin-bottom:20px;color:#a5f3fc}.notice button{background:none;border:0;color:#94a3b8;cursor:pointer}.wishlist-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;align-items:stretch}.wishlist-card{position:relative;overflow:hidden;display:grid;grid-template-rows:249px 351px;height:600px;min-height:600px;box-sizing:border-box;padding:10px;border:1px solid rgba(148,163,184,.18);background:linear-gradient(145deg,rgba(15,23,42,.9),rgba(15,23,42,.62));border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.16);gap:10px}.remove-button{position:absolute;right:20px;top:20px;z-index:4;border:1px solid rgba(255,255,255,.12);background:rgba(2,6,23,.76);color:#fb7185;width:40px;height:40px;border-radius:50%;cursor:pointer}.wishlist-page .image-wrap{display:flex !important;align-items:center !important;justify-content:center !important;width:100% !important;height:249px !important;min-height:249px !important;max-height:249px !important;padding:12px !important;box-sizing:border-box !important;background:rgba(255,255,255,.055) !important;border:1px solid rgba(148,163,184,.14) !important;border-radius:14px !important;overflow:hidden !important}.wishlist-page .image-wrap img{display:block !important;width:100% !important;height:100% !important;max-width:100% !important;max-height:100% !important;min-width:0 !important;min-height:0 !important;object-fit:contain !important;object-position:center !important}.card-body{height:351px;min-height:351px;max-height:351px;padding:18px;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;background:rgba(255,255,255,.035);border:1px solid rgba(148,163,184,.12);border-radius:14px}.badges{min-height:25px;display:flex;flex-wrap:wrap;gap:7px}.badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:800}.badge.green{color:#86efac;background:rgba(34,197,94,.1)}.badge.blue{color:#7dd3fc;background:rgba(14,165,233,.1)}.badge.amber{color:#fcd34d;background:rgba(245,158,11,.1)}.card-body h2{font-size:20px;line-height:1.25;margin:12px 0 8px;color:#f8fafc;min-height:50px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.price-row{display:flex;align-items:center;gap:10px}.price-row strong{font-size:23px}.price-row del{color:#64748b;font-size:13px}.activity{display:flex;justify-content:space-between;gap:10px;margin-top:10px;color:#64748b;font-size:11px}.activity span{display:flex;align-items:center;gap:5px}.activity .in{color:#86efac}.activity .out{color:#fb7185}.alert-box{margin-top:17px;padding:12px;border:1px solid rgba(103,232,249,.1);background:rgba(2,6,23,.32);border-radius:13px}.alert-title,.alert-active>div{display:flex;align-items:center;gap:7px;color:#a5f3fc;font-size:12px}.alert-controls{display:flex;align-items:center;gap:6px;margin-top:9px}.alert-controls span{color:#64748b}.alert-controls input{min-width:0;flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.12);border-radius:8px;padding:9px;color:#e5e7eb}.alert-controls button,.alert-active button{border:0;border-radius:8px;padding:9px 11px;background:#0891b2;color:white;font-weight:800;font-size:11px;cursor:pointer}.alert-controls button:disabled{opacity:.5}.alert-active{display:flex;justify-content:space-between;align-items:center;gap:10px}.alert-active button{background:rgba(239,68,68,.12);color:#fca5a5}.cart-button{width:100%;margin-top:auto;padding:12px;border:0;border-radius:10px;background:linear-gradient(135deg,#0891b2,#2563eb);color:white;font-weight:800;display:flex;justify-content:center;align-items:center;gap:8px;cursor:pointer}.cart-button:disabled{opacity:.45;cursor:not-allowed}.empty-card{padding:90px 30px;text-align:center;border:1px solid rgba(148,163,184,.1);border-radius:20px;background:rgba(15,23,42,.55);color:#64748b}.empty-card h2{color:#f8fafc;font-size:30px;margin:18px 0 8px}.empty-card p{margin-bottom:24px}.primary{display:inline-block;padding:12px 18px;border-radius:10px;background:#0891b2;color:white;font-weight:800}@media(max-width:1000px){.wishlist-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.wishlist-page{padding:30px 15px 60px}.wishlist-card{height:auto;min-height:0;grid-template-rows:230px auto}.card-body{flex:none}.wishlist-hero{align-items:flex-start;flex-direction:column}.hero-stat{width:100%}.wishlist-grid{grid-template-columns:1fr}.wishlist-card{display:block;height:auto;min-height:0}.wishlist-page .image-wrap{height:230px !important;min-height:230px !important;max-height:230px !important}.card-body{height:auto;min-height:0;max-height:none}.alert-active{align-items:flex-start;flex-direction:column}}
      `}</style>
    </ProtectedRoute>
  );
}
