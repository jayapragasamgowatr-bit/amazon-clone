import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Package,
  RefreshCw,
  Search,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import ProtectedRoute from "../../components/ProtectedRoute";
import { getAiSearchIntelligence, apiFetch } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const PRODUCT_TERMS = [
  ["flow meter", ["flow meter", "flowmeter", "flow"]],
  ["ultrasonic", ["ultrasonic"]],
  ["electromagnetic", ["electromagnetic", "emfm"]],
  ["level sensor", ["level sensor", "level monitoring", "tank level"]],
  ["pressure sensor", ["pressure sensor", "hydrostatic"]],
  ["radar sensor", ["radar sensor"]],
  ["gateway", ["gateway"]],
  ["iot", ["iot", "transmission unit"]],
  ["controller", ["controller"]],
  ["analyzer", ["analyzer", "ocems"]],
  ["water meter", ["water meter"]],
];

const SPEC_TERMS = [
  ["DN100 / 4-inch", ["dn100", "4 inch", "4-inch", "4in"]],
  ["DN80 / 3-inch", ["dn80", "3 inch", "3-inch", "3in"]],
  ["DN65", ["dn65"]],
  ["DN50", ["dn50"]],
  ["DN40", ["dn40"]],
  ["DN32", ["dn32"]],
  ["DN25", ["dn25"]],
  ["DN20", ["dn20"]],
  ["RS485 / Modbus", ["rs485", "modbus"]],
  ["Wi-Fi", ["wifi", "wi-fi"]],
  ["GSM / 4G", ["gsm", "4g"]],
  ["LoRaWAN", ["lorawan"]],
];

const APPLICATION_TERMS = [
  ["Tank monitoring", ["tank", "tank level"]],
  ["Water pipeline", ["water pipeline", "pipeline"]],
  ["Water consumption", ["water consumption", "domestic water"]],
  ["Industrial water", ["industrial water", "factory", "plant"]],
  ["Apartment / residential", ["apartment", "residential", "building"]],
  ["Automation", ["automation", "motor automation"]],
];

const normalise = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const queryLabel = (item) =>
  typeof item === "string"
    ? item
    : item?.query || item?.question || item?.name || item?.label || "";

const queryCount = (item) =>
  Number(item?.count ?? item?.searches ?? item?.frequency ?? item?.total ?? 1) || 1;

const findTerms = (text, groups) => {
  const lower = normalise(text);
  return groups
    .filter(([, needles]) => needles.some((needle) => lower.includes(normalise(needle))))
    .map(([label]) => label);
};

const classify = (text) => {
  const lower = normalise(text);

  if (/who is waventra|what is waventra|what does waventra do|about waventra/.test(lower)) {
    return "Company / General";
  }
  if (/under rs|under inr|budget|price|cost|cheap|affordable|below rs/.test(lower)) {
    return "Budget";
  }

  const products = findTerms(text, PRODUCT_TERMS);
  const specs = findTerms(text, SPEC_TERMS);
  const apps = findTerms(text, APPLICATION_TERMS);

  if (products.length && apps.length) return "Product + Application";
  if (products.length && specs.length) return "Product + Specification";
  if (products.length) return "Product";
  if (specs.length) return "Specification";
  if (/how does|how to|compatible|compatibility|installation|calibration|maintenance|working principle|technical/.test(lower)) {
    return "Technical";
  }
  if (apps.length) return "Application";
  return "General";
};

const productText = (product) => {
  const parts = [
    product?.name,
    product?.description,
    product?.category,
    product?.brand,
    ...(Array.isArray(product?.applications) ? product.applications : []),
    ...(Array.isArray(product?.features) ? product.features : []),
    ...(Array.isArray(product?.specifications) ? product.specifications : []),
  ];

  if (product?.specifications && typeof product.specifications === "object" && !Array.isArray(product.specifications)) {
    parts.push(JSON.stringify(product.specifications));
  }

  return normalise(parts.join(" "));
};

const productCoreText = (product) => {
  const parts = [
    product?.name,
    product?.description,
    ...(Array.isArray(product?.features) ? product.features : []),
    ...(Array.isArray(product?.applications) ? product.applications : []),
  ];
  if (product?.specifications && typeof product.specifications === "object" && !Array.isArray(product.specifications)) {
    parts.push(JSON.stringify(product.specifications));
  }
  return normalise(parts.join(" "));
};

