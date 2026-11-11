"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../lib/api";

const WishlistContext =
  createContext(null);

export function WishlistProvider({
  children,
}) {
  const [wishlist, setWishlist] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  // ==========================================================
  // GET TOKEN
  // ==========================================================

  const hasToken =
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return false;
      }

      return !!localStorage.getItem(
        "token"
      );
    };

  // ==========================================================
  // NORMALIZE WISHLIST
  // ==========================================================

  const normalizeWishlist =
    useCallback((data) => {
      if (
        Array.isArray(data)
      ) {
        return data;
      }

      if (
        Array.isArray(
          data?.wishlist
        )
      ) {
        return data.wishlist;
      }

      if (
        Array.isArray(
          data?.products
        )
      ) {
        return data.products;
      }

      if (
        Array.isArray(
          data?.items
        )
      ) {
        return data.items;
      }

      return [];
    }, []);

  // ==========================================================
  // FETCH WISHLIST
  // ==========================================================

  const fetchWishlist =
    useCallback(
      async () => {

        if (!hasToken()) {
          setWishlist([]);
          return [];
        }

        try {
          setLoading(true);

          const data =
            await getWishlist();

          const list =
            normalizeWishlist(
              data
            );

          setWishlist(list);

          return list;

        } catch (error) {

          // An expired or invalid session is an expected situation,
          // not a crash: clear the wishlist quietly and carry on.
          const sessionEnded =
            /token|authorized|session|expired|login/i.test(
              error?.message || ""
            );

          if (sessionEnded) {
            setWishlist([]);
          } else {
            console.warn(
              "FETCH WISHLIST ERROR:",
              error?.message || error
            );
          }

          return [];

        } finally {
          setLoading(false);
        }
      },
      [normalizeWishlist]
    );

  // ==========================================================
  // INITIAL FETCH
  // ==========================================================

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // ==========================================================
  // PRODUCT ID HELPER
  // ==========================================================

  const getProductId =
    (item) => {

      if (!item) {
        return null;
      }

      // Direct product
      if (
        item._id ||
        item.id
      ) {
        return String(
          item._id ||
          item.id
        );
      }

      // Wishlist item
      if (
        item.product?._id ||
        item.product?.id
      ) {
        return String(
          item.product._id ||
          item.product.id
        );
      }

      if (
        item.productId
      ) {
        return String(
          item.productId
        );
      }

      return null;
    };

  // ==========================================================
  // IS WISHLISTED
  // ==========================================================

  const isWishlisted =
    useCallback(
      (productId) => {

        if (!productId) {
          return false;
        }

        const target =
          String(productId);

        return wishlist.some(
          (item) => {

            const id =
              getProductId(item);

            return (
              id === target
            );
          }
        );
      },
      [wishlist]
    );

  // ==========================================================
  // TOGGLE WISHLIST
  // ==========================================================

  const toggleWishlist =
    useCallback(
      async (productId) => {

        if (!productId) {
          throw new Error(
            "Product ID is required"
          );
        }

        if (!hasToken()) {
          throw new Error(
            "Please login to use wishlist"
          );
        }

        const exists =
          isWishlisted(
            productId
          );

        // ------------------------------------------------------
        // REMOVE
        // ------------------------------------------------------

        if (exists) {

          await removeFromWishlist(
            productId
          );

          setWishlist(
            (current) =>
              current.filter(
                (item) =>
                  getProductId(
                    item
                  ) !==
                  String(
                    productId
                  )
              )
          );

        }

        // ------------------------------------------------------
        // ADD
        // ------------------------------------------------------

        else {

          const data =
            await addToWishlist(
              productId
            );

          console.log(
            "ADD WISHLIST RESPONSE:",
            data
          );

          // Refresh from server
          await fetchWishlist();
        }

        return !exists;
      },
      [
        isWishlisted,
        fetchWishlist,
      ]
    );

  // ==========================================================
  // CLEAR WISHLIST
  // ==========================================================

  const clearWishlist =
    useCallback(() => {
      setWishlist([]);
    }, []);

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value =
    useMemo(
      () => ({
        wishlist,
        loading,

        fetchWishlist,

        toggleWishlist,

        isWishlisted,

        clearWishlist,

        wishlistCount:
          wishlist.length,
      }),
      [
        wishlist,
        loading,
        fetchWishlist,
        toggleWishlist,
        isWishlisted,
        clearWishlist,
      ]
    );

  return (
    <WishlistContext.Provider
      value={value}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useWishlist() {
  const context =
    useContext(
      WishlistContext
    );

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}

export default WishlistContext;