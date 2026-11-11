import Link from "next/link";

import SEO from "./SEO";

// Shared frame for the information pages (About, FAQ, Shipping, Returns)
// so they all line up the same way and match the rest of the site.
const LINKS = [
  { href: "/about", label: "About us" },
  { href: "/faq", label: "FAQ" },
  { href: "/shipping-policy", label: "Shipping" },
  { href: "/returns-policy", label: "Returns" },
  { href: "/contact", label: "Contact" },
];

export default function InfoPage({ path, eyebrow, title, lead, illustration, children }) {
  return (
    <div className="ui-page">
      <SEO title={`${title} | Waventra Vetric`} description={lead} path={path} />

      <nav className="ui-tabs" aria-label="Information pages">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} aria-current={link.href === path ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="wvinfo-hero">
        <div>
          <span className="ui-eyebrow">{eyebrow}</span>
          <h1 className="ui-title">{title}</h1>
          <p className="ui-lead">{lead}</p>
        </div>
        {illustration && <div className="wvinfo-art">{illustration}</div>}
      </div>

      {children}

      <style jsx global>{`
        .wvinfo-hero { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: center; gap: 32px; margin: 8px 0 40px; }
        .wvinfo-art svg { display: block; width: 100%; max-width: 380px; height: auto; margin-left: auto; }
        .wvinfo-fill { display: inline; padding: 1px 6px; border-radius: 6px; background: rgba(251, 191, 36, 0.14); color: #fcd34d; font-weight: 600; }
        .wvinfo-faq { display: grid; gap: 10px; }
        .wvinfo-faq details { border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; background: rgba(255, 255, 255, 0.05); }
        .wvinfo-faq summary { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 20px; font-size: 16px; font-weight: 700; cursor: pointer; list-style: none; }
        .wvinfo-faq summary::-webkit-details-marker { display: none; }
        .wvinfo-faq summary::after { content: "+"; flex: none; font-size: 22px; font-weight: 400; line-height: 1; color: #7dd3fc; }
        .wvinfo-faq details[open] summary::after { content: "–"; }
        .wvinfo-faq details > div { padding: 0 20px 18px; max-width: 72ch; font-size: 15px; line-height: 1.7; color: #cbd5e1; }
        .wvinfo-faq details > div a { color: #7dd3fc; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .wvinfo-group { margin: 32px 0 12px; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; }
        .wvinfo-steps { counter-reset: step; display: grid; gap: 14px; margin: 0; padding: 0; list-style: none; }
        .wvinfo-steps li { counter-increment: step; display: grid; grid-template-columns: 40px 1fr; gap: 14px; align-items: start; }
        .wvinfo-steps li::before { content: counter(step); display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #06b6d4, #6366f1); font-weight: 800; }
        .wvinfo-steps strong { display: block; margin-bottom: 2px; }
        .wvinfo-steps span { color: #94a3b8; font-size: 14px; line-height: 1.6; }
        @media (max-width: 760px) {
          .wvinfo-hero { grid-template-columns: 1fr; gap: 20px; margin-bottom: 28px; }
          .wvinfo-art svg { max-width: 300px; margin: 0; }
        }
      `}</style>
    </div>
  );
}

// Shows a company detail; values still in [brackets] are highlighted so the
// store owner can see at a glance what needs filling in.
export function Detail({ value }) {
  const text = String(value || "");
  return /^\[.*\]$/.test(text.trim()) ? <span className="wvinfo-fill">{text}</span> : <>{text}</>;
}
