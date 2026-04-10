import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  AlertCircle,
  Pause,
  Play,
  ShieldAlert,
  Activity,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useAuth } from "../AuthProvider";

interface DataQualityMetrics {
  active_count: number;
  quarantine_count: number;
  daily_processed: number;
  quarantine_rate: number;
}

interface QuarantinedDomain {
  domain: string;
  timestamp: string | any;
  reasoning: string;
}

interface DataQualityData {
  metrics: DataQualityMetrics;
  recent_quarantined: QuarantinedDomain[];
}

export function DataMoatControlTab() {
  const { user } = useAuth();
  const [dataQuality, setDataQuality] = useState<DataQualityData | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.name === "playwright-test" ||
        window.location.search.includes("mock_auth=true"))
    ) {
      setLoading(false);
      return;
    }
    // Subscribe to admin_dashboards/data_quality
    const dqUnsubscribe = onSnapshot(
      doc(db, "admin_dashboards", "data_quality"),
      (docSnap) => {
        if (docSnap.exists()) {
          setDataQuality(docSnap.data() as DataQualityData);
        }
      },
      (err) => {
        console.error("Error fetching data quality metrics:", err);
      },
    );

    // Subscribe to config/pipeline_state
    const pipelineUnsubscribe = onSnapshot(
      doc(db, "config", "pipeline_state"),
      (docSnap) => {
        if (docSnap.exists()) {
          setIsPaused(docSnap.data().is_paused || false);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching pipeline state:", err);
        setLoading(false);
      },
    );

    return () => {
      dqUnsubscribe();
      pipelineUnsubscribe();
    };
  }, []);

  const handleTogglePause = async () => {
    if (!user) return;
    setToggling(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "") +
          "/api/superadmin/pipeline/toggle-pause",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_paused: !isPaused }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to toggle pipeline state");
      }

      // We don't need to manually set state here because onSnapshot will handle it.
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dark/40" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const metrics = dataQuality?.metrics;
  const estimatedSpend = metrics ? metrics.daily_processed * 0.0001 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-paper-light border border-ink-dark/10 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold font-serif text-ink-dark flex items-center gap-2">
            Pipeline Circuit Breaker
          </h2>
          <p className="text-ink-dark/60 text-sm mt-1">
            Halt the Data Moat pipeline to prevent runaway costs or data
            corruption.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <button
            onClick={handleTogglePause}
            disabled={toggling}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors disabled:opacity-50 ${
              isPaused
                ? "bg-accent-teal text-paper-base hover:bg-accent-teal/90"
                : "bg-accent-coral text-paper-base hover:bg-accent-coral/90"
            }`}
          >
            {toggling ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPaused ? (
              <Play className="w-5 h-5" />
            ) : (
              <Pause className="w-5 h-5" />
            )}
            {isPaused ? "Resume Pipeline" : "Pause Pipeline"}
          </button>
          {error && <p className="text-accent-coral text-sm mt-2">{error}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-paper-light border border-ink-dark/10 p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-ink-dark/60">
            <Activity className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">
              Daily Processed
            </span>
          </div>
          <span className="text-3xl font-bold text-ink-dark">
            {metrics ? metrics.daily_processed.toLocaleString() : "0"}
          </span>
          <span className="text-sm text-ink-dark/40">
            Total domains processed today
          </span>
        </div>

        <div className="bg-paper-light border border-ink-dark/10 p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-ink-dark/60">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">
              Quarantine Rate
            </span>
          </div>
          <span className="text-3xl font-bold text-ink-dark">
            {metrics ? (metrics.quarantine_rate * 100).toFixed(2) : "0.00"}%
          </span>
          <span className="text-sm text-ink-dark/40">
            Of total processed records
          </span>
        </div>

        <div className="bg-paper-light border border-ink-dark/10 p-6 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-ink-dark/60">
            <DollarSign className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">
              Estimated Spend
            </span>
          </div>
          <span className="text-3xl font-bold text-ink-dark">
            {formatCurrency(estimatedSpend)}
          </span>
          <span className="text-sm text-ink-dark/40">
            Heuristic: $0.0001 per domain
          </span>
        </div>
      </div>

      <div className="bg-paper-light border border-ink-dark/10 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-ink-dark/10">
          <h3 className="text-lg font-bold font-serif text-ink-dark">
            Recent Quarantined Domains
          </h3>
          <p className="text-ink-dark/60 text-sm">
            Review LLM penalty reasoning for failing domains.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-dark/5 text-ink-dark/60">
              <tr>
                <th className="px-6 py-3 font-semibold">Domain</th>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold">Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-dark/10">
              {!dataQuality?.recent_quarantined ||
              dataQuality.recent_quarantined.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-ink-dark/50"
                  >
                    No recently quarantined domains.
                  </td>
                </tr>
              ) : (
                dataQuality.recent_quarantined.map((item, idx) => {
                  let formattedDate = "Unknown";
                  if (item.timestamp) {
                    // Try to format
                    try {
                      formattedDate = new Date(item.timestamp).toLocaleString();
                    } catch (e) {
                      formattedDate = String(item.timestamp);
                    }
                  }

                  return (
                    <tr
                      key={`${item.domain}-${idx}`}
                      className="hover:bg-ink-dark/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-ink-dark whitespace-nowrap">
                        {item.domain}
                      </td>
                      <td className="px-6 py-4 text-ink-dark/60 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 text-ink-dark/80">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-accent-coral mt-0.5 shrink-0" />
                          <span>{item.reasoning}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
