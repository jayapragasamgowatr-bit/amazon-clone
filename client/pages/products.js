import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  ShoppingCart,
  Heart,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";

import { getProducts } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";
import { useWishlist } from "../context/WishlistContext";

export default function Products() {
  const { user } = useAuth();

  const {
    toggleWishlist,
    isWishlisted,
  } = useWishlist();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [refreshing, setRefreshing] = useState(false);

  /*
  ============================================================
  FETCH PRODUCTS
  ============================================================
  */

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const data = await getProducts({
        sort: "newest",
        page: 1,
        limit: 50,
      });

      console.log("PRODUCTS API RESPONSE:", data);

      const productList = Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data)
        ? data
        : [];

      setProducts(productList);
    } catch (error) {
      console.error("FETCH PRODUCTS ERROR:", error);

      setProducts([]);

      toast.error(
        error?.message ||
          "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /*
  ============================================================
  REFRESH
  ============================================================
  */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await fetchProducts();

      toast.success("Products refreshed");
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  /*
  ============================================================
  CATEGORIES
  ============================================================
  */

  const categories = useMemo(() => {
    const values = products
      .map((product) => product?.category)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(values)),
    ];
  }, [products]);

  /*
  ============================================================
  FILTER PRODUCTS
  ============================================================
  */

  const filteredProducts = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const name =
        product?.name?.toLowerCase() || "";

      const description =
        product?.description?.toLowerCase() || "";

      const productCategory =
        product?.category || "";

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        description.includes(searchValue);

      const matchesCategory =
        category === "All" ||
        productCategory === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    category,
  ]);

  /*
  ============================================================
  WISHLIST
  ============================================================
  */

  const handleWishlist = async (
    productId
  ) => {
    if (!user) {
      toast.error(
        "Please login first"
      );
      return;
    }

    try {
      await toggleWishlist(productId);

      const current =
        isWishlisted(productId);

      toast.success(
        current
          ? "Removed from wishlist"
          : "Added to wishlist ❤️"
      );
    } catch (error) {
      console.error(
        "WISHLIST ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to update wishlist"
      );
    }
  };

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loader" />

        <h3>
          Loading products...
        </h3>

        <style jsx>{`
          .loading-page {
            min-height: 70vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .loader {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            border: 4px solid
              rgba(14, 165, 233, 0.15);
            border-top-color: #0284c7;
            animation: spin 0.8s linear
              infinite;
            margin-bottom: 18px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  /*
  ============================================================
  PAGE
  ============================================================
  */

  return (
    <div className="page">
      <SEO title="Products | Waventra Vetric" description="Browse Waventra Vetric products." path="/products" />



      {/* HEADER */}

      <div className="page-header">

        <div>
          <h1>
            Products
          </h1>

          <p>
            Explore our water management
            and monitoring products.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            className={
              refreshing
                ? "spinning"
                : ""
            }
          />

          Refresh
        </button>

      </div>

      {/* SEARCH */}

      <div className="filters">

        <div className="search-box">

          <Search size={19} />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        <div className="categories">

          {categories.map(
            (item) => (
              <button
                key={item}
                type="button"
                className={
                  category === item
                    ? "category-button active"
                    : "category-button"
                }
                onClick={() =>
                  setCategory(item)
                }
              >
                {item}
              </button>
            )
          )}

        </div>

      </div>

      {/* RESULT COUNT */}

      <div className="result-count">
        Showing{" "}
        <strong>
          {filteredProducts.length}
        </strong>{" "}
        product
        {filteredProducts.length !== 1
          ? "s"
          : ""}
      </div>

      {/* PRODUCTS */}

      {filteredProducts.length === 0 ? (
        <div className="empty">

          <Package size={50} />

          <h2>
            No products found
          </h2>

          <p>
            Try changing your search
            or category.
          </p>

        </div>
      ) : (
        <div className="product-grid">

          {filteredProducts.map(
            (product) => (
              <ProductCard
                key={product._id}
                product={product}
                wishlisted={
                  isWishlisted(
                    product._id
                  )
                }
                onWishlist={
                  handleWishlist
                }
              />
            )
          )}

        </div>
      )}

      <style jsx>{`

        .page {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 35px 20px 70px;
          box-sizing: border-box;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 30px;
        }

        .page-header h1 {
          margin: 0;
          font-size: clamp(
            32px,
            5vw,
            48px
          );
          font-weight: 900;
        }

        .page-header p {
          margin-top: 8px;
          opacity: 0.65;
        }

        .refresh-button {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid
            rgba(255,255,255,0.12);
          background: rgba(
            255,
            255,
            255,
            0.06
          );
          color: inherit;
          padding: 11px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 0.8s linear
            infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .filters {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 20px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 700px;
          padding: 13px 16px;
          border-radius: 12px;
          background: rgba(
            255,
            255,
            255,
            0.06
          );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
        }

        .search-box svg {
          opacity: 0.6;
        }

        .search-box input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: inherit;
          font-size: 15px;
        }

        .categories {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }

        .category-button {
          padding: 9px 15px;
          border-radius: 999px;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
          background: rgba(
            255,
            255,
            255,
            0.05
          );
          color: inherit;
          cursor: pointer;
          font-weight: 700;
        }

        .category-button.active {
          background: #0284c7;
          border-color: #0284c7;
          color: white;
        }

        .result-count {
          margin: 25px 0 18px;
          opacity: 0.65;
        }

        .product-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fill,
              minmax(250px, 1fr)
            );
          gap: 20px;
        }

        .empty {
          min-height: 350px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          opacity: 0.6;
        }

        .empty h2 {
          margin-top: 15px;
        }

        .empty p {
          margin-top: 5px;
        }

        @media (max-width: 650px) {

          .page {
            padding: 25px 14px 50px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .product-grid {
            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );
            gap: 12px;
          }

        }

      `}</style>

      </div>
  );
}

/*
============================================================
PRODUCT CARD
============================================================
*/

function ProductCard({
  product,
  wishlisted,
  onWishlist,
}) {
  const image =
    product?.image ||
    product?.images?.[0] ||
    "";

  const stock = Number(
    product?.countInStock || 0
  );

  return (
    <motion.div
      whileHover={{
        y: -5,
      }}
      className="card"
    >

      <div className="image-container">

        <Link
          href={`/product/${product._id}`}
        >
          {image ? (
            <img
              src={image}
              alt={
                product.name ||
                "Product"
              }
            />
          ) : (
            <div className="no-image">
              <Package
                size={50}
              />
            </div>
          )}
        </Link>

        <button
          type="button"
          className="wishlist"
          onClick={() =>
            onWishlist(
              product._id
            )
          }
        >
          <Heart
            size={19}
            fill={
              wishlisted
                ? "#ef4444"
                : "transparent"
            }
            color={
              wishlisted
                ? "#ef4444"
                : "currentColor"
            }
          />
        </button>

        <div
          className={
            stock > 0
              ? "stock in"
              : "stock out"
          }
        >
          {stock > 0
            ? "In Stock"
            : "Out of Stock"}
        </div>

      </div>

      <div className="content">

        {product.category && (
          <span className="category">
            {product.category}
          </span>
        )}

        <Link
          href={`/product/${product._id}`}
          className="product-link"
        >
          <h3>
            {product.name}
          </h3>
        </Link>

        <p className="description">
          {product.description ||
            "Product description available soon."}
        </p>

        <div className="bottom">

          <strong className="price">
            ₹
            {Number(
              product.price || 0
            ).toLocaleString(
              "en-IN"
            )}
          </strong>

          <Link
            href={`/product/${product._id}`}
            className="view-button"
          >
            View
          </Link>

        </div>

      </div>

      <style jsx>{`

        .card {
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          background: rgba(
            255,
            255,
            255,
            0.06
          );
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.1
            );
        }

        .image-container {
          position: relative;
          height: 250px;
          background: rgba(
            255,
            255,
            255,
            0.04
          );
        }

        .image-container > a {
          display: block;
          width: 100%;
          height: 100%;
        }

        .image-container img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 20px;
          box-sizing: border-box;
        }

        .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.4;
        }

        .wishlist {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid
            rgba(
              255,
              255,
              255,
              0.12
            );
          background: rgba(
            0,
            0,
            0,
            0.35
          );
          color: white;
          cursor: pointer;
        }

        .stock {
          position: absolute;
          left: 12px;
          top: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .stock.in {
          color: #22c55e;
          background: rgba(
            34,
            197,
            94,
            0.15
          );
        }

        .stock.out {
          color: #ef4444;
          background: rgba(
            239,
            68,
            68,
            0.15
          );
        }

        .content {
          padding: 18px;
        }

        .category {
          display: inline-block;
          margin-bottom: 8px;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(
            59,
            130,
            246,
            0.12
          );
          font-size: 11px;
          font-weight: 800;
        }

        .product-link {
          color: inherit;
          text-decoration: none;
        }

        .content h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.4;
        }

        .description {
          min-height: 44px;
          margin: 10px 0;
          font-size: 13px;
          line-height: 1.6;
          opacity: 0.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 15px;
        }

        .price {
          font-size: 20px;
        }

        .view-button {
          padding: 9px 14px;
          border-radius: 9px;
          background: #0284c7;
          color: white;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
        }

        @media (max-width: 650px) {

          .image-container {
            height: 190px;
          }

          .content {
            padding: 13px;
          }

          .content h3 {
            font-size: 15px;
          }

          .price {
            font-size: 16px;
          }

          .view-button {
            padding: 7px 10px;
          }

        }

      `}</style>

    </motion.div>
  );
}