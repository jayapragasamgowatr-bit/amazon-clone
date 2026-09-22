import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Shield,
  Search,
  X as CloseIcon,
} from "lucide-react";
import toast from "react-hot-toast";

import useCartStore from "../store/cartStore";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { getProductSuggestions } from "../lib/api";

export default function Header() {
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const { user, logout } = useAuth();

  const cartItems = useCartStore((state) => state.cart);

  const cartCount = Array.isArray(cartItems)
    ? cartItems.reduce(
        (total, item) => total + Number(item.quantity || 1),
        0
      )
    : 0;

  const { wishlist } = useWishlist();

  const wishlistCount = Array.isArray(wishlist)
    ? wishlist.length
    : 0;

  const isAdmin =
    user?.role === "admin" ||
    user?.isAdmin === true ||
    user?.isAdmin === 1;

  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    const value = search.trim();
    if (!value) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const data = await getProductSuggestions(value);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("SEARCH SUGGESTIONS ERROR:", error);
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = search.trim();
    if (!value) return;
    setSearchOpen(false);
    setSuggestions([]);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("jwt");
    }

    toast.success("Logged out successfully");

    router.push("/");
  };

  return (
    <>
      {/* =====================================================
          WAVENTRA VETRIC HEADER
      ===================================================== */}

      <header className="wv-header">
        <div className="wv-header-inner">

          {/* LOGO */}

          <Link href="/" className="wv-logo">
            <span>Waventra</span>{" "}
            <strong>Vetric</strong>
          </Link>

          {/* PRODUCT SEARCH */}

          <div className="wv-search-wrap">
            <form className="wv-search" onSubmit={submitSearch}>
              <Search size={18} />
              <input
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
                placeholder="Search products..."
                aria-label="Search products"
              />
              {search && (
                <button type="button" className="wv-search-clear" onClick={() => { setSearch(""); setSuggestions([]); }}>
                  <CloseIcon size={15} />
                </button>
              )}
            </form>
            {searchOpen && search.trim() && suggestions.length > 0 && (
              <div className="wv-suggestions">
                {suggestions.map((item) => (
                  <Link key={item._id} href={`/product/${item._id}`} onClick={() => setSearchOpen(false)}>
                    <Search size={14} /> <span>{item.name}</span>
                  </Link>
                ))}
                <button type="button" onClick={submitSearch}>View all results →</button>
              </div>
            )}
          </div>

          {/* DESKTOP NAVIGATION */}

          <nav className="wv-nav">

            <Link href="/" className="wv-nav-link">
              Home
            </Link>

            <Link
              href="/products"
              className="wv-nav-link"
            >
              Products
            </Link>

            <Link
              href="/assistant"
              className="wv-nav-link wv-ai-link"
            >
              <span className="wv-ai-spark">✦</span>
              AI Assistant
            </Link>

            <Link
              href="/wishlist"
              className="wv-nav-link"
            >
              Wishlist
              {wishlistCount > 0 && (
                <span className="wv-count">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="wv-nav-link wv-icon-link"
            >
              <ShoppingCart size={20} />

              {cartCount > 0 && (
                <span className="wv-count">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {user && (
              <Link
                href="/orders"
                className="wv-nav-link"
              >
                Orders
              </Link>
            )}

            {user && (
              <Link
                href="/profile"
                className="wv-nav-link"
              >
                <User size={18} />
                Profile
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className="wv-nav-link"
              >
                <Shield size={18} />
                Admin
              </Link>
            )}

            {/* LOGIN / REGISTER / LOGOUT */}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="wv-logout"
              >
                <LogOut size={17} />
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="wv-login"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="wv-register"
                >
                  Register
                </Link>
              </>
            )}
          </nav>

          {/* MOBILE BUTTON */}

          <button
            type="button"
            className="wv-mobile-button"
            onClick={() =>
              setMobileOpen((value) => !value)
            }
          >
            {mobileOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}

        {mobileOpen && (
          <div className="wv-mobile-menu">

            <Link href="/">
              Home
            </Link>

            <Link href="/products">
              Products
            </Link>

            <Link href="/assistant" className="wv-mobile-ai-link">
              ✦ AI Assistant
            </Link>

            <Link href="/wishlist">
              Wishlist
              {wishlistCount > 0 &&
                ` (${wishlistCount})`}
            </Link>

            <Link href="/cart">
              Cart
              {cartCount > 0 &&
                ` (${cartCount})`}
            </Link>

            {user && (
              <Link href="/orders">
                Orders
              </Link>
            )}

            {user && (
              <Link href="/profile">
                Profile
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin">
                Admin Dashboard
              </Link>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="wv-mobile-logout"
              >
                Logout
              </button>
            ) : (
              <div className="wv-mobile-auth">

                <Link href="/login">
                  Login
                </Link>

                <Link href="/register">
                  Register
                </Link>

              </div>
            )}
          </div>
        )}
      </header>

      {/* =====================================================
          HEADER CSS
      ===================================================== */}

      <style jsx>{`

        .wv-header {
          position: sticky !important;
          top: 0 !important;
          left: 0 !important;

          width: 100% !important;

          z-index: 99999 !important;

          background:
            rgba(7, 14, 35, 0.96) !important;

          background-color:
            #070e23 !important;

          border-bottom:
            1px solid rgba(255,255,255,0.08) !important;

          box-shadow:
            0 10px 40px rgba(0,0,0,0.30) !important;

          backdrop-filter:
            blur(18px);

          -webkit-backdrop-filter:
            blur(18px);
        }

        .wv-header-inner {
          width: 100%;
          max-width: 1700px;

          margin: 0 auto;

          min-height: 90px;

          padding: 0 42px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 25px;
        }

        /* LOGO */

        .wv-logo {
          display: flex;
          align-items: center;

          white-space: nowrap;

          text-decoration: none;

          font-size: 32px;
          font-weight: 900;

          letter-spacing: -1px;

          color: #ffffff !important;
        }

        .wv-logo span {
          color: #38bdf8 !important;
        }

        .wv-logo strong {
          color: #f8fafc !important;
          margin-left: 6px;
        }

        /* NAV */

        .wv-search-wrap { position:relative; flex:1; max-width:390px; }
        .wv-search { display:flex; align-items:center; gap:9px; padding:10px 12px; border:1px solid rgba(255,255,255,.12); border-radius:13px; background:rgba(255,255,255,.06); color:#94a3b8; }
        .wv-search input { min-width:0; width:100%; border:0; outline:0; background:transparent; color:#fff; font-size:14px; }
        .wv-search input::placeholder { color:#94a3b8; }
        .wv-search-clear { border:0; background:transparent; color:#94a3b8; cursor:pointer; display:flex; }
        .wv-suggestions { position:absolute; top:calc(100% + 8px); left:0; right:0; padding:7px; border:1px solid rgba(255,255,255,.1); border-radius:14px; background:#0b1228; box-shadow:0 18px 45px rgba(0,0,0,.4); z-index:100000; }
        .wv-suggestions a,.wv-suggestions button { width:100%; display:flex; align-items:center; gap:9px; padding:10px; border:0; border-radius:9px; background:transparent; color:#fff; text-align:left; cursor:pointer; font-size:13px; }
        .wv-suggestions a:hover,.wv-suggestions button:hover { background:rgba(255,255,255,.07); color:#38bdf8; }
        .wv-suggestions button { color:#38bdf8; font-weight:800; margin-top:3px; }

        .wv-nav {
          display: flex;
          align-items: center;

          gap: 8px;
        }

        .wv-nav-link {
          position: relative;

          display: inline-flex;
          align-items: center;

          gap: 7px;

          padding: 13px 16px;

          border-radius: 12px;

          color: #f8fafc !important;

          text-decoration: none;

          font-size: 16px;
          font-weight: 700;

          transition: 0.25s ease;
        }

        .wv-ai-link {
          border: 1px solid rgba(34, 211, 238, 0.28);
          background: rgba(34, 211, 238, 0.08);
          color: #67e8f9 !important;
          border-radius: 10px;
          padding-left: 12px;
          padding-right: 12px;
        }

        .wv-ai-link:hover {
          background: rgba(34, 211, 238, 0.16);
          border-color: rgba(34, 211, 238, 0.5);
        }

        .wv-ai-spark {
          font-size: 15px;
          margin-right: 4px;
        }

        .wv-mobile-ai-link {
          color: #67e8f9 !important;
          font-weight: 800;
        }

        .wv-nav-link:hover {
          background:
            rgba(255,255,255,0.08);

          color: #38bdf8 !important;

          transform: translateY(-1px);
        }

        /* COUNT */

        .wv-count {
          min-width: 19px;
          height: 19px;

          padding: 0 5px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          border-radius: 999px;

          background: #06b6d4 !important;

          color: white !important;

          font-size: 10px;
          font-weight: 900;
        }

        /* CART */

        .wv-icon-link {
          width: 50px;
          height: 50px;

          justify-content: center;

          background:
            rgba(255,255,255,0.06);
        }

        /* LOGIN */

        .wv-login {
          display: inline-flex;
          align-items: center;

          padding: 13px 18px;

          border-radius: 12px;

          color: #ffffff !important;

          background:
            rgba(255,255,255,0.07);

          text-decoration: none;

          font-weight: 800;
        }

        /* REGISTER */

        .wv-register {
          display: inline-flex;
          align-items: center;

          padding: 13px 20px;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #06b6d4,
              #6366f1
            ) !important;

          color: #ffffff !important;

          text-decoration: none;

          font-weight: 900;
        }

        /* LOGOUT */

        .wv-logout {
          display: inline-flex;
          align-items: center;

          gap: 8px;

          padding: 13px 20px;

          border-radius: 12px;

          border: none !important;

          background:
            linear-gradient(
              135deg,
              #06b6d4,
              #6366f1
            ) !important;

          color: #ffffff !important;

          font-size: 15px;
          font-weight: 900;

          cursor: pointer;

          box-shadow:
            0 8px 25px
            rgba(6,182,212,0.20);
        }

        .wv-logout:hover {
          transform: translateY(-2px);

          box-shadow:
            0 12px 30px
            rgba(6,182,212,0.30);
        }

        /* MOBILE BUTTON */

        .wv-mobile-button {
          display: none;

          width: 45px;
          height: 45px;

          align-items: center;
          justify-content: center;

          border: 1px solid
            rgba(255,255,255,0.15) !important;

          border-radius: 12px;

          background:
            rgba(255,255,255,0.08) !important;

          color: white !important;

          cursor: pointer;
        }

        /* MOBILE MENU */

        .wv-mobile-menu {
          padding: 18px 20px 22px;

          display: grid;

          gap: 8px;

          background:
            #070e23 !important;

          border-top:
            1px solid rgba(255,255,255,0.08);
        }

        .wv-mobile-menu a {
          padding: 14px;

          border-radius: 10px;

          color: white !important;

          background:
            rgba(255,255,255,0.06);

          text-decoration: none;

          font-weight: 700;
        }

        .wv-mobile-logout {
          padding: 14px;

          border: none !important;

          border-radius: 10px;

          background:
            linear-gradient(
              135deg,
              #06b6d4,
              #6366f1
            ) !important;

          color: white !important;

          font-weight: 900;
        }

        .wv-mobile-auth {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 8px;
        }

        .wv-mobile-auth a {
          text-align: center;
        }

        /* RESPONSIVE */

        @media (max-width: 1000px) {
          .wv-search-wrap { display:none; }

          .wv-header-inner {
            min-height: 75px;
            padding: 0 20px;
          }

          .wv-logo {
            font-size: 25px;
          }

          .wv-search-wrap { position:relative; flex:1; max-width:390px; }
        .wv-search { display:flex; align-items:center; gap:9px; padding:10px 12px; border:1px solid rgba(255,255,255,.12); border-radius:13px; background:rgba(255,255,255,.06); color:#94a3b8; }
        .wv-search input { min-width:0; width:100%; border:0; outline:0; background:transparent; color:#fff; font-size:14px; }
        .wv-search input::placeholder { color:#94a3b8; }
        .wv-search-clear { border:0; background:transparent; color:#94a3b8; cursor:pointer; display:flex; }
        .wv-suggestions { position:absolute; top:calc(100% + 8px); left:0; right:0; padding:7px; border:1px solid rgba(255,255,255,.1); border-radius:14px; background:#0b1228; box-shadow:0 18px 45px rgba(0,0,0,.4); z-index:100000; }
        .wv-suggestions a,.wv-suggestions button { width:100%; display:flex; align-items:center; gap:9px; padding:10px; border:0; border-radius:9px; background:transparent; color:#fff; text-align:left; cursor:pointer; font-size:13px; }
        .wv-suggestions a:hover,.wv-suggestions button:hover { background:rgba(255,255,255,.07); color:#38bdf8; }
        .wv-suggestions button { color:#38bdf8; font-weight:800; margin-top:3px; }

        .wv-nav {
            display: none;
          }

          .wv-mobile-button {
            display: flex;
          }
        }

        @media (max-width: 500px) {

          .wv-logo {
            font-size: 21px;
          }

          .wv-header-inner {
            padding: 0 15px;
          }
        }

      `}</style>
    </>
  );
}