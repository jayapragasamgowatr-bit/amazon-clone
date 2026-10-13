import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, X, Trash2 } from "lucide-react";

export const RECENTLY_VIEWED_KEY = "wv_recently_viewed_products";
const MAX_RECENTLY_VIEWED = 8;

export function saveRecentlyViewedProduct(product) {
  if (typeof window === "undefined" || !product?._id) return;

  try {
    const existing = JSON.parse(
      localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"
    );

    const normalized = {
      _id: String(product._id),
      name: product.name || "Product",
      price: Number(product.price || 0),
      image:
        (Array.isArray(product.images) && product.images[0]) ||
        product.image ||
        "",
      images: Array.isArray(product.images) ? product.images.slice(0, 5) : [],
      category: product.category || "Product",
      rating: Number(product.rating || 0),
      numReviews: Number(product.numReviews || 0),
    };

    const next = [
      normalized,
      ...existing.filter((item) => String(item?._id) !== String(product._id)),
    ].slice(0, MAX_RECENTLY_VIEWED);

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("wv:recently-viewed-updated"));
  } catch (error) {
    console.warn("RECENTLY VIEWED SAVE ERROR:", error);
  }
}

function readRecentlyViewed() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]"
    );

    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTLY_VIEWED) : [];
  } catch {
    return [];
  }
}

export default function RecentlyViewedSection() {
  const [products, setProducts] = useState([]);

  const refresh = () => setProducts(readRecentlyViewed());

  useEffect(() => {
    refresh();

    const handleStorage = (event) => {
      if (!event.key || event.key === RECENTLY_VIEWED_KEY) refresh();
    };

    const handleCustomUpdate = () => refresh();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("wv:recently-viewed-updated", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "wv:recently-viewed-updated",
        handleCustomUpdate
      );
    };
  }, []);

  const visibleProducts = useMemo(
    () => products.filter((product) => product?._id),
    [products]
  );

  const removeProduct = (productId) => {
    const next = visibleProducts.filter(
      (product) => String(product._id) !== String(productId)
    );
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
    setProducts(next);
  };

  const clearAll = () => {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    setProducts([]);
  };

  if (!visibleProducts.length) return null;

  return (
    <section className="recently-viewed-section" aria-label="Recently Viewed Products">
      <div className="recently-viewed-header">
        <div>
          <div className="recently-viewed-title-row">
            <span className="recently-viewed-icon">
              <Clock3 size={19} />
            </span>
            <h2>Recently Viewed</h2>
          </div>
          <p>Pick up where you left off.</p>
        </div>

        <button type="button" className="recently-clear" onClick={clearAll}>
          <Trash2 size={15} />
          Clear All
        </button>
      </div>

      <div className="recently-viewed-grid">
        {visibleProducts.map((product) => (
          <div className="recently-card-wrap" key={product._id}>
            <Link href={`/product/${product._id}`} className="recently-card">
              <div className="recently-image-wrap">
                {product.image ? (
                  <img src={product.image} alt={product.name || "Product"} />
                ) : (
                  <div className="recently-image-empty">No image</div>
                )}
              </div>

              <div className="recently-body">
                <small>{product.category || "Product"}</small>
                <h3>{product.name || "Product"}</h3>
                <strong>
                  ₹{Number(product.price || 0).toLocaleString("en-IN")}
                </strong>
                {Number(product.rating || 0) > 0 && (
                  <span>
                    {Number(product.rating).toFixed(1)} ★ · {Number(product.numReviews || 0)} reviews
                  </span>
                )}
              </div>
            </Link>

            <button
              type="button"
              className="recently-remove"
              aria-label={`Remove ${product.name || "product"} from recently viewed`}
              onClick={() => removeProduct(product._id)}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .recently-viewed-section {
          margin-top: 55px;
          padding: 26px;
          border: 1px solid rgba(14, 165, 233, 0.13);
          border-radius: 24px;
          background: linear-gradient(
            135deg,
            rgba(8, 47, 73, 0.42),
            rgba(15, 23, 42, 0.72)
          );
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.12);
        }

        .recently-viewed-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }

        .recently-viewed-title-row {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .recently-viewed-title-row h2 {
          margin: 0;
          font-size: clamp(23px, 3vw, 30px);
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .recently-viewed-title-row h2,
        .recently-viewed-section p,
        .recently-body h3,
        .recently-body strong,
        .recently-body span,
        .recently-body small {
          color: inherit;
        }

        .recently-viewed-icon {
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          color: #67e8f9;
          background: rgba(34, 211, 238, 0.1);
        }

        .recently-viewed-section p {
          margin: 7px 0 0 47px;
          opacity: 0.62;
          font-size: 13px;
        }

        .recently-clear {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 9px 12px;
          color: inherit;
          background: rgba(255, 255, 255, 0.045);
          cursor: pointer;
          font-weight: 800;
        }

        .recently-clear:hover {
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .recently-viewed-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 14px;
        }

        .recently-card-wrap {
          position: relative;
          min-width: 0;
        }

        .recently-card {
          display: block;
          height: 100%;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 17px;
          color: inherit;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.035);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .recently-card:hover {
          transform: translateY(-4px);
          border-color: rgba(14, 165, 233, 0.42);
        }

        .recently-image-wrap {
          height: 145px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.025);
        }

        .recently-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .recently-image-empty {
          opacity: 0.45;
          font-size: 12px;
        }

        .recently-body {
          padding: 12px;
        }

        .recently-body small,
        .recently-body span {
          display: block;
          opacity: 0.58;
          font-size: 11px;
        }

        .recently-body h3 {
          margin: 6px 0 8px;
          min-height: 38px;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 800;
        }

        .recently-body strong {
          display: block;
          margin-bottom: 5px;
          font-size: 15px;
        }

        .recently-remove {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 50%;
          color: #e2e8f0;
          background: rgba(2, 6, 23, 0.75);
          cursor: pointer;
          z-index: 2;
        }

        .recently-remove:hover {
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.4);
        }

        @media (max-width: 1100px) {
          .recently-viewed-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .recently-viewed-section {
            padding: 18px;
          }

          .recently-viewed-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .recently-viewed-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .recently-image-wrap {
            height: 125px;
          }
        }
      `}</style>
    </section>
  );
}
