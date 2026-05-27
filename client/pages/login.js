import { useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await apiFetch(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      console.log(
        "LOGIN RESPONSE:",
        data
      );

      const fixedUser = {
        ...data.user,
        isAdmin:
          data.user.isAdmin ||
          data.user.email ===
            "admin@gmail.com",
      };

      login(
        fixedUser,
        data.token
      );

      toast.success(
        "Logged in successfully"
      );

      if (fixedUser.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      toast.error(
        error.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="glass-card"
      style={{
        maxWidth: "420px",
        margin: "100px auto",
        padding: "32px",
        borderRadius: "20px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "24px",
          fontSize: "32px",
          fontWeight: "800",
        }}
      >
        Login
      </h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

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
          style={{
            marginTop: "14px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "18px",
            width: "100%",
            opacity: loading
              ? 0.7
              : 1,
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