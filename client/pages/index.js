import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { apiFetch } from "../lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

export default function Home() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [suggestions, setSuggestions] =
    useState([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [filters, setFilters] =
    useState({
      search: "",
      category: "All",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });

  const categories = [
    "All",
    "Electronics",
    "Fashion",
    "Books",
    "Home",
    "Beauty",
    "Sports",
  ];

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    fetchSuggestions();
  }, [filters.search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params =
        new URLSearchParams({
          search:
            filters.search,
          category:
            filters.category,
          minPrice:
            filters.minPrice,
          maxPrice:
            filters.maxPrice,
          sort:
            filters.sort,
          page: 1,
          limit: 50,
        });

      const data =
        await apiFetch(
          `/api/products?${params}`
        );

      setProducts(
        data.products || []
      );

    } catch (error) {
      toast.error(
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions =
    async () => {
      if (
        !filters.search.trim()
      ) {
        setSuggestions([]);
        return;
      }

      try {
        const data =
          await apiFetch(
            `/api/products/suggestions?q=${filters.search}`
          );

        setSuggestions(data);

      } catch {}
    };

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]:
        e.target.value,
    });

    if (
      e.target.name ===
      "search"
    ) {
      setShowSuggestions(
        true
      );
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "All",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });

    setSuggestions([]);
    setShowSuggestions(
      false
    );
  };

  const selectSuggestion = (
    name
  ) => {
    setFilters({
      ...filters,
      search: name,
    });

    setShowSuggestions(
      false
    );
  };

  return (
    <div
      style={{
        maxWidth: "1600px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      {/* HERO */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        style={{
          textAlign: "center",
          marginBottom: "50px",
        }}
      >
        <h1
          style={{
            fontSize: "56px",
            fontWeight: "900",
          }}
        >
          Shop Smarter 🛍️
        </h1>

        <p
          style={{
            opacity: 0.75,
            fontSize: "18px",
            marginTop: "12px",
          }}
        >
          Search, filter & discover premium products
        </p>
      </motion.div>

      {/* FILTER PANEL */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
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
          <SlidersHorizontal
            size={24}
          />

          <h2
            style={{
              fontSize: "26px",
              fontWeight: "700",
            }}
          >
            Search & Filters
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(200px,1fr))",
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
                position:
                  "absolute",
                top: "50%",
                left: "14px",
                transform:
                  "translateY(-50%)",
                opacity: 0.6,
              }}
            />

            <input
              type="text"
              name="search"
              placeholder="Search products..."
              value={
                filters.search
              }
              onChange={
                handleChange
              }
              style={{
                paddingLeft:
                  "42px",
              }}
            />

            {showSuggestions &&
              suggestions.length >
                0 && (
                <div
                  className="glass-card"
                  style={{
                    position:
                      "absolute",
                    top: "110%",
                    left: 0,
                    width: "100%",
                    zIndex: 999,
                    padding:
                      "8px",
                  }}
                >
                  {suggestions.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item._id
                        }
                        onClick={() =>
                          selectSuggestion(
                            item.name
                          )
                        }
                        style={{
                          padding:
                            "10px",
                          cursor:
                            "pointer",
                          borderRadius:
                            "10px",
                        }}
                      >
                        {
                          item.name
                        }
                      </div>
                    )
                  )}
                </div>
              )}
          </div>

          {/* CATEGORY */}
          <select
            name="category"
            value={
              filters.category
            }
            onChange={
              handleChange
            }
          >
            {categories.map(
              (cat) => (
                <option
                  key={cat}
                  value={cat}
                >
                  {cat}
                </option>
              )
            )}
          </select>

          {/* MIN */}
          <input
            type="number"
            name="minPrice"
            placeholder="Min ₹"
            value={
              filters.minPrice
            }
            onChange={
              handleChange
            }
          />

          {/* MAX */}
          <input
            type="number"
            name="maxPrice"
            placeholder="Max ₹"
            value={
              filters.maxPrice
            }
            onChange={
              handleChange
            }
          />

          {/* SORT */}
          <select
            name="sort"
            value={
              filters.sort
            }
            onChange={
              handleChange
            }
          >
            <option value="newest">
              Newest
            </option>

            <option value="lowToHigh">
              Low → High
            </option>

            <option value="highToLow">
              High → Low
            </option>
          </select>

          {/* CLEAR */}
          <button
            onClick={
              clearFilters
            }
            style={{
              background:
                "linear-gradient(135deg,#ef4444,#dc2626)",
            }}
          >
            Clear
          </button>
        </div>
      </motion.div>

      {/* PRODUCTS */}
      {loading ? (
        <div
          className="glass-card"
          style={{
            textAlign:
              "center",
            padding: "60px",
            fontSize: "20px",
          }}
        >
          Loading products...
        </div>
      ) : (
        <div className="products-grid">
          {products.map(
            (product) => (
              <ProductCard
                key={
                  product._id
                }
                product={
                  product
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}