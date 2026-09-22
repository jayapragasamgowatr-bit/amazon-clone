import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, MessageSquare, Pencil, RefreshCw, Star, Trash2, X } from "lucide-react";

import ProtectedRoute from "../../components/ProtectedRoute";
import { getAdminProducts, getProductById, updateProductReview, deleteProductReview } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const safeArray = (value) => (Array.isArray(value) ? value : []);

const getReviewId = (review) => review?._id || review?.id;

export default function AdminReviews() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [editReview, setEditReview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.isAdmin !== true && user.role !== "admin") {
      toast.error("Admin access only");
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingProducts(true);
      const data = await getAdminProducts({ page: 1, limit: 100, search: search.trim() });
      const list = safeArray(data?.products);
      setProducts(list);
      if (!productId && list.length) {
        const requested = router.query.product;
        const selected = requested && list.some((item) => String(item._id) === String(requested))
          ? String(requested)
          : String(list[0]._id);
        setProductId(selected);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [user, search, productId, router.query.product]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [user, loadProducts]);

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null);
      return;
    }
    try {
      setLoadingProduct(true);
      const data = await getProductById(productId);
      setProduct(data?.product || data || null);
    } catch (error) {
      toast.error(error?.message || "Failed to load reviews");
      setProduct(null);
    } finally {
      setLoadingProduct(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId, loadProduct]);

  const reviews = useMemo(() => {
    return safeArray(product?.reviews).slice().sort((a, b) => {
      return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
    });
  }, [product]);

  const handleProductChange = (value) => {
    setProductId(value);
    router.replace({ pathname: "/admin/reviews", query: { product: value } }, undefined, { shallow: true });
  };

  const openEdit = (review) => {
    setEditReview({
      ...review,
      rating: Number(review?.rating || 1),
      comment: review?.comment || "",
    });
  };

  const saveReview = async (event) => {
    event.preventDefault();
    if (!productId || !getReviewId(editReview)) return;

    const rating = Number(editReview.rating);
    const comment = String(editReview.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      toast.error("Rating must be between 1 and 5.");
      return;
    }
    if (comment.length > 1000) {
      toast.error("Review comment cannot exceed 1000 characters.");
      return;
    }

    try {
      setSaving(true);
      await updateProductReview(productId, getReviewId(editReview), { rating, comment });
      toast.success("Review updated successfully.");
      setEditReview(null);
      await loadProduct();
    } catch (error) {
      toast.error(error?.message || "Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  const removeReview = async (review) => {
    const reviewId = getReviewId(review);
    if (!productId || !reviewId) return;

    if (!window.confirm(`Delete this review by ${review?.name || "this customer"}?`)) return;

    try {
      setDeletingId(reviewId);
      await deleteProductReview(productId, reviewId);
      toast.success("Review deleted successfully.");
      await loadProduct();
    } catch (error) {
      toast.error(error?.message || "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadProducts();
      await loadProduct();
      toast.success("Reviews refreshed.");
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading || loadingProducts) {
    return (
      <ProtectedRoute>
        <div className="loading"><div className="loader" />Loading reviews...</div>
        <style jsx>{`.loading{min-height:70vh;display:flex;align-items:center;justify-content:center;gap:12px;color:#dbeafe;font-weight:800}.loader{width:34px;height:34px;border:4px solid rgba(56,189,248,.15);border-top-color:#38bdf8;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="page">
        <div className="shell">
          <header className="header">
            <div>
              <div className="eyebrow">ADMIN PANEL</div>
              <h1>Customer Reviews</h1>
              <p>Edit or remove customer reviews from your products.</p>
            </div>
            <div className="header-actions">
              <Link href="/admin/products" className="secondary"><ArrowLeft size={16}/> Products</Link>
              <button className="secondary" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "spin" : ""}/> Refresh</button>
            </div>
          </header>

          <section className="selector-card">
            <div className="search-wrap">
              <label>Find Product</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />
            </div>
            <div className="select-wrap">
              <label>Select Product</label>
              <select value={productId} onChange={(e) => handleProductChange(e.target.value)}>
                <option value="">Choose a product</option>
                {products.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.numReviews || 0} reviews)</option>)}
              </select>
            </div>
          </section>

          {product && (
            <section className="product-card">
              <div className="product-heading">
                <div className="product-image">{product.image ? <img src={product.image} alt=""/> : <MessageSquare size={25}/>}</div>
                <div>
                  <h2>{product.name}</h2>
                  <div className="meta">{product.category || "Uncategorized"} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</div>
                </div>
                <div className="rating-summary"><Star size={18} fill="currentColor"/> {Number(product.rating || 0).toFixed(1)}</div>
              </div>

              {loadingProduct ? <div className="empty">Loading reviews...</div> : reviews.length === 0 ? (
                <div className="empty"><MessageSquare size={32}/><strong>No reviews for this product.</strong><span>Customer reviews will appear here after they are submitted.</span></div>
              ) : (
                <div className="review-list">
                  {reviews.map((review) => (
                    <article className="review" key={getReviewId(review)}>
                      <div className="review-main">
                        <div className="review-top">
                          <strong>{review?.name || "Customer"}</strong>
                          <span className="date">{review?.createdAt ? new Date(review.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : ""}</span>
                        </div>
                        <div className="stars" aria-label={`${review.rating} out of 5 stars`}>
                          {[1,2,3,4,5].map((star) => <span key={star} className={star <= Number(review.rating) ? "filled" : "empty-star"}>★</span>)}
                          <b>{Number(review.rating).toFixed(0)}/5</b>
                        </div>
                        <p>{review.comment || "No comment provided."}</p>
                      </div>
                      <div className="review-actions">
                        <button className="edit-btn" onClick={() => openEdit(review)} title="Edit review"><Pencil size={16}/> Edit</button>
                        <button className="delete-btn" onClick={() => removeReview(review)} disabled={deletingId === getReviewId(review)} title="Delete review"><Trash2 size={16}/> {deletingId === getReviewId(review) ? "Deleting..." : "Delete"}</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {editReview && (
          <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setEditReview(null); }}>
            <div className="modal">
              <div className="modal-header"><div><div className="eyebrow">REVIEW MANAGEMENT</div><h2>Edit Customer Review</h2></div><button className="close" onClick={() => setEditReview(null)} disabled={saving}><X size={20}/></button></div>
              <form onSubmit={saveReview}>
                <div className="customer-line"><span>Customer</span><strong>{editReview.name || "Customer"}</strong></div>
                <label>Rating</label>
                <div className="rating-picker">
                  {[1,2,3,4,5].map((star) => <button type="button" key={star} className={star <= Number(editReview.rating) ? "selected" : ""} onClick={() => setEditReview((prev) => ({...prev, rating: star}))} aria-label={`${star} star`}>★</button>)}
                </div>
                <label>Comment</label>
                <textarea rows={6} maxLength={1000} value={editReview.comment || ""} onChange={(e) => setEditReview((prev) => ({...prev, comment: e.target.value}))} placeholder="Customer review comment..." />
                <div className="counter">{String(editReview.comment || "").length}/1000</div>
                <div className="modal-actions"><button type="button" className="secondary" onClick={() => setEditReview(null)} disabled={saving}>Cancel</button><button type="submit" className="save" disabled={saving}>{saving ? "Saving..." : "Save Review"}</button></div>
              </form>
            </div>
          </div>
        )}

        <style jsx>{`
          .page{min-height:100vh;padding:35px 20px 80px;color:#f8fafc;background:radial-gradient(circle at 8% 5%,rgba(124,58,237,.20),transparent 28%),radial-gradient(circle at 92% 12%,rgba(6,182,212,.15),transparent 30%),linear-gradient(135deg,#090f22 0%,#151331 48%,#092b3b 100%)}
          .shell{max-width:1300px;margin:0 auto}.header{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:22px}.eyebrow{color:#67e8f9;font-size:11px;font-weight:900;letter-spacing:1.7px;margin-bottom:7px}h1{margin:0;font-size:clamp(32px,4vw,48px);font-weight:900;letter-spacing:-1px}.header p{margin:8px 0 0;color:#9eabc0;font-size:14px}.header-actions{display:flex;gap:9px;flex-wrap:wrap}.secondary,.save,.edit-btn,.delete-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:10px;padding:10px 14px;font:inherit;font-size:11px;font-weight:900;cursor:pointer;text-decoration:none}.secondary{border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.055);color:#e6edf8}.secondary:disabled{opacity:.5;cursor:wait}.selector-card,.product-card{border:1px solid rgba(148,163,184,.14);background:rgba(255,255,255,.052);border-radius:18px;box-shadow:0 20px 55px rgba(0,0,0,.18);backdrop-filter:blur(15px)}.selector-card{display:grid;grid-template-columns:1fr 1.5fr;gap:14px;padding:18px;margin-bottom:14px}.selector-card label,.modal label{display:block;margin-bottom:7px;color:#91a0b7;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.7px}.selector-card input,.selector-card select,.modal textarea{width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.17);border-radius:10px;outline:none;background:rgba(255,255,255,.045);color:#eef5fc;padding:12px;font:inherit;font-size:12px}.selector-card select option{background:#10172c}.product-card{overflow:hidden}.product-heading{display:flex;align-items:center;gap:13px;padding:18px 20px;border-bottom:1px solid rgba(148,163,184,.09)}.product-image{width:52px;height:52px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:12px;border:1px solid rgba(148,163,184,.14);background:rgba(255,255,255,.04);color:#67e8f9}.product-image img{width:100%;height:100%;object-fit:contain}.product-heading h2{margin:0;font-size:17px}.meta{margin-top:4px;color:#71809a;font-size:10px}.rating-summary{margin-left:auto;display:flex;align-items:center;gap:5px;color:#facc15;font-weight:900}.review-list{padding:4px 20px}.review{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:18px 0;border-bottom:1px solid rgba(148,163,184,.08)}.review:last-child{border-bottom:0}.review-main{min-width:0}.review-top{display:flex;align-items:center;gap:12px}.review-top strong{color:#f1f5f9;font-size:13px}.date{color:#65738b;font-size:9px}.stars{display:flex;align-items:center;gap:2px;margin:7px 0}.stars span{font-size:15px}.filled{color:#facc15}.empty-star{color:#40506a}.stars b{margin-left:5px;color:#8390a6;font-size:9px}.review p{margin:7px 0 0;color:#aeb9ca;font-size:12px;line-height:1.65;white-space:pre-wrap}.review-actions{display:flex;gap:7px;flex-shrink:0}.edit-btn{border:1px solid rgba(56,189,248,.25);background:rgba(56,189,248,.08);color:#67e8f9}.delete-btn{border:1px solid rgba(248,113,113,.25);background:rgba(248,113,113,.08);color:#fca5a5}.delete-btn:disabled{opacity:.5;cursor:wait}.empty{min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#70809a;font-size:11px}.empty svg{color:#52617a}.overlay{position:fixed;inset:0;z-index:9999;padding:20px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)}.modal{width:min(620px,100%);max-height:90vh;overflow:auto;border:1px solid rgba(148,163,184,.18);border-radius:20px;background:#081426;box-shadow:0 30px 90px rgba(0,0,0,.5)}.modal-header{display:flex;justify-content:space-between;align-items:center;padding:20px;border-bottom:1px solid rgba(148,163,184,.12);position:sticky;top:0;background:#081426;z-index:2}.modal-header h2{margin:0;font-size:22px}.close{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(148,163,184,.16);border-radius:10px;background:rgba(255,255,255,.05);color:#dce7f4;cursor:pointer}.modal form{padding:20px}.customer-line{display:flex;align-items:center;justify-content:space-between;padding:12px 13px;margin-bottom:18px;border-radius:10px;background:rgba(255,255,255,.04);font-size:11px}.customer-line span{color:#74839a}.rating-picker{display:flex;gap:7px;margin:0 0 20px}.rating-picker button{border:0;background:transparent;color:#42516a;font-size:34px;line-height:1;cursor:pointer;padding:0}.rating-picker button.selected{color:#facc15}.modal textarea{resize:vertical;line-height:1.6}.counter{margin-top:5px;color:#68768d;font-size:9px;text-align:right}.modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}.save{border:0;background:linear-gradient(135deg,#0ea5e9,#4f46e5);color:white}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:750px){.header{align-items:flex-start;flex-direction:column}.selector-card{grid-template-columns:1fr}.review{flex-direction:column}.review-actions{width:100%}.review-actions button{flex:1}.product-heading{align-items:flex-start}.rating-summary{margin-left:auto}.modal-actions{flex-direction:column-reverse}.modal-actions button{width:100%}}
        `}</style>
      </main>
    </ProtectedRoute>
  );
}
