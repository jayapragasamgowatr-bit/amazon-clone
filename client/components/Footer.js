import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "80px",
        padding: "60px 40px 30px",
        background:
          "rgba(10,15,35,0.45)",
        backdropFilter:
          "blur(18px)",
        borderTop:
          "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* TOP SECTION */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "40px",
        }}
      >
        {/* BRAND */}
        <div>
          <motion.h2
            whileHover={{
              scale: 1.03,
            }}
            style={{
              fontSize: "28px",
              fontWeight: "800",
              marginBottom:
                "15px",
              background:
                "linear-gradient(90deg,#06b6d4,#8b5cf6,#ec4899)",
              WebkitBackgroundClip:
                "text",
              WebkitTextFillColor:
                "transparent",
            }}
          >
            Waventra Vetric
          </motion.h2>

          <p
            style={{
              opacity: 0.75,
              lineHeight: "1.7",
            }}
          >
            Smart water measurement and monitoring
            products, with secure checkout, order
            tracking and AI-assisted product selection.
          </p>
        </div>

        {/* SHOP */}
        <div>
          <h3
            style={{
              marginBottom:
                "15px",
            }}
          >
            Shop
          </h3>

          <FooterLink
            href="/"
            label="Home"
          />

          <FooterLink
            href="/cart"
            label="Cart"
          />

          <FooterLink
            href="/wishlist"
            label="Wishlist"
          />

          <FooterLink
            href="/orders"
            label="Orders"
          />
        </div>

        {/* AI TOOLS */}

        <div>
          <h3
            style={{
              marginBottom: "15px",
            }}
          >
            AI Tools
          </h3>

          <FooterLink href="/assistant" label="AI Assistant" />
          <FooterLink href="/semantic-search" label="Smart Search" />
          <FooterLink href="/compare" label="Compare Products" />
          <FooterLink href="/ai-support" label="AI Support" />
        </div>

        {/* ACCOUNT */}
        <div>
          <h3
            style={{
              marginBottom:
                "15px",
            }}
          >
            Account
          </h3>

          <FooterLink
            href="/login"
            label="Login"
          />

          <FooterLink
            href="/signup"
            label="Signup"
          />

          <FooterLink
            href="/account"
            label="Profile"
          />
          <FooterLink href="/dashboard" label="My Dashboard" />
          <FooterLink href="/notifications" label="Notifications" />
        </div>

        {/* SUPPORT */}
        <div>
          <h3
            style={{
              marginBottom:
                "15px",
            }}
          >
            Support
          </h3>

          <FooterLink href="/about" label="About us" />
          <FooterLink href="/faq" label="FAQ" />
          <FooterLink href="/shipping-policy" label="Shipping" />
          <FooterLink href="/returns-policy" label="Returns" />
          <FooterLink
            href="/help-center"
            label="Help Center"
          />

          <FooterLink
            href="/privacy-policy"
            label="Privacy Policy"
          />

          <FooterLink
            href="/terms-conditions"
            label="Terms & Conditions"
          />

          <FooterLink
            href="/contact"
            label="Contact"
          />
        </div>
      </div>

      {/* BOTTOM */}
      <div
        style={{
          maxWidth: "1400px",
          margin:
            "40px auto 0",
          paddingTop: "20px",
          borderTop:
            "1px solid rgba(255,255,255,0.08)",
          textAlign: "center",
          opacity: 0.65,
        }}
      >
        © {new Date().getFullYear()} Waventra Vetric.
        All rights reserved.
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  label,
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{
          x: 6,
        }}
        style={{
          marginBottom:
            "12px",
          cursor: "pointer",
          opacity: 0.8,
        }}
      >
        {label}
      </motion.div>
    </Link>
  );
}