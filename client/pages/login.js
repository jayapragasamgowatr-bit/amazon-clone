import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      alert("Please enter your email.");
      return;
    }

    if (!password) {
      alert("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      await login(cleanEmail, password);

      router.push("/");
    } catch (error) {
      console.error("LOGIN PAGE ERROR:", error);
      alert(error?.message || "Login failed");
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
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 900,
            marginBottom: "25px",
          }}
        >
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{
            width: "100%",
            marginBottom: "15px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            width: "100%",
            marginBottom: "10px",
            boxSizing: "border-box",
          }}
        />

        <div style={{ textAlign: "right", marginBottom: "20px" }}>
          <Link
            href="/forgot-password"
            style={{
              color: "#67e8f9",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p
          style={{
            marginTop: "22px",
            marginBottom: 0,
            textAlign: "center",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          No account?{" "}
          <Link
            href="/register"
            style={{
              color: "#67e8f9",
              fontWeight: 800,
            }}
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
