import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";

import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <>
      <SEO title="Page not found | Waventra Vetric" noIndex />

      <div className="wv404">
        <span className="wv404-code">404</span>
        <h1>We couldn&rsquo;t find that page</h1>
        <p>The link may be out of date, or the product may no longer be listed. Here are some good places to carry on.</p>

        <div className="wv404-actions">
          <Link href="/products" className="wv404-primary">
            Browse products <ArrowRight size={16} />
          </Link>
          <Link href="/semantic-search" className="wv404-secondary">
            <Search size={16} /> Smart search
          </Link>
          <Link href="/assistant" className="wv404-secondary">
            <Sparkles size={16} /> Ask the AI assistant
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .wv404 { min-height: 62vh; width: min(640px, calc(100% - 40px)); margin: 0 auto; padding: 72px 0; display: grid; align-content: center; justify-items: center; gap: 14px; text-align: center; color: #f8fafc; }
        .wv404-code { font-size: 14px; font-weight: 800; letter-spacing: 0.2em; color: #67e8f9; }
        .wv404 h1 { margin: 0; font-size: clamp(30px, 6vw, 44px); letter-spacing: -0.03em; text-wrap: balance; }
        .wv404 p { margin: 0 0 12px; font-size: 16px; line-height: 1.6; color: #94a3b8; }
        .wv404-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
        .wv404-actions a { height: 46px; padding: 0 18px; display: inline-flex; align-items: center; gap: 8px; border-radius: 12px; font-size: 14px; font-weight: 800; }
        .wv404-actions a svg { width: 16px; height: 16px; }
        .wv404-primary { background: linear-gradient(135deg, #06b6d4, #6366f1); color: #fff; }
        .wv404-secondary { border: 1px solid rgba(148, 163, 184, 0.28); background: rgba(15, 23, 42, 0.6); color: #e2e8f0; }
        .wv404-secondary:hover { border-color: #38bdf8; color: #fff; }
      `}</style>
    </>
  );
}
