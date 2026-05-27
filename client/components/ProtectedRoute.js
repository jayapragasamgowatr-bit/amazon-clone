import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (
      adminOnly &&
      !user?.isAdmin
    ) {
      router.push("/");
      return;
    }
  }, [
    user,
    loading,
    adminOnly,
    router,
  ]);

  if (loading) {
    return (
      <div
        style={{
          padding: "80px",
          textAlign: "center",
          fontSize: "20px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) return null;

  if (
    adminOnly &&
    !user?.isAdmin
  ) {
    return null;
  }

  return children;
}