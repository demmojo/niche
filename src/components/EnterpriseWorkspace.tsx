import React, { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Clock,
  Activity,
  Search,
  Database,
  AlertTriangle,
  Play,
} from "lucide-react";
import { useAuth } from "./AuthProvider";

interface Report {
  id: string;
  title: string;
  status: "pending" | "gathering_data" | "analyzing" | "completed" | "failed";
  progress: number;
  requestedAt: Date;
  completedAt?: Date;
  target: string;
}

export function EnterpriseWorkspace({ isSuperadmin }: any) {
  const { user } = useAuth();
  const [reportRequest, setReportRequest] = useState("");
  const [reports, setReports] = useState<Report[]>([
    {
      id: "demo-1",
      title: "Developer Tools: Next-Gen CI/CD",
      status: "completed",
      progress: 100,
      requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      target: "Developer Tools",
    },
    {
      id: "demo-2",
      title: "Headless CMS Saturation Analysis",
      status: "completed",
      progress: 100,
      requestedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      target: "Headless CMS",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Polling simulation for pending reports
  useEffect(() => {
    const hasPending = reports.some(
      (r) => r.status !== "completed" && r.status !== "failed",
    );
    if (!hasPending) return;

    const interval = setInterval(() => {
      setReports((prev) =>
        prev.map((r) => {
          if (r.status === "completed" || r.status === "failed") return r;

          let nextProgress = r.progress + Math.floor(Math.random() * 15);
          let nextStatus: Report["status"] = r.status;

          if (nextProgress >= 100) {
            nextProgress = 100;
            nextStatus = "completed";
          } else if (nextProgress > 60) {
            nextStatus = "analyzing";
          } else if (nextProgress > 20) {
            nextStatus = "gathering_data";
          }

          return {
            ...r,
            progress: nextProgress,
            status: nextStatus,
            completedAt: nextProgress === 100 ? new Date() : undefined,
          };
        }),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [reports]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportRequest.trim()) return;

    setIsSubmitting(true);

    try {
      // Simulate API latency for Cloud Task dispatch
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newReport: Report = {
        id: crypto.randomUUID(),
        title: `${reportRequest} - Initial Assessment`,
        target: reportRequest,
        status: "pending",
        progress: 0,
        requestedAt: new Date(),
      };

      setReports((prev) => [newReport, ...prev]);
      setReportRequest("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "gathering_data":
        return <Database className="w-5 h-5 text-blue-500 animate-pulse" />;
      case "analyzing":
        return <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />;
      case "completed":
        return <FileText className="w-5 h-5 text-emerald-600" />;
      case "failed":
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    }
  };

  const getStatusBadge = (report: Report) => {
    if (report.status === "completed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Ready
        </span>
      );
    }
    if (report.status === "failed") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
          Failed
        </span>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
          {report.status.replace("_", " ")}
        </span>
        <span className="text-xs font-bold text-ink-dark/60">
          {report.progress}%
        </span>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#F5F3ED] flex flex-col p-6 lg:p-10 overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-10">
        {/* Header Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-ink-dark/10 shadow-sm">
            <h3 className="text-sm font-bold text-ink-dark/60 uppercase tracking-wider mb-2">
              Active Intelligence Operations
            </h3>
            <p className="text-3xl font-serif font-bold text-ink-dark">
              {
                reports.filter(
                  (r) => r.status !== "completed" && r.status !== "failed",
                ).length
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-ink-dark/10 shadow-sm">
            <h3 className="text-sm font-bold text-ink-dark/60 uppercase tracking-wider mb-2">
              Completed Reports
            </h3>
            <p className="text-3xl font-serif font-bold text-ink-dark">
              {reports.filter((r) => r.status === "completed").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-ink-dark/10 shadow-sm">
            <h3 className="text-sm font-bold text-ink-dark/60 uppercase tracking-wider mb-2">
              Data Points Scanned
            </h3>
            <p className="text-3xl font-serif font-bold text-ink-dark">1.2M+</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-ink-dark/10">
              <h2 className="text-xl font-bold text-ink-dark mb-4">
                Launch Intelligence Gather
              </h2>
              <p className="text-sm text-ink-dark/70 mb-6">
                Deploy an autonomous market research agent to aggregate
                competitor data, pricing models, and GTM shifts.
              </p>

              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-ink-dark mb-2">
                    Target Niche or Competitor
                  </label>
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-dark/40" />
                    <input
                      type="text"
                      value={reportRequest}
                      onChange={(e) => setReportRequest(e.target.value)}
                      placeholder="e.g. Enterprise HR Software"
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-ink-dark/20 focus:border-ink-dark focus:ring-1 focus:ring-ink-dark outline-none disabled:opacity-50 disabled:bg-gray-50"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!reportRequest.trim() || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-ink-dark text-white rounded-lg font-bold hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Activity className="w-5 h-5 animate-pulse" /> Dispatching
                      Agent...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Play className="w-5 h-5 fill-current" /> Execute Sweep
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Historical & Active Reports Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-ink-dark/10 overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="p-6 border-b border-ink-dark/10 bg-gray-50/50">
                <h2 className="text-xl font-bold text-ink-dark">
                  Intelligence Feed
                </h2>
              </div>

              <div className="divide-y divide-ink-dark/5 overflow-y-auto flex-1">
                {reports.length === 0 ? (
                  <div className="p-10 text-center text-ink-dark/50">
                    No intelligence operations found.
                  </div>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-6 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 min-w-0">
                          <div
                            className={`p-3 rounded-lg shrink-0 ${
                              report.status === "completed"
                                ? "bg-emerald-50"
                                : report.status === "failed"
                                  ? "bg-rose-50"
                                  : "bg-blue-50"
                            }`}
                          >
                            {getStatusIcon(report.status)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-ink-dark truncate pr-4">
                              {report.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5 text-sm text-ink-dark/60">
                              <span>
                                {report.requestedAt.toLocaleDateString()}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-ink-dark/20"></span>
                              <span className="truncate">
                                Target: {report.target}
                              </span>
                            </div>

                            {report.status !== "completed" &&
                              report.status !== "failed" && (
                                <div className="mt-4 max-w-md">
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                                      style={{ width: `${report.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          {getStatusBadge(report)}

                          {report.status === "completed" && (
                            <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-ink-dark border border-ink-dark/20 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95">
                              <Download className="w-4 h-4" /> Download Brief
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
