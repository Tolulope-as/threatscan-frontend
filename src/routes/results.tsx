import { createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Scan Results — ThreatScan" },
      { name: "description", content: "View detailed malware threat analysis results from ThreatScan." },
      { property: "og:title", content: "Scan Results — ThreatScan" },
      { property: "og:description", content: "View detailed malware threat analysis results from ThreatScan." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const rawState = (location.state as unknown as Record<string, unknown> | null) ?? null;

  const state = rawState ? {
    result: rawState.result as {
      verdict: "SAFE" | "MALICIOUS";
      risk_level: "Low" | "Medium" | "High";
      ml_result: { verdict: string; confidence: number } | null;
      engine_result: {
        malicious_count: number;
        suspicious_count: number;
        harmless_count: number;
        undetected_count: number;
        total_engines: number;
        flagged: boolean;
        flagged_engines: { engine: string; category: string; threat: string }[];
      };
      threat_category: string;
      recommendation: string;
    },
    input: rawState.input as string,
    type: rawState.type as "URL" | "FILE",
  } : null;

  if (!state || !state.result) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <p className="text-lg text-white mb-4">No scan results found.</p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="rounded-md bg-[#58a6ff] px-6 py-3 font-medium text-[#0d1117] hover:bg-[#79b8ff]"
          >
            Start a Scan
          </button>
        </div>
      </div>
    );
  }

  const { result, input, type } = state;
  const isMalicious = result.verdict === "MALICIOUS";
  const verdictColor = isMalicious ? "#f85149" : "#3fb950";

  const enginePercent = result.engine_result.total_engines > 0
    ? Math.round((result.engine_result.malicious_count / result.engine_result.total_engines) * 100)
    : 0;

  const riskColors = {
    Low: "#3fb950",
    Medium: "#f0883e",
    High: "#f85149",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Scanned input */}
          <div>
            <p className="text-sm" style={{ color: "#8b949e" }}>
              Scanned Input ({type}):
            </p>
            <p className="mt-1 break-all text-lg font-medium text-white">
              {input}
            </p>
          </div>

          {/* Verdict banner */}
          <div
            className="rounded-lg px-6 py-5 text-center text-base font-semibold sm:text-xl"
            style={{ backgroundColor: verdictColor, color: "#0d1117" }}
          >
            {isMalicious ? "MALICIOUS — Threat Detected" : "SAFE — No Threats Detected"}
          </div>

          {/* Analysis cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* ML Model Analysis */}
            {result.ml_result ? (
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">ML Analysis</h2>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#8b949e" }}>Verdict</span>
                  <span className="font-medium" style={{ color: verdictColor }}>
                    {result.ml_result.verdict}
                  </span>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#8b949e" }}>Confidence</span>
                  <span className="font-medium" style={{ color: verdictColor }}>
                    {result.ml_result.confidence}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#30363d]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${result.ml_result.confidence}%`,
                      backgroundColor: verdictColor,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 flex items-center justify-center">
                <p className="text-sm" style={{ color: "#8b949e" }}>
                  ML analysis is only available for URL scans
                </p>
              </div>
            )}

            {/* Multi-Engine Analysis */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Multi-Engine Analysis</h2>
              <p className="mb-4 text-sm" style={{ color: "#8b949e" }}>
                {result.engine_result.malicious_count} / {result.engine_result.total_engines} engines flagged this as malicious
              </p>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm" style={{ color: "#8b949e" }}>Flagged</span>
                <span
                  className="font-medium"
                  style={{ color: result.engine_result.flagged ? "#f85149" : "#3fb950" }}
                >
                  {enginePercent}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#30363d]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${enginePercent}%`,
                    backgroundColor: result.engine_result.flagged ? "#f85149" : "#3fb950",
                  }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md px-3 py-2" style={{ backgroundColor: "#0d1117" }}>
                  <p style={{ color: "#8b949e" }}>Malicious</p>
                  <p className="font-medium" style={{ color: "#f85149" }}>
                    {result.engine_result.malicious_count}
                  </p>
                </div>
                <div className="rounded-md px-3 py-2" style={{ backgroundColor: "#0d1117" }}>
                  <p style={{ color: "#8b949e" }}>Suspicious</p>
                  <p className="font-medium" style={{ color: "#f0883e" }}>
                    {result.engine_result.suspicious_count}
                  </p>
                </div>
                <div className="rounded-md px-3 py-2" style={{ backgroundColor: "#0d1117" }}>
                  <p style={{ color: "#8b949e" }}>Harmless</p>
                  <p className="font-medium" style={{ color: "#3fb950" }}>
                    {result.engine_result.harmless_count}
                  </p>
                </div>
                <div className="rounded-md px-3 py-2" style={{ backgroundColor: "#0d1117" }}>
                  <p style={{ color: "#8b949e" }}>Undetected</p>
                  <p className="font-medium text-white">
                    {result.engine_result.undetected_count}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Threat Details */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Threat Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm" style={{ color: "#8b949e" }}>Scan Type</p>
                <p className="mt-1 font-medium text-white">{type}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: "#8b949e" }}>Threat Category</p>
                <p className="mt-1 font-medium text-white">{result.threat_category}</p>
              </div>
              <div>
                <p className="text-sm" style={{ color: "#8b949e" }}>Risk Level</p>
                <span
                  className="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium"
                  style={{
                    color: riskColors[result.risk_level],
                    backgroundColor: `color-mix(in srgb, ${riskColors[result.risk_level]} 12%, transparent)`,
                  }}
                >
                  {result.risk_level}
                </span>
              </div>
            </div>
          </div>

          {/* Flagged Engines */}
          {result.engine_result.flagged_engines && result.engine_result.flagged_engines.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Engines That Flagged This
              </h2>
              <div className="space-y-2">
                {result.engine_result.flagged_engines.map((e: {
                  engine: string;
                  category: string;
                  threat: string;
                }) => (
                  <div
                    key={e.engine}
                    className="flex items-center justify-between rounded-md px-4 py-2.5"
                    style={{ backgroundColor: "#0d1117", border: "1px solid #30363d" }}
                  >
                    <span className="text-sm font-medium text-white">{e.engine}</span>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs"
                        style={{ color: e.category === "malicious" ? "#f85149" : "#f0883e" }}
                      >
                        {e.threat}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: e.category === "malicious" ? "#f85149" : "#f0883e",
                          color: "#0d1117"
                        }}
                      >
                        {e.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {result.engine_result.flagged_engines.length === 10 && (
                <p className="mt-3 text-xs" style={{ color: "#8b949e" }}>
                  Showing top 10 flagged engines
                </p>
              )}
            </div>
          )}

          {/* Recommendation */}
          <div
            className="rounded-r-lg border-l-4 p-5 sm:p-6"
            style={{ backgroundColor: "#1c2d3f", borderLeftColor: "#58a6ff" }}
          >
            <h3 className="mb-2 font-semibold text-white">Recommendation</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#c9d1d9" }}>
              {result.recommendation}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex-1 rounded-md px-4 py-3 font-medium transition-colors hover:bg-[#79b8ff]"
              style={{ backgroundColor: "#58a6ff", color: "#0d1117" }}
            >
              Scan Another
            </button>
            <button
              onClick={() => navigate({ to: "/history" })}
              className="flex-1 rounded-md border px-4 py-3 font-medium transition-colors hover:bg-[#161b22]"
              style={{ borderColor: "#30363d", color: "#c9d1d9" }}
            >
              View History
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}