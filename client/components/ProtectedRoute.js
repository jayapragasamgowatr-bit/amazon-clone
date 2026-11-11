import { useEffect } from "react";
import { useRouter } from "next/router";

import { useAuth } from "../context/AuthContext";
import { hasPermission, homeFor, isStaff, permissionForPath } from "../lib/permissions";

// ============================================================
// PROTECTED ROUTE
// ============================================================
//   <ProtectedRoute>                 any signed-in customer
//   <ProtectedRoute adminOnly>       staff whose role covers this
//                                    admin page (see lib/permissions.js)
//   <ProtectedRoute permission="x">  staff holding permission "x"
//
// This only decides what the browser shows. The server checks the
// same permissions again on every request.
// ============================================================

export default function ProtectedRoute({ children, adminOnly = false, permission = "" }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const needed = permission || (adminOnly ? permissionForPath(router.pathname) : "");
  const allowed = !needed || hasPermission(user, needed);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowed) {
      // Staff land on the first section their role can use; customers go home.
      router.replace(isStaff(user) ? homeFor(user) : "/");
    }
  }, [user, loading, allowed, router]);

  if (loading || !user) {
    return (
      <div className="ui-loading" role="status" aria-live="polite" style={{ minHeight: "60vh" }}>
        <span className="wv-spinner" aria-hidden="true" />
        Checking your session…
      </div>
    );
  }

  if (!allowed) return null;

  return children;
}