const PRODUCT_FAMILIES = {
  "flow meter": ["flow meter", "flowmeter", "electromagnetic flowmeter", "ultrasonic flow meter", "emfm", "water meter"],
  "level sensor": ["level sensor", "level monitoring", "hydrostatic pressure sensor", "radar sensor", "tank level"],
  "pressure sensor": ["pressure sensor", "hydrostatic pressure sensor", "pressure transmitter"],
  "gateway": ["gateway", "iot gateway"],
  "transmission unit": ["transmission unit", "iot transmission unit", "data logger"],
  "controller": ["controller", "motor controller", "control unit"],
  "analyzer": ["analyzer", "ocems", "online continuous emission monitoring"],
};

const queryFamilyTerms = (query) => {
  const q = normalise(query);
  return Object.entries(PRODUCT_FAMILIES)
    .filter(([, aliases]) => aliases.some((alias) => q.includes(normalise(alias))))
    .map(([family]) => family);
};

const productFamilyMatches = (product, family) => {
  const aliases = PRODUCT_FAMILIES[family] || [];
  const text = productCoreText(product);
  const name = normalise(product?.name);
  return aliases.some((alias) => text.includes(normalise(alias)) || name.includes(normalise(alias)));
};

const extractSize = (text) => {
  const lower = normalise(text);
  const dn = lower.match(/\bdn\s*(20|25|32|40|50|65|80|100)\b/);
  if (dn) return { dn: Number(dn[1]), inches: Number(dn[1]) / 25.4 };
  const inch = lower.match(/\b(\d+(?:\.\d+)?)\s*(?:inch|in|\")\b/);
  if (inch) return { inches: Number(inch[1]) };
  return null;
};

const matchQuery = (query, product) => {
  const q = normalise(query);
  const p = productText(product);
  const core = productCoreText(product);
  if (!q || !p) return { score: 0, reason: "No usable catalogue data" };

  const queryFamilies = queryFamilyTerms(query);
  const querySpecs = findTerms(query, SPEC_TERMS);
  const queryApps = findTerms(query, APPLICATION_TERMS);

  // Product-family matching is authoritative. A stale/mistyped category field
  // must never make an unrelated product look like a match.
  if (queryFamilies.length) {
    const familyMatched = queryFamilies.some((family) => productFamilyMatches(product, family));
    if (!familyMatched) return { score: 0, reason: "Different product family" };
  }

  const productName = normalise(product?.name);
  if (/headphones|television|tv|phone|laptop|keyboard|mouse|speaker|camera|watch|wallpaper|anime/i.test(productName)) {
    if (queryFamilies.length) return { score: 0, reason: "Unrelated product" };
  }

  const terms = q.split(" ").filter((word) => word.length >= 3);
  let score = 0;
  const maxBase = Math.max(1, terms.length);

  terms.forEach((term) => {
    if (core.includes(term)) score += 1;
  });

  if (queryFamilies.length) score += queryFamilies.reduce((sum, family) =>
    sum + (productFamilyMatches(product, family) ? 5 : 0), 0);
  querySpecs.forEach((label) => { if (p.includes(normalise(label))) score += 2; });
  queryApps.forEach((label) => { if (p.includes(normalise(label))) score += 1; });

  const requestedSize = extractSize(query);
  const productSize = extractSize(p);
  let sizeMismatch = false;
  if (requestedSize && productSize) {
    const requested = requestedSize.dn || requestedSize.inches;
    const actual = productSize.dn || productSize.inches;
    sizeMismatch = Math.abs(requested - actual) > 0.25;
    if (!sizeMismatch) score += 3;
    else score -= 3;
  }

  const maxScore = maxBase + queryFamilies.length * 5 + querySpecs.length * 2 + queryApps.length;
  let ratio = Math.max(0, score) / Math.max(1, maxScore);

  if (queryFamilies.length && !productFamilyMatches(product, queryFamilies[0])) return { score: 0, reason: "Different product family" };

  if (sizeMismatch) {
    return { score: Math.min(ratio, 0.22), reason: "Product family matches, but requested size differs" };
  }

  if (queryFamilies.length && ratio < 0.35) return { score: 0, reason: "Weak product match" };
  return { score: Math.min(1, ratio), reason: "Catalogue match" };
};

export default function CatalogueIntelligencePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [aiData, setAiData] = useState(null);
  const [products, setProducts] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;

    try {
      setError("");

      const [ai, productResponse] = await Promise.all([
        getAiSearchIntelligence(days),
        apiFetch("/api/products", { auth: true }),
      ]);

      const rawProducts =
        productResponse?.products ||
        productResponse?.data?.products ||
        productResponse?.data ||
        productResponse ||
        [];

      setAiData(ai || null);
      setProducts(Array.isArray(rawProducts) ? rawProducts : []);
    } catch (err) {
      console.error("CATALOGUE INTELLIGENCE ERROR:", err);
      setError(err?.message || "Unable to load catalogue intelligence");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, days]);

  useEffect(() => {
    if (!authLoading && user) load();
  }, [authLoading, user, load]);

  const queries = useMemo(() => {
    const unanswered = Array.isArray(aiData?.unansweredDemand)
      ? aiData.unansweredDemand
      : Array.isArray(aiData?.unanswered)
        ? aiData.unanswered
        : [];

    const trending = Array.isArray(aiData?.trendingSearches)
      ? aiData.trendingSearches
      : Array.isArray(aiData?.trending)
        ? aiData.trending
        : [];

    const top = Array.isArray(aiData?.topQuestions)
      ? aiData.topQuestions
      : Array.isArray(aiData?.topQueries)
        ? aiData.topQueries
        : [];

    const map = new Map();

    [...unanswered, ...trending, ...top].forEach((item) => {
      const label = String(queryLabel(item)).trim();
      const key = normalise(label);
      if (!key) return;

      const existing = map.get(key);
      if (existing) {
        existing.count = Math.max(existing.count, queryCount(item));
        existing.unanswered = existing.unanswered || unanswered.some(
          (u) => normalise(queryLabel(u)) === key
        );
      } else {
        map.set(key, {
          label,
          count: queryCount(item),
          unanswered: unanswered.some((u) => normalise(queryLabel(u)) === key),
        });
      }
    });

    return [...map.values()]
      .map((item) => {
        const productsFound = products
          .map((product) => ({
            product,
            match: matchQuery(item.label, product),
          }))
          .filter((entry) => entry.match.score >= 0.16)
          .sort((a, b) => b.match.score - a.match.score)
          .slice(0, 3);

        return {
          ...item,
          intent: classify(item.label),
          productTerms: findTerms(item.label, PRODUCT_TERMS),
          specs: findTerms(item.label, SPEC_TERMS),
          applications: findTerms(item.label, APPLICATION_TERMS),
          matches: productsFound,
          status:
            productsFound.some((entry) => entry.match.score >= 0.60)
              ? "Strong match"
              : productsFound.length
                ? "Possible match"
                : "No catalogue match",
        };
      })
      .filter((item) => item.intent !== "Company / General")
      .sort((a, b) => {
        const aGap = a.matches.length === 0 ? 1 : 0;
        const bGap = b.matches.length === 0 ? 1 : 0;
        return (bGap - aGap) || (b.count - a.count);
      });
  }, [aiData, products]);

  const stats = useMemo(() => {
    const productDemand = queries.filter((q) =>
      ["Product", "Product + Application", "Product + Specification", "Specification", "Budget"].includes(q.intent)
    );
    const strong = productDemand.filter((q) => q.matches.some((entry) => entry.match.score >= 0.60)).length;
    const possible = productDemand.filter((q) => q.matches.length > 0 && !q.matches.some((entry) => entry.match.score >= 0.60)).length;
    const gaps = productDemand.filter((q) => q.matches.length === 0).length;
    return {
      productDemand: productDemand.length,
      strong,
      possible,
      gaps,
    };
  }, [queries]);

  if (authLoading || loading) {
    return (
      <ProtectedRoute>
        <div className="loading">Loading catalogue intelligence...</div>
        <style jsx>{`.loading{min-height:70vh;display:grid;place-items:center;color:#a9b7cb;background:#07101f}`}</style>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="page">
        <header className="header">
          <div>
            <Link href="/admin" className="back"><ArrowLeft size={15}/> Admin Dashboard</Link>
            <div className="eyebrow"><BrainCircuit size={15}/> PHASE 12</div>
            <h1>AI Product Catalogue Intelligence</h1>
            <p>Match real customer requirements against the live product catalogue and expose missing or weak catalogue coverage.</p>
          </div>
          <div className="actions">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={async () => { setRefreshing(true); await load(); toast.success("Catalogue intelligence refreshed."); }} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "spin" : ""}/> Refresh
            </button>
          </div>
        </header>

        {error && <div className="error"><TriangleAlert size={17}/>{error}</div>}

        <section className="metrics">
          <Metric icon={<Search/>} label="Product demand signals" value={stats.productDemand}/>
          <Metric icon={<CheckCircle2/>} label="Strong catalogue matches" value={stats.strong}/>
          <Metric icon={<Package/>} label="Possible matches" value={stats.possible}/>
          <Metric icon={<XCircle/>} label="Catalogue gaps" value={stats.gaps}/>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Requirement → Product Matching</h2>
              <p>Queries are deduplicated before matching. Company/general questions are excluded.</p>
            </div>
            <span className="count">{products.length} products loaded</span>
          </div>

          {queries.length === 0 ? (
            <div className="empty"><Search size={25}/><strong>No demand signals yet</strong><span>Customer search intelligence will appear here as searches accumulate.</span></div>
          ) : (
            <div className="query-list">
              {queries.slice(0, 20).map((q, index) => (
                <article className="query" key={`${q.label}-${index}`}>
                  <div className="query-top">
                    <div className="rank">{index + 1}</div>
                    <div className="query-main">
                      <strong>{q.label}</strong>
                      <div className="chips">
                        <span>{q.intent}</span>
                        {q.productTerms.map((x) => <span key={x}>{x}</span>)}
                        {q.specs.map((x) => <span key={x}>{x}</span>)}
                        {q.applications.map((x) => <span key={x}>{x}</span>)}
                      </div>
                    </div>
                    <div className={`status ${q.matches.some((entry) => entry.match.score >= 0.60) ? "good" : q.matches.length ? "warn" : "bad"}`}>
                      {q.matches.some((entry) => entry.match.score >= 0.60) ? <CheckCircle2 size={15}/> : q.matches.length ? <TriangleAlert size={15}/> : <XCircle size={15}/>}
                      {q.status}
                    </div>
                  </div>

                  <div className="matches">
                    {q.matches.length ? q.matches.map(({ product, match }) => (
                      <div className="match" key={product?._id || product?.id || product?.name}>
                        <div className="product-icon"><Package size={17}/></div>
                        <div className="product-info">
                          <strong>{product?.name || "Product"}</strong>
                          <span>{product?.category || "Catalogue product"} · Stock {Number(product?.countInStock || 0)}</span>
                        </div>
                        <span className="score">{Math.round(match.score * 100)}% match</span>
                        {product?._id && <Link href={`/product/${product._id}`}><ChevronRight size={16}/></Link>}
                      </div>
                    )) : (
                      <div className="gap">
                        <XCircle size={17}/>
                        <div><strong>No reliable catalogue match</strong><span>Review product coverage, specifications, or consider whether this demand requires a new product.</span></div>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="note"><TriangleAlert size={15}/><span>Matching is catalogue-grounded but heuristic in this phase. It does not automatically create or recommend purchasing a new product.</span></div>
      </main>

      <style jsx>{`
        .page{min-height:100vh;padding:32px; background:radial-gradient(circle at 15% 0%,rgba(34,211,238,.07),transparent 32%),#050b16;color:#e7eef8}
        .header{max-width:1250px;margin:0 auto 24px;display:flex;justify-content:space-between;gap:24px;align-items:flex-end}
        .back{display:inline-flex;align-items:center;gap:6px;color:#7dd3fc;text-decoration:none;font-size:12px;margin-bottom:20px}
        .eyebrow{display:flex;align-items:center;gap:7px;color:#67e8f9;font-size:10px;font-weight:900;letter-spacing:.14em}
        h1{font-size:32px;margin:8px 0 7px;letter-spacing:-.04em}
        .header p{max-width:750px;margin:0;color:#8493a9;line-height:1.6;font-size:13px}
        .actions{display:flex;gap:9px}
        select,button{height:38px;border-radius:10px;border:1px solid rgba(148,163,184,.15);background:#0c1626;color:#dce7f5;padding:0 12px}
        button{display:flex;align-items:center;gap:7px;cursor:pointer;font-weight:800}
        .metrics{max-width:1250px;margin:0 auto 18px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .metrics :global(svg){width:18px;height:18px}
        .metrics>div{border:1px solid rgba(148,163,184,.11);border-radius:16px;background:rgba(10,19,33,.84);padding:17px}
        .metric-label{display:block;color:#8190a6;font-size:11px;margin-top:10px}
        .metric-value{display:block;font-size:26px;margin-top:4px}
        .panel{max-width:1250px;margin:0 auto;border:1px solid rgba(148,163,184,.12);border-radius:20px;background:rgba(8,16,29,.92);overflow:hidden}
        .panel-head{padding:21px 22px;border-bottom:1px solid rgba(148,163,184,.08);display:flex;justify-content:space-between;gap:20px}
        h2{font-size:17px;margin:0 0 5px}.panel-head p{margin:0;color:#718097;font-size:11px}.count{color:#8190a5;font-size:11px}
        .query{padding:18px 22px;border-bottom:1px solid rgba(148,163,184,.07)}
        .query-top{display:flex;align-items:flex-start;gap:13px}
        .rank{width:28px;height:28px;border-radius:9px;background:rgba(34,211,238,.08);display:grid;place-items:center;color:#67e8f9;font-size:11px;font-weight:900;flex:none}
        .query-main{min-width:0;flex:1}.query-main>strong{font-size:13px;color:#eef5fc;line-height:1.45}
        .chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.chips span{font-size:9px;color:#8da0b9;border:1px solid rgba(148,163,184,.1);border-radius:999px;padding:4px 7px}
        .status{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:900;white-space:nowrap}.status.good{color:#6ee7b7}.status.warn{color:#fbbf24}.status.bad{color:#fb7185}
        .matches{margin:13px 0 0 41px;display:grid;gap:7px}
        .match,.gap{display:flex;align-items:center;gap:10px;padding:10px;border-radius:11px;background:rgba(255,255,255,.018);border:1px solid rgba(148,163,184,.07)}
        .product-icon{width:31px;height:31px;border-radius:8px;display:grid;place-items:center;background:rgba(99,102,241,.1);color:#a5b4fc}
        .product-info{flex:1;min-width:0}.product-info strong,.gap strong{display:block;font-size:11px}.product-info span,.gap span{display:block;color:#68778e;font-size:9px;margin-top:3px}
        .score{font-size:10px;color:#67e8f9;font-weight:900}.match a{color:#71809a}
        .gap{color:#fb7185}.gap div{flex:1}.empty{padding:70px 20px;display:grid;place-items:center;gap:8px;color:#71809a}.empty strong{color:#dce7f5}.empty span{font-size:11px}
        .error{max-width:1250px;margin:0 auto 14px;padding:12px;border:1px solid rgba(248,113,113,.2);background:rgba(127,29,29,.14);border-radius:12px;color:#fda4af;display:flex;gap:8px;align-items:center;font-size:12px}
        .note{max-width:1250px;margin:12px auto;color:#63728a;font-size:10px;display:flex;gap:7px;align-items:flex-start}
        .spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:850px){.page{padding:20px 14px}.header{align-items:flex-start;flex-direction:column}.actions{width:100%}.actions>*{flex:1}.metrics{grid-template-columns:repeat(2,1fr)}.query-top{flex-wrap:wrap}.status{margin-left:41px}.matches{margin-left:0}}
        @media(max-width:520px){.metrics{grid-template-columns:1fr}.panel-head{flex-direction:column}.h1{font-size:25px}}
      `}</style>
    </ProtectedRoute>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div>
      {icon}
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
    </div>
  );
}
