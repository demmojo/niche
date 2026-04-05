import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { fetchWithAppCheck } from "../utils/fetchWithAppCheck";
import { Loader2, CheckCircle2, ChevronDown, Lock } from "lucide-react";
import { useAuth } from "./AuthProvider";

function StepLoading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 py-4 px-4 text-ink-dark/50 animate-pulse">
      <div className="w-5 h-5 rounded-full bg-ink-dark/20 flex-shrink-0" />
      <div className="h-4 bg-ink-dark/20 rounded w-1/2" />
      <span className="sr-only">{title}</span>
    </div>
  );
}

export function TrustBuilderScreen({
  ideaPayload,
  onComplete,
}: {
  ideaPayload: any;
  onComplete: (data: any) => void;
}) {
  const [data, setData] = useState<{
    competitors: number | null;
    competitorList: any[] | null;
    jtbdAnalysis: any | null;
    gapAnalysis: any[] | null;
    tarpitScore: any | null;
    finalStrategy: any | null;
    marketRadar: any | null;
  }>(() => {
    try {
      const cached = sessionStorage.getItem("plg_cached_data");
      const cachedIdea = sessionStorage.getItem("plg_cached_idea");
      if (cached && cachedIdea && cachedIdea === JSON.stringify(ideaPayload)) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return {
      competitors: null,
      competitorList: null,
      jtbdAnalysis: null,
      gapAnalysis: null,
      tarpitScore: null,
      finalStrategy: null,
      marketRadar: null,
    };
  });

  const [activeItems, setActiveItems] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [finalData, setFinalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPqlGated, setIsPqlGated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamValidation = async (abortController: AbortController) => {
    abortControllerRef.current = abortController;
    try {
      const response = await fetchWithAppCheck("/api/scoring/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(ideaPayload),
        signal: abortController.signal,
      });

      if (!response.ok) {
        let errorMsg = `Server returned ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) errorMsg = errorData.error;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // Keep the incomplete chunk in the buffer

        for (const chunk of parts) {
          if (chunk.trim() === "") continue;
          try {
            const parsed = JSON.parse(chunk.replace("data: ", ""));

            if (parsed.type === "competitor_count") {
              setData((prev) => ({ ...prev, competitors: parsed.value }));
              setActiveItems((prev) =>
                Array.from(new Set([...prev, "competitors"])),
              );
            }
            if (parsed.type === "competitor_list") {
              setData((prev) => ({ ...prev, competitorList: parsed.value }));
            }
            if (parsed.type === "jtbd_analysis") {
              setData((prev) => ({ ...prev, jtbdAnalysis: parsed.value }));
              setActiveItems((prev) =>
                Array.from(new Set([...prev, "jtbdAnalysis"])),
              );
            }
            if (parsed.type === "gap_analysis") {
              setData((prev) => ({ ...prev, gapAnalysis: parsed.value }));
              setActiveItems((prev) =>
                Array.from(new Set([...prev, "gapAnalysis"])),
              );
            }
            if (parsed.type === "market_radar") {
              setData((prev) => ({ ...prev, marketRadar: parsed.value }));
              setActiveItems((prev) =>
                Array.from(new Set([...prev, "marketRadar"])),
              );
            }
            if (parsed.type === "pql_gate") {
              setIsPqlGated(true);
              return; // Halt parsing and let the stream close naturally
            }
            if (parsed.type === "tarpit_score") {
              setData((prev) => ({ ...prev, tarpitScore: parsed.value }));
              setActiveItems((prev) =>
                Array.from(new Set([...prev, "tarpitScore"])),
              );
            }
            if (parsed.type === "final") {
              setData((prev) => ({ ...prev, finalStrategy: parsed.value }));
              setActiveItems((prev) =>
                Array.from(new Set([...prev, "finalStrategy"])),
              );

              setIsComplete(true);
              setFinalData(parsed.value);
            }
            if (parsed.type === "final_radar") {
              setIsComplete(true);
              setFinalData(parsed.value);
            }
            if (parsed.type === "error") {
              setError(parsed.value);
              return;
            }
          } catch (e: any) {
            console.error("Parse error on chunk", chunk, e);
            // Safe SSE handling
            setError(e.message || "Failed to parse stream.");
            return;
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    streamValidation(abortController);
    return () => abortController.abort();
  }, [ideaPayload]);

  const handleLoginToUnlock = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    sessionStorage.setItem("plg_cached_data", JSON.stringify(data));
    sessionStorage.setItem("plg_cached_idea", JSON.stringify(ideaPayload));

    setIsLoggingIn(true);
    try {
      await login();

      // Give Firebase Auth a moment to propagate the token claims to the backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsPqlGated(false);

      const resumeController = new AbortController();
      streamValidation(resumeController);

      return () => resumeController.abort();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
      setIsLoggingIn(false);
    }
  };

  const isPathB = ideaPayload?.productName === "Competitor Analysis";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED] px-4 py-12"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-ink-dark/10">
        <h2 className="text-2xl font-serif font-bold text-ink-dark mb-6 text-center">
          {isComplete ? "Analysis Complete" : "Evaluating Market Viability..."}
        </h2>

        {error ? (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-2xl border border-red-200">
            <h3 className="text-xl font-bold text-red-700 mb-2">
              Evaluation Failed
            </h3>
            <p className="text-red-600 text-center mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <Accordion.Root
            type="multiple"
            value={activeItems}
            onValueChange={setActiveItems}
            className="space-y-4"
          >
            {/* Competitors Step */}
            {data.competitors === null ? (
              <StepLoading title="Scanning market for competitors..." />
            ) : (
              <CompetitorStep
                count={data.competitors}
                list={data.competitorList}
                setList={(newList) =>
                  setData((prev) => ({ ...prev, competitorList: newList }))
                }
              />
            )}

            {!isPathB && (
              <>
                {/* JTBD Analysis Step */}
                {data.jtbdAnalysis === null ? (
                  <StepLoading title="Analyzing Customer Jobs (JTBD)..." />
                ) : (
                  <JTBDStep data={data.jtbdAnalysis} />
                )}

                {/* Gap Analysis Step */}
                {data.gapAnalysis === null ? (
                  <StepLoading title="Quantifying Market Gaps..." />
                ) : (
                  <GapAnalysisStep data={data.gapAnalysis} />
                )}
              </>
            )}

            {isPathB && (
              <>
                {/* Market Radar Step */}
                {data.marketRadar === null ? (
                  isPqlGated ? (
                    <PqlGate
                      isLoggingIn={isLoggingIn}
                      handleLoginToUnlock={handleLoginToUnlock}
                    />
                  ) : (
                    <StepLoading title="Synthesizing Market Radar..." />
                  )
                ) : (
                  <MarketRadarStep data={data.marketRadar} />
                )}
              </>
            )}

            {!isPathB && (
              <>
                {/* Tarpit Score Step */}
                {data.tarpitScore === null ? (
                  isPqlGated ? (
                    <PqlGate
                      isLoggingIn={isLoggingIn}
                      handleLoginToUnlock={handleLoginToUnlock}
                    />
                  ) : (
                    <StepLoading title="Analyzing tarpit risk..." />
                  )
                ) : (
                  <TarpitStep data={data.tarpitScore} />
                )}

                {/* Final Strategy Step */}
                {data.finalStrategy === null ? (
                  !isPqlGated && (
                    <StepLoading title="Synthesizing final strategy..." />
                  )
                ) : (
                  <FinalStrategyStep data={data.finalStrategy} />
                )}
              </>
            )}
          </Accordion.Root>
        )}

        {isComplete && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <button
              onClick={() =>
                onComplete({
                  ...finalData,
                  curatedCompetitors: data.competitorList,
                })
              }
              className="px-8 py-4 bg-ink-dark text-white rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg"
            >
              View Validated Idea
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PqlGate({
  isLoggingIn,
  handleLoginToUnlock,
}: {
  isLoggingIn: boolean;
  handleLoginToUnlock: () => void;
}) {
  return (
    <Accordion.Item value="pqlGate" asChild>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col items-center justify-center p-8 bg-amber-50 rounded-xl border border-amber-200 mt-6 shadow-sm overflow-hidden"
      >
        <div className="absolute inset-0 z-0 opacity-40 blur-[8px] pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 rounded-full border-[24px] border-amber-500/20" />
          <div className="absolute w-32 h-32 rounded-full border-[12px] border-amber-500/40" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Lock className="w-8 h-8 text-amber-600 mb-4" />
          <h3 className="text-xl font-bold text-amber-900 mb-2 text-center">
            Sign up to unlock full analysis
          </h3>
          <p className="text-amber-700 text-center mb-6 text-sm max-w-sm">
            Great start. We've identified key market dynamics. 🔒 Your idea and
            market data are safely cached. Sign up to save this research and
            unlock the rest.
          </p>
          <button
            onClick={handleLoginToUnlock}
            disabled={isLoggingIn}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
            Unlock Analysis
          </button>
        </div>
      </motion.div>
    </Accordion.Item>
  );
}

function CompetitorStep({
  count,
  list,
  setList,
}: {
  count: number;
  list?: any[];
  setList?: (list: any[]) => void;
}) {
  const setThreatLevel = (index: number, level: string) => {
    if (!list || !setList) return;
    const newList = [...list];
    newList[index] = { ...newList[index], threatLevel: level };
    setList(newList);
  };

  return (
    <Accordion.Item value="competitors" asChild>
      <motion.div
        layout
        className="border border-ink-dark/10 rounded-xl overflow-hidden bg-gray-50/50"
      >
        <Accordion.Header>
          <Accordion.Trigger className="flex items-center w-full gap-4 py-4 px-4 text-left focus:outline-none">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-base font-medium text-ink-dark flex-grow">
              Market Analysis Complete
            </span>
            <ChevronDown
              className="w-5 h-5 text-ink-dark/50 transition-transform duration-200"
              aria-hidden
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="px-4 pb-4 pt-0 text-ink-dark/80 text-sm animate-radix-accordion-down">
          <p className="mb-4">
            Found {count} existing solutions in this space.
          </p>

          {list && list.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-xs font-bold text-ink-dark uppercase tracking-wider mb-2">
                Refine Proprietary Threat Model
              </p>
              {list.map((comp, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-ink-dark/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-dark truncate">
                      {comp.name}
                    </p>
                    <a
                      href={comp.domain}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-sky hover:underline truncate block"
                    >
                      {comp.domain.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {["Low", "Medium", "High"].map((level) => (
                      <button
                        key={level}
                        onClick={(e) => {
                          e.stopPropagation();
                          setThreatLevel(idx, level);
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-colors border uppercase tracking-wider ${
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
              ))}
            </div>
          )}
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function TarpitStep({ data }: { data: any }) {
  return (
    <Accordion.Item value="tarpitScore" asChild>
      <motion.div
        layout
        className="border border-ink-dark/10 rounded-xl overflow-hidden bg-gray-50/50"
      >
        <Accordion.Header>
          <Accordion.Trigger className="flex items-center w-full gap-4 py-4 px-4 text-left focus:outline-none">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-base font-medium text-ink-dark flex-grow">
              Tarpit Risk Evaluated
            </span>
            <ChevronDown
              className="w-5 h-5 text-ink-dark/50 transition-transform duration-200"
              aria-hidden
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="px-4 pb-4 pt-0 text-ink-dark/80 text-sm animate-radix-accordion-down">
          Tarpit Risk Score: {Math.round(data.score)}.
          {data.isTarpit
            ? " High risk of entering a saturated market."
            : " Low risk. This is a defensible niche."}
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function JTBDStep({ data }: { data: any }) {
  return (
    <Accordion.Item value="jtbdAnalysis" asChild>
      <motion.div
        layout
        className="border border-ink-dark/10 rounded-xl overflow-hidden bg-gray-50/50"
      >
        <Accordion.Header>
          <Accordion.Trigger className="flex items-center w-full gap-4 py-4 px-4 text-left focus:outline-none">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-base font-medium text-ink-dark flex-grow">
              Customer Jobs Analyzed
            </span>
            <ChevronDown
              className="w-5 h-5 text-ink-dark/50 transition-transform duration-200"
              aria-hidden
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="px-4 pb-4 pt-0 text-ink-dark/80 text-sm animate-radix-accordion-down">
          <p className="mb-2">
            <strong>Core Job:</strong> {data.job}
          </p>
          <p>
            <strong>Opportunity Score:</strong>{" "}
            {Math.round(data.opportunityScore)} / 20
          </p>
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function GapAnalysisStep({ data }: { data: any[] }) {
  return (
    <Accordion.Item value="gapAnalysis" asChild>
      <motion.div
        layout
        className="border border-ink-dark/10 rounded-xl overflow-hidden bg-gray-50/50"
      >
        <Accordion.Header>
          <Accordion.Trigger className="flex items-center w-full gap-4 py-4 px-4 text-left focus:outline-none">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-base font-medium text-ink-dark flex-grow">
              Market Gaps Quantified
            </span>
            <ChevronDown
              className="w-5 h-5 text-ink-dark/50 transition-transform duration-200"
              aria-hidden
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="px-4 pb-4 pt-0 text-ink-dark/80 text-sm animate-radix-accordion-down">
          <ul className="list-disc pl-5 space-y-1">
            {data.map((gap, i) => (
              <li key={i}>
                <strong>{gap.feature}:</strong> {gap.competitor_deficit}
              </li>
            ))}
          </ul>
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function MarketRadarStep({ data }: { data: any }) {
  return (
    <Accordion.Item value="marketRadar" asChild>
      <motion.div
        layout
        className="border border-ink-dark/10 rounded-xl overflow-hidden bg-gray-50/50"
      >
        <Accordion.Header>
          <Accordion.Trigger className="flex items-center w-full gap-4 py-4 px-4 text-left focus:outline-none">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-base font-medium text-ink-dark flex-grow">
              Market Radar Extracted
            </span>
            <ChevronDown
              className="w-5 h-5 text-ink-dark/50 transition-transform duration-200"
              aria-hidden
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="px-4 pb-4 pt-0 text-ink-dark/80 text-sm animate-radix-accordion-down">
          <p className="mb-2">
            <strong>Market Velocity:</strong> {data.market_velocity}
          </p>
          <p className="mb-1">
            <strong>Dominant Players:</strong>{" "}
            {data.dominant_players?.join(", ")}
          </p>
          <p className="mb-1">
            <strong>Emerging Threats:</strong>{" "}
            {data.emerging_threats?.join(", ")}
          </p>
          <p className="mb-1">
            <strong>Table Stakes Features:</strong>{" "}
            {data.key_feature_table_stakes?.join(", ")}
          </p>
          <p className="mb-2">
            <strong>Differentiation Vectors:</strong>{" "}
            {data.differentiation_vectors?.join(", ")}
          </p>

          {data.exact_quote && (
            <div className="bg-white p-3 rounded border border-ink-dark/10 mt-2 text-xs">
              <strong>Key Quote:</strong> "{data.exact_quote}"
            </div>
          )}
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function FinalStrategyStep({ data }: { data: any }) {
  return (
    <Accordion.Item value="finalStrategy" asChild>
      <motion.div
        layout
        className="border border-ink-dark/10 rounded-xl overflow-hidden bg-gray-50/50"
      >
        <Accordion.Header>
          <Accordion.Trigger className="flex items-center w-full gap-4 py-4 px-4 text-left focus:outline-none">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-base font-medium text-ink-dark flex-grow">
              Strategy Synthesized
            </span>
            <ChevronDown
              className="w-5 h-5 text-ink-dark/50 transition-transform duration-200"
              aria-hidden
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="px-4 pb-4 pt-0 text-ink-dark/80 text-sm animate-radix-accordion-down">
          <p className="mb-2">{data.reasoning}</p>
          <div className="bg-white p-3 rounded border border-ink-dark/10 mt-2 text-xs">
            <strong>Key Quote:</strong> "{data.exact_quote}"
          </div>
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}
