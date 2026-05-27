import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import toast from "react-hot-toast";
import { apiFetch } from "../lib/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export function WishlistProvider({
  children,
}) {
  const [wishlist, setWishlist] =
    useState([]);

  const { user } = useAuth();

  const getToken = () => {
    if (
      typeof window === "undefined"
    )
      return null;

    return (
      localStorage.getItem("token") ||
      localStorage.getItem(
        "authToken"
      ) ||
      localStorage.getItem(
        "jwt"
      )
    );
  };

  useEffect(() => {
    const token = getToken();

    if (user && token) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const fetchWishlist =
    async () => {
      try {
        const token =
          getToken();

        if (!token) return;

        const data =
          await apiFetch(
            "/api/wishlist"
          );

        setWishlist(data || []);
      } catch (error) {
        console.error(
          "Wishlist fetch error:",
          error.message
        );
      }
    };

  const toggleWishlist =
    async (productId) => {
      const token =
        getToken();

      if (!user || !token) {
        toast.error(
          "Please login first"
        );
        return;
      }

      try {
        const exists =
          wishlist.some(
            (item) =>
              item._id ===
              productId
          );

        if (exists) {
          await apiFetch(
            `/api/wishlist/${productId}`,
            {
              method: "DELETE",
            }
          );

          setWishlist(
            wishlist.filter(
              (item) =>
                item._id !==
                productId
            )
          );

          toast.success(
            "Removed from wishlist"
          );
        } else {
          await apiFetch(
            "/api/wishlist",
            {
              method: "POST",
              body: JSON.stringify({
                productId,
              }),
            }
          );

          fetchWishlist();

          toast.success(
            "Added to wishlist"
          );
        }
      } catch (error) {
        toast.error(
          error.message
        );
      }
    };

  const isWishlisted = (
    productId
  ) =>
    wishlist.some(
      (item) =>
        item._id === productId
    );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () =>
  useContext(WishlistContext);