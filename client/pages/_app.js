import "../styles/globals.css";

import { AuthProvider } from "../context/AuthContext";
import { WishlistProvider } from "../context/WishlistContext";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { trackPageView } from "../lib/eventTracker";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    trackPageView(router.asPath?.split("?")[0] || "/");
  }, [router.isReady, router.asPath]);

  return (
    <AuthProvider>
      <WishlistProvider>
        <Header />

        <main
          style={{
            minHeight: "calc(100vh - 80px)",
          }}
        >
          <Component {...pageProps} />
        </main>

        <Footer />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#0f172a",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
      </WishlistProvider>
    </AuthProvider>
  );
}