import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import toast from "react-hot-toast";
import { getProducts } from "../lib/api";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import { trackEvent } from "../lib/eventTracker";

export default function SearchPage() {
  const router = useRouter();
  const query = typeof router.query.q === "string" ? router.query.q.trim() : "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (!router.isReady) return;
    if (!query) { setProducts([]); return; }
    trackEvent("search", { searchTerm: query, category: category === "All" ? "" : category, metadata: { sort, source: "search_page" } });

    let cancelled = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const data = await getProducts({ search: query, category: category === "All" ? "" : category, sort, page: 1, limit: 50 });
        if (!cancelled) setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (err) {
        if (!cancelled) { setError(err?.message || "Unable to search products"); toast.error(err?.message || "Search failed"); }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [router.isReady, query, category, sort]);

  const categories = useMemo(() => ["All", ...new Set(products.map(p => p?.category).filter(Boolean))], [products]);

  return (
    <div className="search-page">
      <SEO title={query ? `Search: ${query} | Waventra Vetric` : "Search | Waventra Vetric"}
        description={query ? `Search results for ${query} on Waventra Vetric.` : "Search Waventra Vetric products."}
        path={query ? `/search?q=${encodeURIComponent(query)}` : "/search"} />
      <div className="search-shell">
        <div className="hero">
          <div>
            <span className="eyebrow"><Search size={15}/> PRODUCT DISCOVERY</span>
            <h1>Search products</h1>
            <p>{query ? <>Results for <strong>“{query}”</strong></> : "Find the product you need."}</p>
          </div>
          <Link href="/products" className="back">Browse all products</Link>
        </div>

        {query && !loading && !error && (
          <div className="filters">
            <label><SlidersHorizontal size={16}/> Category
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label><ArrowUpDown size={16}/> Sort
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </label>
          </div>
        )}

        {loading && <div className="state">Searching products…</div>}
        {error && <div className="state error">{error}</div>}
        {!loading && !error && query && products.length > 0 && (
          <div className="grid">{products.map(item => <ProductCard key={item._id} product={item} />)}</div>
        )}
        {!loading && !error && query && products.length === 0 && (
          <div className="state"><h2>No products found</h2><p>Try a different name, keyword, or category.</p><Link href="/products">View all products</Link></div>
        )}
        {!query && <div className="state"><h2>Start searching</h2><p>Use the search box above to discover products.</p></div>}
      </div>
      <style jsx>{`
        .search-page{min-height:80vh;padding:45px 22px}.search-shell{max-width:1500px;margin:auto}
        .hero{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:28px}.eyebrow{display:inline-flex;gap:7px;align-items:center;color:#38bdf8;font-size:12px;font-weight:900;letter-spacing:1.2px}
        h1{font-size:48px;margin:10px 0 8px;font-weight:900}.hero p{opacity:.72;font-size:17px}.back{padding:12px 16px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(255,255,255,.05);font-weight:800}
        .filters{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:26px;padding:15px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(15,23,42,.65)}.filters label{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px}
        select{background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:9px 12px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.state{text-align:center;padding:70px 20px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(15,23,42,.65)}.state h2{font-size:28px;margin:0 0 8px}.state p{opacity:.65}.state a{display:inline-block;margin-top:14px;color:#38bdf8;font-weight:800}.error{color:#fecaca}
        @media(max-width:1100px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:800px){.hero{align-items:start;flex-direction:column}h1{font-size:38px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.grid{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
