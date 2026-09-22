import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}) {
  const router = useRouter();

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const isAdmin =
      user.role === "admin" ||
      user.isAdmin === true;

    if (
      adminOnly &&
      !isAdmin
    ) {
      router.replace("/");
    }
  }, [
    user,
    loading,
    adminOnly,
    router,
  ]);

  if (
    loading ||
    !user
  ) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  const isAdmin =
    user.role === "admin" ||
    user.isAdmin === true;

  if (
    adminOnly &&
    !isAdmin
  ) {
    return null;
  }

  return children;
}