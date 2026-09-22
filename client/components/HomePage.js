"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import RecommendationSection from "./RecommendationSection";
import { apiFetch } from "../lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  MessageCircle,
} from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
  });

  const categories = [
    "All",
    "Flow Meters",
    "Level Sensors",
    "Water Quality",
    "IoT & Automation",
    "Controllers & Gateways",
    "Valves",
    "Accessories",
  ];

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (filters.search.trim()) {
          params.set("search", filters.search.trim());
        }

        if (filters.category !== "All") {
          params.set("category", filters.category);
        }

        if (filters.minPrice) {
          params.set("minPrice", filters.minPrice);
        }

        if (filters.maxPrice) {
          params.set("maxPrice", filters.maxPrice);
        }

        params.set("sort", filters.sort || "newest");
        params.set("page", "1");
        params.set("limit", "50");

        const url = `/api/products?${params.toString()}`;

        console.log("PRODUCT API REQUEST:", url);

        const data = await apiFetch(url, {
          method: "GET",
        });

        console.log("PRODUCT API RESPONSE:", data);

        if (cancelled) return;

        let productList = [];

        if (Array.isArray(data)) {
          productList = data;
        } else if (Array.isArray(data?.products)) {
          productList = data.products;
        }

        setProducts(productList);
      } catch (error) {
        if (cancelled) return;

        console.error("FETCH PRODUCTS ERROR:", error);

        setProducts([]);

        toast.error(
          error?.message || "Unable to load products"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [
    filters.search,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
  ]);

  // =====================================================
  // SEARCH SUGGESTIONS
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      const search = filters.search.trim();

      if (!search) {
        setSuggestions([]);
        return;
      }

      try {
        const url =
          `/api/products/suggestions?q=` +
          encodeURIComponent(search);

        const data = await apiFetch(url, {
          method: "GET",
        });

        if (cancelled) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        setSuggestions(list);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "FETCH SUGGESTIONS ERROR:",
            error
          );

          setSuggestions([]);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.search]);

  // =====================================================
  // HANDLE FILTER CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "search") {
      setShowSuggestions(true);
    }
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "All",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });

    setSuggestions([]);
    setShowSuggestions(false);
  };

  // =====================================================
  // SELECT SUGGESTION
  // =====================================================

  const selectSuggestion = (name) => {
    setFilters((prev) => ({
      ...prev,
      search: name,
    }));

    setShowSuggestions(false);
  };

  // =====================================================
  // SEARCH BLUR
  // =====================================================

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "30px 20px 60px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* =================================================
          HERO
      ================================================= */}

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "30px",
          padding:
            "clamp(45px,7vw,75px) clamp(25px,5vw,50px)",
          marginBottom: "45px",
          background:
            "linear-gradient(135deg,#071426 0%,#0b2a4a 55%,#075985 100%)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(56,189,248,0.12)",
            right: "-80px",
            top: "-100px",
            filter: "blur(10px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "850px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: "999px",
              marginBottom: "20px",
              background:
                "rgba(255,255,255,0.08)",
              border:
                "1px solid rgba(255,255,255,0.12)",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing: "0.5px",
              color: "#ffffff",
            }}
          >
            WAVENTRA VETRIC
          </div>

          <h1
            style={{
              fontSize: "clamp(38px,6vw,68px)",
              lineHeight: "1.05",
              fontWeight: "900",
              margin: "0 0 20px",
              color: "#ffffff",
            }}
          >
            Smart Water
            <br />
            Management Starts Here.
          </h1>

          <p
            style={{
              maxWidth: "700px",
              fontSize: "18px",
              lineHeight: "1.7",
              color: "rgba(255,255,255,0.78)",
              marginBottom: "30px",
            }}
          >
            Explore flow meters, level sensors,
            water-quality instruments, IoT devices
            and automation solutions for modern
            water management.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                document
                  .getElementById("products")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 20px",
                borderRadius: "12px",
                border: "none",
                background: "#ffffff",
                color: "#075985",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              Explore Products
              <ArrowRight size={17} />
            </motion.button>

            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href="/assistant"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 20px",
                borderRadius: "12px",
                border: "1px solid rgba(34,211,238,0.45)",
                background: "rgba(34,211,238,0.12)",
                color: "#67e8f9",
                textDecoration: "none",
                fontWeight: "800",
              }}
            >
              Ask AI Assistant
              <span style={{ fontSize: "17px" }}>✦</span>
            </motion.a>

            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href="mailto:jayaprakasham2004@gmail.com"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 20px",
                borderRadius: "12px",
                border:
                  "1px solid rgba(255,255,255,0.25)",
                background:
                  "rgba(255,255,255,0.06)",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: "700",
              }}
            >
              Request a Quote
              <MessageCircle size={17} />
            </motion.a>
          </div>
        </div>
      </motion.section>

      {/* =================================================
          CATEGORIES
      ================================================= */}

      <section style={{ marginBottom: "45px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "800",
              margin: 0,
            }}
          >
            Water Management Solutions
          </h2>

          <p
            style={{
              marginTop: "7px",
              opacity: 0.65,
            }}
          >
            Explore our range of monitoring and
            automation products.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(160px,1fr))",
            gap: "12px",
          }}
        >
          {categories
            .filter((category) => category !== "All")
            .map((category) => (
              <motion.button
                key={category}
                type="button"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setFilters((prev) => ({
                    ...prev,
                    category,
                  }));

                  document
                    .getElementById("products")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }}
                style={{
                  padding: "18px 14px",
                  borderRadius: "16px",
                  border:
                    filters.category === category
                      ? "1px solid #0284c7"
                      : "1px solid rgba(148,163,184,0.18)",
                  background:
                    filters.category === category
                      ? "rgba(14,165,233,0.12)"
                      : "rgba(255,255,255,0.04)",
                  color: "inherit",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {category}
              </motion.button>
            ))}
        </div>
      </section>

      {/* =================================================
          FILTER PANEL
      ================================================= */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          padding: "24px",
          marginBottom: "40px",
          borderRadius: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <SlidersHorizontal size={22} />

          <h2
            style={{
              fontSize: "23px",
              fontWeight: "800",
              margin: 0,
            }}
          >
            Find the Right Product
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(190px,1fr))",
            gap: "14px",
          }}
        >
          {/* SEARCH */}

          <div
            style={{
              position: "relative",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                top: "50%",
                left: "14px",
                transform: "translateY(-50%)",
                opacity: 0.6,
                zIndex: 2,
                pointerEvents: "none",
              }}
            />

            <input
              type="text"
              name="search"
              placeholder="Search water products..."
              value={filters.search}
              onChange={handleChange}
              onFocus={() =>
                setShowSuggestions(true)
              }
              onBlur={handleSearchBlur}
              autoComplete="off"
              style={{
                width: "100%",
                paddingLeft: "42px",
                boxSizing: "border-box",
              }}
            />

            {showSuggestions &&
              suggestions.length > 0 && (
                <div
                  className="glass-card"
                  style={{
                    position: "absolute",
                    top: "110%",
                    left: 0,
                    width: "100%",
                    zIndex: 999,
                    padding: "8px",
                    boxSizing: "border-box",
                  }}
                >
                  {suggestions.map((item) => (
                    <div
                      key={
                        item._id ||
                        item.id ||
                        item.name
                      }
                      onMouseDown={() =>
                        selectSuggestion(item.name)
                      }
                      style={{
                        padding: "11px 12px",
                        cursor: "pointer",
                        borderRadius: "10px",
                      }}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* CATEGORY */}

          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
          >
            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>

          {/* MIN PRICE */}

          <input
            type="number"
            name="minPrice"
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={handleChange}
            min="0"
          />

          {/* MAX PRICE */}

          <input
            type="number"
            name="maxPrice"
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={handleChange}
            min="0"
          />

          {/* SORT */}

          <select
            name="sort"
            value={filters.sort}
            onChange={handleChange}
          >
            <option value="newest">
              Newest
            </option>

            <option value="lowToHigh">
              Price: Low → High
            </option>

            <option value="highToLow">
              Price: High → Low
            </option>

            <option value="oldest">
              Oldest
            </option>
          </select>

          {/* CLEAR */}

          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={clearFilters}
            style={{
              background:
                "linear-gradient(135deg,#0284c7,#0369a1)",
              color: "#ffffff",
              fontWeight: "700",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            Clear Filters
          </motion.button>
        </div>
      </motion.div>

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <section id="products">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "800",
                margin: 0,
              }}
            >
              Our Products
            </h2>

            <p
              style={{
                opacity: 0.6,
                marginTop: "5px",
              }}
            >
              {products.length}{" "}
              {products.length === 1
                ? "product"
                : "products"}{" "}
              found
            </p>
          </div>

          {filters.category !== "All" && (
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  category: "All",
                }))
              }
              style={{
                padding: "9px 14px",
                borderRadius: "10px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {filters.category} ×
            </motion.button>
          )}
        </div>

        {/* LOADING */}

        {loading ? (
          <div
            className="glass-card"
            style={{
              textAlign: "center",
              padding: "70px 20px",
              borderRadius: "20px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                margin: "0 auto 18px",
                borderRadius: "50%",
                border:
                  "4px solid rgba(14,165,233,0.15)",
                borderTopColor: "#0284c7",
                animation:
                  "wateros-spin 0.8s linear infinite",
              }}
            />

            <p
              style={{
                fontSize: "18px",
                fontWeight: "700",
              }}
            >
              Loading products...
            </p>

            <p style={{ opacity: 0.6 }}>
              Please wait.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: "center",
              padding: "70px 20px",
              borderRadius: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "800",
              }}
            >
              No products found
            </h3>

            <p
              style={{
                opacity: 0.65,
                marginTop: "8px",
              }}
            >
              Try changing your search or filters.
            </p>

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearFilters}
              style={{
                marginTop: "20px",
                padding: "11px 18px",
                borderRadius: "10px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Clear Filters
            </motion.button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>

      <RecommendationSection
        type="personalized"
        limit={6}
      />

      <RecommendationSection
        type="trending"
        title="Trending Right Now"
        subtitle="Popular products based on recent shopping activity."
        limit={6}
      />

      {/* =================================================
          BOTTOM CTA
      ================================================= */}

      <motion.section
        initial={{
          opacity: 0,
          y: 20,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.2,
        }}
        transition={{
          duration: 0.5,
        }}
        style={{
          marginTop: "70px",
          padding: "40px 25px",
          borderRadius: "24px",
          textAlign: "center",
          background:
            "linear-gradient(135deg,#082f49,#075985)",
        }}
      >
        <h2
          style={{
            fontSize: "30px",
            fontWeight: "800",
            color: "#ffffff",
          }}
        >
          Looking for a customized solution?
        </h2>

        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            marginTop: "10px",
          }}
        >
          Talk to our team about your water
          monitoring and automation requirements.
        </p>

        <motion.a
          whileHover={{
            scale: 1.03,
            y: -2,
          }}
          whileTap={{
            scale: 0.97,
          }}
          href="mailto:jayaprakasham2004@gmail.com"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "22px",
            padding: "12px 20px",
            borderRadius: "12px",
            background: "#ffffff",
            color: "#075985",
            textDecoration: "none",
            fontWeight: "800",
          }}
        >
          Contact Us
          <ArrowRight size={17} />
        </motion.a>
      </motion.section>
    </div>
  );
}