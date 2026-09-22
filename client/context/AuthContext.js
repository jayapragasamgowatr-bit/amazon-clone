"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from "../lib/api";

const AuthContext = createContext(null);

// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const savedUser = localStorage.getItem("user");

        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            if (!cancelled) setUser(parsedUser);
          } catch {
            localStorage.removeItem("user");
          }
        }

        // Verify the token with the server so stale/deleted accounts
        // do not remain authenticated in the browser.
        const data = await getCurrentUser();
        const currentUser =
          data?.user || data?.data?.user || null;

        if (currentUser && !cancelled) {
          setUser(currentUser);
          localStorage.setItem("user", JSON.stringify(currentUser));
        }
      } catch (error) {
        if (!cancelled) {
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = async (
    email,
    password
  ) => {
    // Validate
    if (
      !email ||
      !email.trim()
    ) {
      throw new Error(
        "Email is required"
      );
    }

    if (!password) {
      throw new Error(
        "Password is required"
      );
    }

    console.log(
      "LOGIN START:",
      {
        email: email.trim(),
        passwordEntered: true,
      }
    );

    // ========================================================
    // IMPORTANT:
    // loginUser() expects an OBJECT
    // ========================================================

    const data =
      await loginUser({
        email: email.trim(),
        password,
      });

    console.log(
      "LOGIN RESPONSE:",
      data
    );

    // ========================================================
    // GET TOKEN
    // ========================================================

    const token =
      data?.token ||
      data?.accessToken;

    // ========================================================
    // GET USER
    // ========================================================

    const loggedUser =
      data?.user ||
      data?.data?.user ||
      null;

    // ========================================================
    // TOKEN CHECK
    // ========================================================

    if (!token) {
      console.error(
        "LOGIN RESPONSE DOES NOT CONTAIN TOKEN:",
        data
      );

      throw new Error(
        "Login successful but no authentication token was received."
      );
    }

    // ========================================================
    // SAVE TOKEN
    // ========================================================

    localStorage.setItem(
      "token",
      token
    );

    // Remove old alternate token
    localStorage.removeItem(
      "authToken"
    );

    console.log(
      "TOKEN SAVED:",
      !!localStorage.getItem(
        "token"
      )
    );

    // ========================================================
    // SAVE USER
    // ========================================================

    if (loggedUser) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          loggedUser
        )
      );

      setUser(
        loggedUser
      );
    }

    return data;
  };

  // ==========================================================
  // REGISTER
  // ==========================================================

  const register = async (
    name,
    email,
    password
  ) => {
    if (
      !name ||
      !name.trim()
    ) {
      throw new Error(
        "Name is required"
      );
    }

    if (
      !email ||
      !email.trim()
    ) {
      throw new Error(
        "Email is required"
      );
    }

    if (!password) {
      throw new Error(
        "Password is required"
      );
    }

    // ========================================================
    // IMPORTANT:
    // registerUser() also expects an OBJECT
    // ========================================================

    const data =
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

    console.log(
      "REGISTER RESPONSE:",
      data
    );

    // ========================================================
    // TOKEN
    // ========================================================

    const token =
      data?.token ||
      data?.accessToken;

    // ========================================================
    // USER
    // ========================================================

    const registeredUser =
      data?.user ||
      data?.data?.user ||
      null;

    // ========================================================
    // SAVE TOKEN
    // ========================================================

    if (token) {
      localStorage.setItem(
        "token",
        token
      );

      localStorage.removeItem(
        "authToken"
      );
    }

    // ========================================================
    // SAVE USER
    // ========================================================

    if (registeredUser) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          registeredUser
        )
      );

      setUser(
        registeredUser
      );
    }

    return data;
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {
    logoutUser();

    setUser(null);

    window.location.href =
      "/login";
  };

  // ==========================================================
  // AUTHENTICATED
  // ==========================================================

  const isAuthenticated =
    typeof window !== "undefined" &&
    !!localStorage.getItem(
      "token"
    );

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

export default AuthContext;