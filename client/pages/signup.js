import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(
        "Passwords do not match"
      );
      return;
    }

    try {
      setLoading(true);

      const data = await apiFetch(
        "/api/auth/signup",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      login(data);

      toast.success(
        "Account created successfully 🎉"
      );

      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }

    } catch (error) {
      toast.error(
        error.message
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "550px",
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          Create Account ✨
        </h1>

        <p
          style={{
            textAlign: "center",
            opacity: 0.75,
            marginBottom: "30px",
          }}
        >
          Join and start shopping
        </p>

        <form
          onSubmit={submitHandler}
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
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
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Signup"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "25px",
            opacity: 0.8,
          }}
        >
          Already have an account?{" "}
          <Link href="/login">
            <span
              style={{
                color: "#06b6d4",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Login
            </span>
          </Link>
        </p>
      </motion.div>
    </div>
  );
}