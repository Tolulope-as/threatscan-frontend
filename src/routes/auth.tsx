import { createFileRoute, useNavigate, useLocation, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { loginUser, registerUser } from "../lib/firebase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ThreatScan" },
      { name: "description", content: "Login or register for ThreatScan to scan URLs and files for threats." },
    ],
  }),
  component: AuthPage,
});

type Tab = "login" | "register";

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab: Tab = (location.state as { tab?: Tab } | undefined)?.tab === "register" ? "register" : "login";
  const [tab, setTab] = useState<Tab>(initialTab);

  // shared state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // register state
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const inputClass =
    "w-full rounded-md border border-[#30363d] bg-[#161b22] px-4 py-2.5 text-[#c9d1d9] placeholder:text-[#8b949e] focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] transition-colors";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(loginEmail, loginPassword);
      navigate({ to: "/" });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await registerUser(name, regEmail, regPassword);
      navigate({ to: "/" });
    }  catch (err: any) {
  console.error("Registration error:", err)
  setError(err.message || "Registration failed.")

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4 py-12">
      <div
        className="w-full max-w-md rounded-xl border border-[#30363d] bg-[#161b22] p-6 sm:p-8"
        style={{ boxShadow: "0 0 80px -10px rgba(88, 166, 255, 0.35)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-1 text-sm text-[#58a6ff] hover:underline"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#30363d] mb-6">
          <button
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "login"
                ? "border-b-2 border-[#58a6ff] text-[#58a6ff]"
                : "border-b-2 border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === "register"
                ? "border-b-2 border-[#58a6ff] text-[#58a6ff]"
                : "border-b-2 border-transparent text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            Register
          </button>
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
            <div className="relative">
              <input
                type={showLoginPw ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowLoginPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9]"
                aria-label={showLoginPw ? "Hide password" : "Show password"}
              >
                {showLoginPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-sm text-[#f85149]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#58a6ff] px-4 py-2.5 font-medium text-[#0d1117] hover:bg-[#79b8ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={inputClass}
            />
            <input
              type="email"
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
            <div className="relative">
              <input
                type={showRegPw ? "text" : "password"}
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Password"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowRegPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9]"
                aria-label={showRegPw ? "Hide password" : "Show password"}
              >
                {showRegPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showRegConfirm ? "text" : "password"}
                required
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Confirm password"
                className={`${inputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowRegConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9]"
                aria-label={showRegConfirm ? "Hide password" : "Show password"}
              >
                {showRegConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-sm text-[#f85149]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#58a6ff] px-4 py-2.5 font-medium text-[#0d1117] hover:bg-[#79b8ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}