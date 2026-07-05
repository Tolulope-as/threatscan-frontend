import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Menu, X, User } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { auth, logoutUser, onAuthChange } from "../lib/firebase";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, []);

  const firstName = user?.displayName?.split(" ")[0] || "";

  const handleLogout = async () => {
    await logoutUser();
    setOpen(false);
    navigate({ to: "/" });
  };

  const navItems: { label: string; to: "/" | "/results" | "/history" }[] = [
    { label: "Home", to: "/" },
    { label: "Results", to: "/results" },
    { label: "History", to: "/history" },
  ];

  const linkClass = (to: string) => {
    const active = location.pathname === to;
    return `text-sm font-medium pb-1 border-b-2 transition-colors duration-200 ${
      active
        ? "text-[#58a6ff] border-[#58a6ff]"
        : "text-[#8b949e] border-transparent hover:text-[#58a6ff] hover:border-[#58a6ff]"
    }`;
  };

  const goAuth = (tab: "login" | "register") => {
    setOpen(false);
    navigate({ to: "/auth", state: { tab } as never });
  };

  return (
    <nav className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--accent-blue)" }}
            onClick={() => setOpen(false)}
          >
            ThreatScan
          </Link>

          {/* Center nav (desktop) */}
          <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass(item.to)}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right buttons (desktop) */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <span className="flex items-center gap-2 text-sm text-[#c9d1d9]">
                  <User size={16} className="text-[#58a6ff]" />
                  {firstName}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-[#f85149] bg-transparent px-4 py-2 text-sm font-medium text-[#f85149] transition-colors hover:bg-[#f85149] hover:text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => goAuth("login")}
                  className="rounded-md border border-[#30363d] bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff]"
                >
                  Login
                </button>
                <button
                  onClick={() => goAuth("register")}
                  className="rounded-md bg-[#58a6ff] px-4 py-2 text-sm font-medium text-[#0d1117] transition-colors hover:bg-[#79b8ff]"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#30363d] text-[#c9d1d9] transition-colors hover:text-[#58a6ff] md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={linkClass(item.to)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              {user ? (
                <>
                  <span className="flex items-center gap-2 text-sm text-[#c9d1d9] py-2">
                    <User size={16} className="text-[#58a6ff]" />
                    {firstName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-md border border-[#f85149] bg-transparent px-4 py-2 text-sm font-medium text-[#f85149] transition-colors hover:bg-[#f85149] hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => goAuth("login")}
                    className="w-full rounded-md border border-[#30363d] bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-[#58a6ff] hover:text-[#58a6ff]"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => goAuth("register")}
                    className="w-full rounded-md bg-[#58a6ff] px-4 py-2 text-sm font-medium text-[#0d1117] transition-colors hover:bg-[#79b8ff]"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}