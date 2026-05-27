import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useCartStore from "../store/cartStore";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

function NavItem({
  href,
  label,
}) {
  return (
    <Link href={href}>
      <motion.span
        whileHover={{
          y: -3,
          scale: 1.05,
        }}
        whileTap={{
          scale: 0.96,
        }}
        style={{
          padding: "10px 16px",
          borderRadius: "14px",
          fontWeight: "600",
          display: "inline-block",
          cursor: "pointer",
        }}
      >
        {label}
      </motion.span>
    </Link>
  );
}

export default function Header() {
  const { user, logout } =
    useAuth();

  const {
    wishlist,
  } = useWishlist();

  const [mounted, setMounted] =
    useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  const cartCount =
    useCartStore((state) =>
      mounted
        ? state.getCartCount()
        : 0
    );

  useEffect(() => {
    setMounted(true);

    const handleScroll =
      () => {
        setScrolled(
          window.scrollY > 20
        );
      };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, []);

  return (
    <motion.header
      initial={{
        y: -80,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9999,
        padding: scrolled
          ? "12px 28px"
          : "20px 36px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          flexWrap: "wrap",
          gap: "20px",
          borderRadius: "22px",
          padding: "16px 24px",
          background:
            "rgba(10,15,35,0.7)",
          backdropFilter:
            "blur(18px)",
        }}
      >
        <Link href="/">
          <div
            className="shimmer-text"
            style={{
              fontSize: "30px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Amazon Clone
          </div>
        </Link>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <NavItem
            href="/"
            label="Home"
          />

          <NavItem
            href="/cart"
            label={`Cart (${cartCount})`}
          />

          {user && (
            <>
              <NavItem
                href="/wishlist"
                label={`Wishlist (${wishlist.length})`}
              />

              <NavItem
                href="/orders"
                label="Orders"
              />

              <NavItem
                href="/profile"
                label="Profile"
              />
            </>
          )}

          {!user && (
            <>
              <NavItem
                href="/login"
                label="Login"
              />

              <NavItem
                href="/signup"
                label="Signup"
              />
            </>
          )}

          {/* ADMIN BUTTON */}
          {user?.isAdmin && (
            <NavItem
              href="/admin"
              label="Admin"
            />
          )}

          {user && (
            <button
              onClick={logout}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}