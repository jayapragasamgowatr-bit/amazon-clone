import { useState } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "../lib/api";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      alert("Registration Successful");
      router.push("/login");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-950 to-cyan-950 px-4 py-12">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-3xl border border-slate-700/70 bg-slate-900/90 p-8 shadow-2xl backdrop-blur"
      >
        <h1 className="mb-8 text-center text-4xl font-bold text-white">
          Register
        </h1>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-600 bg-slate-800/80 px-5 py-4 text-white placeholder-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-600 bg-slate-800/80 px-5 py-4 text-white placeholder-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-600 bg-slate-800/80 px-5 py-4 text-white placeholder-slate-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 py-4 text-lg font-bold text-white shadow-lg transition hover:scale-[1.01] hover:from-cyan-400 hover:to-violet-400"
          >
            Register
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-semibold text-cyan-400 transition hover:text-cyan-300"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}