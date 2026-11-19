import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Shield, Globe, Zap, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { auth, saveScanResult } from "../lib/firebase";

// const BACKEND_URL = "http://127.0.0.1:5000";

const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 3000;          // ask the backend for progress every 3 seconds
const MAX_WAIT_MS = 6 * 60 * 1000;      // give up after 6 minutes

// An error whose message is safe to show directly to the user
class ScanError extends Error {}

// Poll the backend until the background scan finishes
async function pollScan(scanId: string) {
  const started = Date.now();
  let failures = 0;

  while (Date.now() - started < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    let res: Response;
    try {
      res = await fetch(`${API_URL}/scan/status/${scanId}`);
    } catch {
      // tolerate brief network blips; give up after 5 failures in a row
      failures += 1;
      if (failures >= 5) {
        throw new ScanError("Lost connection to the scanner. Please try again.");
      }
      continue;
    }
    failures = 0;

    if (res.status === 404) {
      throw new ScanError("Scan expired or the server restarted. Please try again.");
    }

    const data = await res.json();
    if (data.status === "done") return data.result;
    if (data.status === "error") {
      throw new ScanError(data.error || "Scan failed. Please try again.");
    }
    // status === "processing" -> keep waiting
  }

  throw new ScanError("The scan is taking too long. Please try again.");
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ThreatScan — Scan. Detect. Protect." },
      { name: "description", content: "Submit suspicious URLs and files for instant malware threat analysis report." },
      { property: "og:title", content: "ThreatScan — Scan. Detect. Protect." },
      { property: "og:description", content: "Submit suspicious URLs and files for instant AI-powered malware threat analysis." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"url" | "file">("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleScan = async () => {
    setError("");

    if (tab === "url" && !url.trim()) {
      setError("Please enter a URL to scan.");
      return;
    }
    if (tab === "file" && !file) {
      setError("Please select a file to scan.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: start the scan. The backend replies immediately with a scan_id.
      let start;

      if (tab === "url") {
        const response = await fetch(`${API_URL}/scan/url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        start = await response.json();
      } else {
        const formData = new FormData();
        formData.append("file", file!);
        const response = await fetch(`${API_URL}/scan/file`, {
          method: "POST",
          body: formData,
        });
        start = await response.json();
      }

      if (start.error) {
        setError(start.error);
        return; // the finally block turns the loading state off
      }

      // Step 2: wait for the background scan to finish and get the report.
      const result = await pollScan(start.scan_id);

      // Save to Firestore if user is logged in
      const user = auth.currentUser;
      if (user) {
        await saveScanResult(
          user.uid,
          tab === "url" ? url.trim() : file!.name,
          tab === "url" ? "URL" : "FILE",
          result.verdict,
          result
        );
      }

      // Navigate to results page with data
      navigate({
        to: "/results",
        state: {
          result,
          input: tab === "url" ? url.trim() : file!.name,
          type: tab === "url" ? "URL" : "FILE",
        } as never,
      });

    } catch (err) {
      setError(
        err instanceof ScanError
          ? err.message
          : "Failed to connect to scanner. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Scan. Detect. Protect.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg" style={{ color: "#8b949e" }}>
          Submit suspicious URLs and files for instant malware threat analysis
        </p>
      </section>

      {/* Scan card */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6">
        <div
          className="rounded-xl border border-border bg-card p-5 sm:p-8"
          style={{ boxShadow: "0 0 60px -20px rgba(88, 166, 255, 0.25)" }}
        >
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => { setTab("url"); setError(""); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                tab === "url"
                  ? "border-b-2 border-[#58a6ff] text-[#58a6ff]"
                  : "border-b-2 border-transparent text-[#8b949e] hover:text-foreground"
              }`}
            >
              <LinkIcon size={16} />
              URL
            </button>
            <button
              onClick={() => { setTab("file"); setError(""); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                tab === "file"
                  ? "border-b-2 border-[#58a6ff] text-[#58a6ff]"
                  : "border-b-2 border-transparent text-[#8b949e] hover:text-foreground"
              }`}
            >
              <Upload size={16} />
              FILE
            </button>
          </div>

          {/* Tab content */}
          <div className="pt-6">
            {tab === "url" ? (
              <div className="space-y-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter a URL to scan (e.g. https://example.com)"
                  className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-4 py-3 text-foreground placeholder:text-[#6e7681] focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
                />
                {error && <p className="text-sm text-[#f85149]">{error}</p>}
                {loading && (
                  <p className="text-sm" style={{ color: "#8b949e" }}>
                    Analysing with multiple security engines. This can take up to a minute, please keep this page open.
                  </p>
                )}
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="w-full rounded-md bg-[#58a6ff] px-4 py-3 font-medium text-[#0d1117] transition-colors hover:bg-[#79b8ff] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Scanning...
                    </>
                  ) : "Scan"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
                    dragOver ? "border-[#58a6ff] bg-[#58a6ff]/5" : "border-[#30363d] hover:border-[#58a6ff]/60"
                  }`}
                >
                  <Upload size={40} className="mb-3" style={{ color: "#8b949e" }} />
                  <p className="text-sm text-foreground">
                    {file ? file.name : "Drag and drop a file here or click to browse"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                
                {error && <p className="text-sm text-[#f85149]">{error}</p>}
                {loading && (
                  <p className="text-sm" style={{ color: "#8b949e" }}>
                    Analysing with multiple security engines. This can take up to a minute, please keep this page open.
                  </p>
                )}
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="w-full rounded-md bg-[#58a6ff] px-4 py-3 font-medium text-[#0d1117] transition-colors hover:bg-[#79b8ff] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Scanning...
                    </>
                  ) : "Scan"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

   
    </div>
  );
}