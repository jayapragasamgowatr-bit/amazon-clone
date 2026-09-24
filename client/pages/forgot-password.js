import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      alert("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await forgotPassword(cleanEmail);
      setSent(true);
    } catch (error) {
      console.error("FORGOT PASSWORD ERROR:", error);
      alert(error?.message || "Unable to process your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "35px",
          background: "rgba(7,20,38,0.88)",
        }}
      >
        <h1 style={{ fontSize: "30px", fontWeight: 900, marginBottom: "10px" }}>
          Forgot Password?
        </h1>

        {!sent ? (
          <>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "22px" }}>
              Enter your registered email address and we will send you a secure
              password reset link.
            </p>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              style={{ marginBottom: "18px" }}
            />

            <button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        ) : (
          <div>
            <p style={{ color: "#a7f3d0", lineHeight: 1.7 }}>
              If an account exists for this email, a password reset link has
              been sent. Please check your inbox and spam folder.
            </p>

            <Link
              href="/login"
              style={{
                display: "block",
                marginTop: "20px",
                textAlign: "center",
                color: "#67e8f9",
                fontWeight: 800,
              }}
            >
              Back to Login
            </Link>
          </div>
        )}

        {!sent && (
          <p
            style={{
              marginTop: "22px",
              marginBottom: 0,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            Remember your password?{" "}
            <Link href="/login" style={{ color: "#67e8f9", fontWeight: 800 }}>
              Login
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
