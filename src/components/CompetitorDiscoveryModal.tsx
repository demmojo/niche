import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Loader2,
  Info,
  ExternalLink,
  Sparkles,
  Target,
} from "lucide-react";
import { fetchWithAppCheck } from "../utils/fetchWithAppCheck";
import { useAuth } from "./AuthProvider";

export interface DiscoveredCompetitor {
  id?: string;
  name: string;
  domain: string;
  description: string;
  similarityScore: number;
  matchTier: "Direct" | "Adjacent" | "Legacy";
  matchRationale: string;
  selected?: boolean;
  threatLevel?: "Low" | "Medium" | "High"; // Endowment Effect: Proprietary Threat Model
  isManual?: boolean;
}

interface CompetitorDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseIdea: { name: string; description?: string };
  onConfirm: (selectedCompetitors: any[]) => void;
  addToast: (msg: string, type: string) => void;
}

export function CompetitorDiscoveryModal({
  isOpen,
  onClose,
  baseIdea,
  onConfirm,
  addToast,
}: CompetitorDiscoveryModalProps) {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [competitors, setCompetitors] = useState<DiscoveredCompetitor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState("");
  const { user } = useAuth();

  const baseIdeaName = baseIdea?.name;
  const baseIdeaDesc = baseIdea?.description;

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    const fetchCompetitors = async () => {
      setLoading(true);
      setAnalyzing(false);
      setError(null);
      try {
        const res = await fetchWithAppCheck(
          "/api/campaign/discover-competitors",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              baseIdea: { name: baseIdeaName, description: baseIdeaDesc },
            }),
            signal: controller.signal,
          },
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to discover competitors");
        }
        const data = await res.json();

        if (!data.competitors || data.competitors.length === 0) {
          setError("No competitors found for this niche. Try broader terms.");
          return;
        }

        const initialCompetitors = data.competitors.map((c: any) => ({
          ...c,
          selected: true,
          threatLevel: "Medium",
        }));
        setCompetitors(initialCompetitors);
        setLoading(false); // End of Phase 1

        // Phase 2: Fetch LLM Rationale
        setAnalyzing(true);
        const analyzeRes = await fetchWithAppCheck(
          "/api/campaign/analyze-competitors",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              baseIdea: { name: baseIdeaName, description: baseIdeaDesc },
              competitors: data.competitors,
            }),
            signal: controller.signal,
          },
        );

        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          setCompetitors((prev) =>
            prev.map((c) => {
              const analyzed = analyzeData.analyzed?.find(
                (a: any) => a.domain === c.domain,
              );
              if (analyzed) {
                return {
                  ...c,
                  matchTier: analyzed.matchTier,
                  matchRationale: analyzed.matchRationale,
                  similarityScore: analyzed.similarityScore,
                };
              }
              return c;
            }),
          );
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Discovery error:", err);
        if (loading) {
          // Only set error if phase 1 failed
          setError(err.message || "Failed to discover competitors.");
        }
      } finally {
        setLoading(false);
        setAnalyzing(false);
      }
    };

    fetchCompetitors();
    return () => controller.abort();
  }, [isOpen, baseIdeaName, baseIdeaDesc, user]);

  const toggleSelection = (index: number) => {
    setCompetitors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c)),
    );
  };

  const setThreatLevel = (index: number, level: "Low" | "Medium" | "High") => {
    setCompetitors((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, threatLevel: level, selected: true } : c,
      ),
    );
  };

  const handleAddCompetitor = () => {
    if (!newCompetitorUrl.trim()) return;

    let domain = newCompetitorUrl.trim();
    try {
      if (!domain.startsWith("http")) {
        domain = `https://${domain}`;
      }
      domain = new URL(domain).hostname;
    } catch (e) {
      // Fallback
    }

    if (competitors.some((c) => c.domain === domain)) {
      addToast("Competitor already in the list", "info");
      return;
    }

    const newComp: DiscoveredCompetitor = {
      name: domain,
      domain: domain,
      description: "Manually added competitor.",
      similarityScore: 0,
      matchTier: "Direct",
      matchRationale: "Added manually by user.",
      selected: true,
      threatLevel: "High",
      isManual: true,
    };

    setCompetitors((prev) => [...prev, newComp]);
    setNewCompetitorUrl("");
  };

  const handleConfirm = () => {
    const selected = competitors.filter((c) => c.selected);
    if (selected.length === 0) {
      addToast("Please select at least 1 competitor", "error");
      return;
    }
    onConfirm(
      selected.map(({ selected, ...rest }) => ({
        ...rest,
        id: crypto.randomUUID(), // ensure stable UI keys
      })),
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-ink-dark/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-paper-light border border-ink-dark/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 sm:px-8 sm:pt-8 pb-6 border-b border-ink-dark/10 bg-white">
          <div className="pr-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-sky/10 rounded-xl">
                <Target className="w-6 h-6 text-sky" />
              </div>
              <h2 className="text-2xl font-bold text-ink-dark tracking-tight">
                Discovered Competitors
              </h2>
            </div>
            <p className="text-ink-dark/60 leading-relaxed max-w-2xl">
              We scanned the web for{" "}
              <span className="font-semibold text-ink-dark">
                "{baseIdea.name}"
              </span>
              . Review and select the most relevant targets before running the
              deep analysis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-dark/40 hover:text-ink-dark hover:bg-ink-dark/5 p-2.5 rounded-full transition-all"
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-paper-base/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-ink-dark/50">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-sky/20 animate-pulse" />
                <Loader2 className="w-12 h-12 animate-spin relative text-sky" />
              </div>
              <p className="font-medium mt-6 text-lg animate-pulse text-ink-dark/70">
                Scanning market landscape...
              </p>
              <p className="text-sm mt-2 text-ink-dark/40">
                This usually takes about 10-15 seconds.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-ink-dark mb-2">
                Discovery Failed
              </h3>
              <p className="text-ink-dark/70 mb-8">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-ink-dark text-white rounded-xl font-medium hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                Enter Competitors Manually
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {competitors.map((comp, idx) => (
                <div
                  key={comp.domain || idx}
                  onClick={() => toggleSelection(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSelection(idx);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={comp.selected}
                  className={`group relative p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex gap-5 ${
                    comp.selected
                      ? "border-sky bg-sky/5 shadow-sm"
                      : "border-transparent bg-white hover:border-ink-dark/10 shadow-sm opacity-80 hover:opacity-100"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2`}
                >
                  <div className="pt-1 shrink-0">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        comp.selected
                          ? "border-sky bg-sky text-white shadow-sm"
                          : "border-ink-dark/20 bg-white group-hover:border-ink-dark/40"
                      }`}
                    >
                      {comp.selected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-ink-dark leading-tight truncate">
                            {comp.name}
                          </h3>
                          {comp.isManual && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompetitors((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                );
                              }}
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors"
                              aria-label="Remove competitor"
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                        <a
                          href={
                            comp.domain.startsWith("http")
                              ? comp.domain
                              : `https://${comp.domain}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 mt-1 text-sm text-sky/80 hover:text-sky font-medium hover:underline transition-colors"
                        >
                          {comp.domain.replace(/^https?:\/\/(www\.)?/, "")}
                          <ExternalLink size={12} className="opacity-70" />
                        </a>
                      </div>
                      <div className="shrink-0">
                        {comp.matchTier ? (
                          <span
                            className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ${
                              comp.matchTier === "Direct"
                                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                : comp.matchTier === "Adjacent"
                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  : "bg-sky/10 text-sky-600 border border-sky/20"
                            }`}
                          >
                            {comp.matchTier}
                          </span>
                        ) : analyzing ? (
                          <div className="h-6 w-16 bg-sky/20 animate-pulse rounded-lg"></div>
                        ) : null}
                      </div>
                    </div>

                    <p className="text-sm text-ink-dark/70 mb-4 line-clamp-3 leading-relaxed">
                      {comp.description}
                    </p>

                    <div
                      className={`rounded-xl p-3.5 text-sm transition-colors ${
                        comp.selected
                          ? "bg-white border border-sky/10 shadow-sm"
                          : "bg-paper-base border border-ink-dark/5"
                      }`}
                    >
                      <div className="flex gap-2 items-start">
                        <Sparkles
                          className={`w-4 h-4 shrink-0 mt-0.5 ${comp.selected ? "text-sky" : "text-ink-dark/40"}`}
                        />
                        <div className="flex-1">
                          <span
                            className={`font-bold block mb-0.5 ${comp.selected ? "text-ink-dark" : "text-ink-dark/70"}`}
                          >
                            Why it matches
                          </span>
                          {!comp.matchRationale && analyzing ? (
                            <div className="animate-pulse space-y-2 mt-2">
                              <div className="h-4 bg-sky/20 rounded w-3/4"></div>
                              <div className="h-4 bg-sky/20 rounded w-1/2"></div>
                            </div>
                          ) : (
                            <span className="text-ink-dark/70 leading-relaxed block">
                              {comp.matchRationale}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Proprietary Threat Model Curation */}
                      {comp.selected && !analyzing && (
                        <div
                          className="mt-4 pt-3 border-t border-ink-dark/5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-xs font-bold text-ink-dark mb-2 uppercase tracking-wider">
                            Set Threat Level
                          </p>
                          <div className="flex gap-2">
                            {["Low", "Medium", "High"].map((level) => (
                              <button
                                key={level}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setThreatLevel(idx, level as any);
                                }}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors border ${
                                  comp.threatLevel === level
                                    ? level === "High"
                                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                      : level === "Medium"
                                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-transparent text-ink-dark/40 border-ink-dark/10 hover:border-ink-dark/20"
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Missing one? Enter competitor URL..."
                    className="flex-1 bg-white border-2 border-ink-dark/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky/50 focus:ring-2 focus:ring-sky/20 transition-all"
                    value={newCompetitorUrl}
                    onChange={(e) => setNewCompetitorUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCompetitor();
                    }}
                  />
                  <button
                    onClick={handleAddCompetitor}
                    disabled={!newCompetitorUrl.trim()}
                    className="px-4 py-2.5 bg-ink-dark/5 text-ink-dark font-medium rounded-xl hover:bg-ink-dark/10 transition-all disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 sm:px-8 border-t border-ink-dark/10 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            {!loading &&
            !error &&
            competitors.filter((c) => c.selected).length === 0 ? (
              <div className="flex items-center gap-2.5 px-4 py-2 bg-rose-500/10 text-rose-600 rounded-xl animate-in fade-in slide-in-from-left-2">
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">
                  Select at least one to continue
                </p>
              </div>
            ) : !loading && !error ? (
              <p className="text-sm text-ink-dark/50 font-medium">
                {competitors.filter((c) => c.selected).length} competitor
                {competitors.filter((c) => c.selected).length !== 1
                  ? "s"
                  : ""}{" "}
                selected
              </p>
            ) : (
              <div />
            )}
          </div>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-ink-dark hover:bg-ink-dark/5 transition-all w-full sm:w-auto text-center"
            >
              Cancel & Manual Entry
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                loading ||
                analyzing ||
                !!error ||
                competitors.filter((c) => c.selected).length === 0
              }
              className="px-6 py-2.5 rounded-xl font-medium bg-ink-dark text-white hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95 w-full sm:w-auto text-center"
            >
              {analyzing ? "Analyzing Market..." : "Confirm & Run Analysis"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
