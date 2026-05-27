import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { WishlistProvider } from "../context/WishlistContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

export default function App({
  Component,
  pageProps,
  router,
}) {
  return (
    <AuthProvider>
      <WishlistProvider>
        {/* PREMIUM BACKGROUND */}
        <div className="bg-wrapper">
          <div className="aurora aurora-1"></div>
          <div className="aurora aurora-2"></div>
          <div className="aurora aurora-3"></div>

          <div className="particles">
            {[...Array(30)].map((_, i) => (
              <span key={i}></span>
            ))}
          </div>
        </div>

        {/* TOAST */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background:
                "rgba(15,23,42,0.9)",
              color: "#fff",
              border:
                "1px solid rgba(255,255,255,0.08)",
              backdropFilter:
                "blur(14px)",
              borderRadius: "16px",
            },
          }}
        />

        {/* HEADER */}
        <Header />

        {/* PAGE ANIMATION */}
        <AnimatePresence mode="wait">
          <motion.div
            key={router.route}
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -12,
            }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            style={{
              minHeight: "80vh",
            }}
          >
            <Component
              {...pageProps}
            />
          </motion.div>
        </AnimatePresence>

        {/* FOOTER */}
        <Footer />
      </WishlistProvider>
    </AuthProvider>
  );
}