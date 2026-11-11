import Link from "next/link";
import { useRouter } from "next/router";

import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS, isStaff, roleOf, sectionsFor } from "../lib/permissions";

// Section menu shown above every admin page.
// It lists only the sections the signed-in staff member's role can use.
export default function AdminNav() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading || !isStaff(user)) return null;

  const sections = sectionsFor(user);
  if (!sections.length) return null;

  const isCurrent = (href) =>
    href === "/admin"
      ? router.pathname === "/admin"
      : router.pathname === href || router.pathname.startsWith(`${href}/`);

  return (
    <nav className="wvn" aria-label="Admin sections">
      <div className="wvn-inner">
        <span className="wvn-role" title="Your access level">
          {ROLE_LABELS[roleOf(user)] || "Staff"}
        </span>
        <div className="wvn-links">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              aria-current={isCurrent(section.href) ? "page" : undefined}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .wvn { position: sticky; top: 90px; z-index: 900; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: rgba(7, 14, 35, 0.92); backdrop-filter: blur(14px); }
        .wvn-inner { width: min(1700px, 100%); margin: 0 auto; padding: 0 42px; display: flex; align-items: center; gap: 16px; }
        .wvn-role { flex: none; padding: 4px 10px; border-radius: 999px; background: rgba(56, 189, 248, 0.14); color: #7dd3fc; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
        .wvn-links { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none; }
        .wvn-links::-webkit-scrollbar { display: none; }
        .wvn-links a { flex: none; padding: 14px 12px; border-bottom: 2px solid transparent; color: #94a3b8; font-size: 14px; font-weight: 600; white-space: nowrap; transition: color 0.15s ease, border-color 0.15s ease; }
        .wvn-links a:hover { color: #f8fafc; }
        .wvn-links a[aria-current="page"] { border-bottom-color: #38bdf8; color: #f8fafc; }
        @media (max-width: 1000px) {
          .wvn { top: 75px; }
          .wvn-inner { padding: 0 20px; }
        }
        @media (max-width: 500px) {
          .wvn-inner { padding: 0 15px; gap: 10px; }
        }
        @media print { .wvn { display: none; } }
      `}</style>
    </nav>
  );
}
