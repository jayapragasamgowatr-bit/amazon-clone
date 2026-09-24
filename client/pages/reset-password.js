import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { resetPassword } from "../lib/api";

export default function ResetPassword() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const queryToken =
      typeof router.query.token === "string"
        ? router.query.token
        : "";

    setToken(queryToken);
  }, [router.isReady, router.query.token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      alert("This password reset link is invalid or incomplete.");
      return;
    }

    if (password.length < 6 || password.length > 128) {
      alert("Password must be between 6 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await resetPassword(token, password);
      setSuccess(true);
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);
      alert(error?.message || "Unable to reset password.");
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
          Reset Password
        </h1>

        {success ? (
          <>
            <p style={{ color: "#a7f3d0", lineHeight: 1.7 }}>
              Your password has been reset successfully.
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
              Continue to Login
            </Link>
          </>
        ) : (
          <>
            <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "22px" }}>
              Create a new password for your account.
            </p>

            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              style={{ marginBottom: "15px" }}
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              style={{ marginBottom: "18px" }}
            />

            <button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
