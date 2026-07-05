import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileSearch } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { auth, getUserScans } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Scan History — ThreatScan" },
      { name: "description", content: "View your previous URL and file scan history on ThreatScan." },
      { property: "og:title", content: "Scan History — ThreatScan" },
      { property: "og:description", content: "View your previous URL and file scan history on ThreatScan." },
    ],
  }),
  component: HistoryPage,
});

type ScanRecord = {
  id: string;
  createdAt: { seconds: number } | null;
  input: string;
  type: "URL" | "FILE";
  verdict: "SAFE" | "MALICIOUS";
};

function formatDate(timestamp: { seconds: number } | null) {
  if (!timestamp) return "—";
  const d = new Date(timestamp.seconds * 1000);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeBadge({ type }: { type: "URL" | "FILE" }) {
  const bg = type === "URL" ? "#58a6ff" : "#a371f7";
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: bg, color: "#0d1117" }}
    >
      {type}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: "SAFE" | "MALICIOUS" }) {
  const bg = verdict === "SAFE" ? "#3fb950" : "#f85149";
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: bg, color: "#0d1117" }}
    >
      {verdict}
    </span>
  );
}

function HistoryPage() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoggedIn(true);
        try {
          const data = await getUserScans(user.uid);
          setScans(data as ScanRecord[]);
        } catch (err) {
          console.error("Failed to load scan history:", err);
        }
      } else {
        setLoggedIn(false);
        setScans([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <p style={{ color: "#8b949e" }}>Loading history...</p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <p className="text-lg text-white mb-4">
            You need to be logged in to view scan history.
          </p>
          <button
            onClick={() => navigate({ to: "/auth", state: { tab: "login" } as never })}
            className="rounded-md px-6 py-3 font-medium transition-colors hover:bg-[#79b8ff]"
            style={{ backgroundColor: "#58a6ff", color: "#0d1117" }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = scans.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Scan History
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#8b949e" }}>
            All your previous scans
          </p>

          <div
            className="mt-6 rounded-xl border bg-card"
            style={{ borderColor: "#30363d" }}
          >
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <FileSearch className="h-12 w-12" style={{ color: "#8b949e" }} />
                <p className="mt-4 text-base" style={{ color: "#8b949e" }}>
                  No scans yet. Start by scanning a URL or file.
                </p>
                <button
                  onClick={() => navigate({ to: "/" })}
                  className="mt-6 rounded-md px-5 py-2.5 font-medium transition-colors hover:brightness-110"
                  style={{ backgroundColor: "#58a6ff", color: "#0d1117" }}
                >
                  Scan Now
                </button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "#30363d" }}>
                        <th className="px-5 py-3 font-medium" style={{ color: "#8b949e" }}>Date</th>
                        <th className="px-5 py-3 font-medium" style={{ color: "#8b949e" }}>Input</th>
                        <th className="px-5 py-3 font-medium" style={{ color: "#8b949e" }}>Type</th>
                        <th className="px-5 py-3 font-medium" style={{ color: "#8b949e" }}>Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scans.map((s, i) => (
                        <tr
                          key={s.id}
                          className={i !== scans.length - 1 ? "border-b" : ""}
                          style={{ borderColor: "#30363d" }}
                        >
                          <td className="whitespace-nowrap px-5 py-4" style={{ color: "#8b949e" }}>
                            {formatDate(s.createdAt)}
                          </td>
                          <td className="max-w-[320px] px-5 py-4 text-white">
                            <span className="block truncate">{s.input}</span>
                          </td>
                          <td className="px-5 py-4">
                            <TypeBadge type={s.type} />
                          </td>
                          <td className="px-5 py-4">
                            <VerdictBadge verdict={s.verdict} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile stacked cards */}
                <div className="divide-y md:hidden" style={{ borderColor: "#30363d" }}>
                  {scans.map((s) => (
                    <div key={s.id} className="space-y-2 p-4">
                      <div className="text-xs" style={{ color: "#8b949e" }}>
                        {formatDate(s.createdAt)}
                      </div>
                      <div className="truncate font-medium text-white">
                        {s.input}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <TypeBadge type={s.type} />
                        <VerdictBadge verdict={s.verdict} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}