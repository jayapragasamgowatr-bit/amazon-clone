"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import RecommendationSection from "./RecommendationSection";
import RecentlyViewedSection from "./RecentlyViewedSection";
import PersonalizedHomeSection from "./PersonalizedHomeSection";
import { apiFetch } from "../lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  MessageCircle,
  Droplets,
  Gauge,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Cpu,
  ArrowUpRight,
} from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const heroImages = [
    "https://images.unsplash.com/photo-1530053969600-caed2596d242?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=85",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIndex((current) => (current + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

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
        {/* Hero background slideshow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            borderRadius: "30px",
            zIndex: 0,
          }}
        >
          {heroImages.map((image, index) => (
            <motion.div
              key={image}
              initial={false}
              animate={{
                opacity: index === heroImageIndex ? 1 : 0,
                scale: index === heroImageIndex ? 1.03 : 1.08,
              }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "saturate(0.9)",
              }}
            />
          ))}

          {/* Dark blue overlay keeps the text highly readable */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(3,15,31,0.96) 0%, rgba(5,28,52,0.82) 45%, rgba(5,55,83,0.58) 100%)",
            }}
          />

          {/* Bottom vignette */}
          <div
            style={{
              position: "absolute",
              inset: "auto 0 0",
              height: "35%",
              background:
                "linear-gradient(transparent, rgba(2,12,26,0.55))",
            }}
          />
        </div>

        {/* Slideshow indicators */}
        <div
          style={{
            position: "absolute",
            right: "28px",
            bottom: "24px",
            display: "flex",
            gap: "7px",
            zIndex: 3,
          }}
        >
          {heroImages.map((_, index) => (
            <span
              key={index}
              style={{
                width: index === heroImageIndex ? "28px" : "7px",
                height: "7px",
                borderRadius: "999px",
                background:
                  index === heroImageIndex
                    ? "#67e8f9"
                    : "rgba(255,255,255,0.42)",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>

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
          BRAND STORY
      ================================================= */}

      <section style={{ marginBottom: "55px" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)",
            gap: "22px",
            alignItems: "stretch",
          }}
          className="home-story-grid"
        >
          <div
            className="glass-card"
            style={{
              padding: "clamp(26px,4vw,46px)",
              borderRadius: "26px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "rgba(14,165,233,0.10)",
                right: "-100px",
                top: "-90px",
                filter: "blur(8px)",
              }}
            />
            <span className="home-section-kicker">WHO WE ARE</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", lineHeight: 1.12, margin: "10px 0 16px", fontWeight: 900 }}>
              Technology that makes water management smarter.
            </h2>
            <p style={{ fontSize: "17px", lineHeight: 1.8, opacity: 0.72, margin: 0 }}>
              Waventra Vetric brings monitoring, measurement, connectivity and automation together in one modern ecosystem. We help organizations understand what is happening with their water systems so they can make clearer, data-driven decisions.
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "24px" }}>
              <span className="home-pill"><Droplets size={15} /> Water Intelligence</span>
              <span className="home-pill"><Cpu size={15} /> Connected Technology</span>
            </div>
          </div>

          <div
            style={{
              minHeight: "360px",
              borderRadius: "26px",
              overflow: "hidden",
              position: "relative",
              backgroundImage: "linear-gradient(135deg, rgba(3,18,32,.20), rgba(3,105,161,.48)), url('https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1400&q=85')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 20px 55px rgba(0,0,0,.18)",
            }}
          >
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "24px" }}>
              <div style={{ padding: "16px 18px", borderRadius: "18px", background: "rgba(2,12,24,.68)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.12)", color: "#fff", maxWidth: "430px" }}>
                <div style={{ fontWeight: 850, fontSize: "20px" }}>Measure. Connect. Understand.</div>
                <div style={{ opacity: .72, marginTop: 6, lineHeight: 1.55 }}>Turning field data into useful information for better water operations.</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section style={{ marginBottom: "55px" }}>
        <div style={{ textAlign: "center", maxWidth: "760px", margin: "0 auto 28px" }}>
          <span className="home-section-kicker">WHAT WE DO</span>
          <h2 style={{ fontSize: "clamp(28px,4vw,40px)", margin: "9px 0 10px", fontWeight: 900 }}>From measurement to intelligent action.</h2>
          <p style={{ opacity: .68, lineHeight: 1.7, margin: 0 }}>Our solutions are designed to connect physical water infrastructure with reliable digital information.</p>
        </div>

        <div className="home-feature-grid">
          {[
            { icon: Gauge, title: "Monitor", text: "Track flow, level and water-related parameters with connected field devices." },
            { icon: Radio, title: "Connect", text: "Transmit field data through IoT connectivity so information is available when it matters." },
            { icon: Sparkles, title: "Understand", text: "Turn operational data into dashboards, trends and actionable insights." },
            { icon: ShieldCheck, title: "Improve", text: "Use better visibility to support efficiency, control losses and improve operations." },
          ].map(({ icon: Icon, title, text }) => (
            <motion.div key={title} whileHover={{ y: -6 }} className="glass-card home-feature-card">
              <div className="home-feature-icon"><Icon size={23} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, scale: .985 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: .2 }}
        transition={{ duration: .55 }}
        style={{
          marginBottom: "55px",
          borderRadius: "28px",
          overflow: "hidden",
          position: "relative",
          minHeight: "330px",
          backgroundImage: "linear-gradient(90deg, rgba(2,12,24,.96) 0%, rgba(2,18,35,.78) 48%, rgba(2,18,35,.22) 100%), url('https://images.unsplash.com/photo-1538300342682-cf57afb97285?auto=format&fit=crop&w=1600&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ padding: "clamp(28px,6vw,60px)", maxWidth: "760px", color: "#fff" }}>
          <span className="home-section-kicker" style={{ color: "#67e8f9" }}>OUR VISION</span>
          <h2 style={{ fontSize: "clamp(32px,5vw,52px)", lineHeight: 1.08, margin: "10px 0 16px", fontWeight: 900 }}>Making every choice smarter.</h2>
          <p style={{ fontSize: "18px", lineHeight: 1.75, opacity: .78, margin: 0 }}>
            We believe better visibility leads to better decisions. Our focus is to make water systems more measurable, connected and easier to manage through practical technology.
          </p>
        </div>
      </motion.section>

      <section style={{ marginBottom: "55px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)", gap: "22px", alignItems: "center" }} className="home-objective-grid">
          <div>
            <span className="home-section-kicker">OUR CUSTOMER PROMISE</span>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", lineHeight: 1.12, margin: "9px 0 16px", fontWeight: 900 }}>Your needs come first.</h2>
            <p style={{ opacity: .7, lineHeight: 1.8, fontSize: "17px" }}>
              Our objective is to make every step clearer — from discovering the right solution to understanding its value and getting support after purchase.
            </p>
            <div style={{ display: "grid", gap: "12px", marginTop: "22px" }}>
              {["Clear product information", "Technology-led discovery", "Simple buying experience", "Long-term customer support"].map((item, index) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "10px", display: "grid", placeItems: "center", background: "rgba(14,165,233,.12)", color: "#0284c7" }}>
                    {index === 0 ? <Target size={16} /> : <ShieldCheck size={16} />}
                  </div>
                  <span style={{ fontWeight: 700 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              minHeight: "360px",
              borderRadius: "26px",
              overflow: "hidden",
              backgroundImage: "linear-gradient(135deg, rgba(2,132,199,.08), rgba(2,12,24,.42)), url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 20px 55px rgba(0,0,0,.15)",
            }}
          />
        </div>
      </section>

      <section style={{ marginBottom: "55px", textAlign: "center" }}>
        <span className="home-section-kicker">WHY WAVENTRA VETRIC</span>
        <h2 style={{ fontSize: "clamp(28px,4vw,40px)", margin: "9px 0 10px", fontWeight: 900 }}>Built around useful technology.</h2>
        <p style={{ maxWidth: "720px", margin: "0 auto 28px", opacity: .68, lineHeight: 1.7 }}>A modern experience where products, data and intelligent tools work together.</p>
        <div className="home-trust-grid">
          {[
            ["01", "Practical", "Technology should solve real operational problems."],
            ["02", "Connected", "Bring devices, data and people closer together."],
            ["03", "Transparent", "Make product information and decisions easier to understand."],
            ["04", "Future-ready", "Build an ecosystem that can grow with new technology."],
          ].map(([num, title, text]) => (
            <motion.div key={num} whileHover={{ y: -5 }} className="glass-card home-trust-card">
              <span>{num}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

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
          PERSONALIZED HOMEPAGE
      ================================================= */}

      <PersonalizedHomeSection limit={6} />

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
        type="trending"
        title="Trending Right Now"
        subtitle="Popular products based on recent shopping activity."
        limit={6}
      />

      <RecentlyViewedSection />

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