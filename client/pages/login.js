import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const router = useRouter();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] =
    useState(false);

  // ============================================================
  // LOGIN
  // ============================================================

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

      console.log(
        "LOGIN FORM:",
        {
          email: cleanEmail,
          passwordEntered: !!password,
        }
      );

      // IMPORTANT
      await login(
        cleanEmail,
        password
      );

      console.log(
        "LOGIN SUCCESS"
      );

      router.push("/");

    } catch (error) {
      console.error(
        "LOGIN PAGE ERROR:",
        error
      );

      alert(
        error?.message ||
        "Login failed"
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        minHeight:
          "calc(100vh - 80px)",

        display: "flex",

        alignItems: "center",

        justifyContent:
          "center",

        padding: "30px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "35px",
          background:
            "rgba(7,20,38,0.78)",
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

        {/* EMAIL */}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          required
          autoComplete="email"
          style={{
            width: "100%",
            marginBottom: "15px",
            boxSizing:
              "border-box",
          }}
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          required
          autoComplete="current-password"
          style={{
            width: "100%",
            marginBottom: "20px",
            boxSizing:
              "border-box",
          }}
        />

        {/* LOGIN */}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
          }}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>
      </form>
    </div>
  );
}