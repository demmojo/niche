import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { fetchWithAppCheck } from "../utils/fetchWithAppCheck";
import { Loader2, CheckCircle2, ChevronDown, Lock } from "lucide-react";
import { useAuth } from "./AuthProvider";
import {
  useAuthDialogDispatch,
  useAuthDialogState,
} from "./AuthDialogProvider";

import { parseSSEStream } from "../utils/sse";
import { Button } from "./ui/Button";
import {
  safeSessionStorageGet,
  safeSessionStorageSet,
  safeSessionStorageRemove,
} from "../utils/storage";
import { type IdeaPayload } from "./ZeroFrictionEntry";

function StepLoading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 py-4 px-4 text-ink-dark/50 animate-pulse">
      <div className="w-5 h-5 rounded-full bg-ink-dark/20 flex-shrink-0" />
      <div className="h-4 bg-ink-dark/20 rounded w-1/2" />
      <span className="sr-only">{title}</span>
    </div>
  );
}

export type MarketRadarData = {
  market_velocity?: string;
  dominant_players?: string[];
  emerging_threats?: string[];
  key_feature_table_stakes?: string[];
  differentiation_vectors?: string[];
  exact_quote?: string;
};

export type CompetitorData = {
  name: string;
  domain: string;
  threatLevel?: string;
};

export type TrustBuilderData = {
  competitors: number | null;
  competitorList: CompetitorData[] | null;
  jtbdAnalysis: { job: string; opportunityScore: number } | null;
  gapAnalysis: { feature: string; competitor_deficit: string }[] | null;
  tarpitScore: { score: number; isTarpit: boolean } | null;
  finalStrategy: { reasoning: string; exact_quote?: string } | null;
  marketRadar: MarketRadarData | null;
};

export function TrustBuilderScreen({
  ideaPayload,
  onComplete,
  onCancel,
}: {
  ideaPayload: IdeaPayload;
  onComplete: (data: any) => void;
  onCancel?: () => void;
}) {
  const [data, setData] = useState<TrustBuilderData>(() => {
    try {
      const cached = safeSessionStorageGet("plg_cached_data");
      const cachedIdea = safeSessionStorageGet("plg_cached_idea");
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
  const [isProceeding, setIsProceeding] = useState(false);
  const { user } = useAuth();
  const { openModal } = useAuthDialogDispatch();
  const { isOpen } = useAuthDialogState();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isLoggingIn && !isOpen) {
      const timeout = setTimeout(() => {
        if (!user || user.isAnonymous) {
          setIsLoggingIn(false);
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, isLoggingIn, user]);

  useEffect(() => {
    if (user && !user.isAnonymous && isPqlGated && isLoggingIn) {
      setIsLoggingIn(false);
      setIsPqlGated(false);
      const resumeController = new AbortController();
      streamValidation(resumeController, true);
    }
  }, [user, isPqlGated, isLoggingIn]);

  const updateDataState = useCallback(
    (key: keyof TrustBuilderData, value: any) => {
      setData((prev) => ({ ...prev, [key]: value }));
      if (key !== "competitorList") {
        setActiveItems((prev) => Array.from(new Set([...prev, key])));
      }
    },
    [],
  );

  const streamValidation = useCallback(
    async (
      abortController: AbortController,
      attemptResumption: boolean = false,
    ) => {
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

        const clearCache = () => {
          safeSessionStorageRemove("plg_cached_data");
          safeSessionStorageRemove("plg_cached_idea");
        };

        await parseSSEStream(
          response,
          (parsed) => {
            if (parsed.type === "competitor_count") {
              updateDataState("competitors", parsed.value);
            } else if (parsed.type === "competitor_list") {
              updateDataState("competitorList", parsed.value);
            } else if (parsed.type === "jtbd_analysis") {
              updateDataState("jtbdAnalysis", parsed.value);
            } else if (parsed.type === "gap_analysis") {
              updateDataState("gapAnalysis", parsed.value);
            } else if (parsed.type === "market_radar") {
              updateDataState("marketRadar", parsed.value);
            } else if (parsed.type === "pql_gate") {
              setIsPqlGated(true);
              return true; // Halt parsing
            } else if (parsed.type === "tarpit_score") {
              updateDataState("tarpitScore", parsed.value);
            } else if (parsed.type === "final") {
              updateDataState("finalStrategy", parsed.value);
              setIsComplete(true);
              setFinalData(parsed.value);
            } else if (parsed.type === "final_radar") {
              setIsComplete(true);
              setFinalData(parsed.value);
            } else if (parsed.type === "error") {
              setError(parsed.value);
              return true; // Halt parsing
            }
          },
          attemptResumption ? clearCache : undefined,
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      }
    },
    [ideaPayload],
  );

  useEffect(() => {
    const abortController = new AbortController();
    streamValidation(abortController);
    return () => abortController.abort();
  }, [ideaPayload, streamValidation]);

  const handleLoginToUnlock = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    safeSessionStorageSet("plg_cached_data", JSON.stringify(data));
    safeSessionStorageSet("plg_cached_idea", JSON.stringify(ideaPayload));

    setIsLoggingIn(true);
    setError(null);
    try {
      openModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to authenticate.");
      } else {
        setError("Failed to authenticate.");
      }
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

        {error && !isPqlGated ? (
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
                  isPqlGated ? null : (
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
                  isPqlGated ? null : (
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

        {isPqlGated && (
          <PqlGate
            isLoggingIn={isLoggingIn}
            handleLoginToUnlock={handleLoginToUnlock}
            error={error}
            data={data}
          />
        )}

        {isComplete && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-center"
          >
            <Button
              isPending={isProceeding}
              loadingText="Proceeding..."
              onClick={async () => {
                setIsProceeding(true);
                try {
                  await Promise.resolve(
                    onComplete({
                      ...finalData,
                      curatedCompetitors: data.competitorList,
                    }),
                  );
                } finally {
                  setIsProceeding(false);
                }
              }}
              className="px-8 py-4 bg-ink-dark text-white rounded-xl font-bold text-lg hover:bg-black transition-colors shadow-lg"
            >
              View Validated Idea
            </Button>
          </motion.div>
        )}

        {onCancel && !isComplete && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
                onCancel();
              }}
              className="px-4 py-2 text-ink-dark/50 hover:text-ink-dark font-medium transition-colors text-sm"
            >
              Cancel Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PqlGate({
  isLoggingIn,
  handleLoginToUnlock,
  error,
  data,
}: {
  isLoggingIn: boolean;
  handleLoginToUnlock: () => void;
  error?: string | null;
  data?: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-200 mt-6 shadow-sm overflow-hidden"
    >
      <div
        className="absolute inset-0 z-0 opacity-30 select-none pointer-events-none"
        style={{
          maskImage: "linear-gradient(to bottom, black 20%, transparent 80%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 20%, transparent 80%)",
        }}
      >
        {/* Faux Data Background based on actual data if available */}
        <div className="p-6 blur-[3px] text-xs font-mono text-ink-dark/60 leading-relaxed">
          [MARKET SIGNAL DETECTED]
          <br />
          {data?.marketRadar ? (
            <>
              Velocity: {data.marketRadar.market_velocity || "HIGH_GROWTH"}
              <br />
              Key Players: {data.marketRadar.dominant_players?.length || 3}{" "}
              dominant entities identified.
              <br />
              {data.competitors ? `Total Competitors: ${data.competitors}` : ""}
              <br />
              <br />
              Gap Analysis: Vectors available for positioning.
              <br />
              {data.gapAnalysis?.map((gap: any, i: number) => (
                <div key={i}>
                  - Vector {i + 1}: {gap.feature} ({gap.competitor_deficit})
                </div>
              ))}
            </>
          ) : (
            <>
              Velocity: EVALUATING...
              <br />
              Key Players: Identifying dominant entities...
              <br />
              Threat Level: CALCULATING...
              <br />
              <br />
              Gap Analysis: Vectors available for positioning.
              <br />
              - Vector A: [REDACTED]
              <br />
              - Vector B: [REDACTED]
              <br />
              - Vector C: [REDACTED]
              <br />
            </>
          )}
          <br />
          Synthesizing go-to-market trajectory...
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center bg-white/80 p-6 rounded-2xl backdrop-blur-sm border border-white/50">
        <Lock className="w-8 h-8 text-ink-dark mb-4" />
        <h3 className="text-xl font-bold text-ink-dark mb-2 text-center">
          Sign up to unlock full analysis
        </h3>
        <p className="text-ink-dark/70 text-center mb-6 text-sm max-w-sm">
          Great start. We've identified key market dynamics. 🔒 Your idea and
          market data are safely cached. Sign up to save this research and
          unlock the rest.
        </p>
        {error && (
          <div className="mb-4 text-rose-600 text-sm font-medium text-center bg-rose-50 p-2 rounded w-full">
            {error}
          </div>
        )}
        <Button
          onClick={handleLoginToUnlock}
          isPending={isLoggingIn}
          loadingText="Unlocking..."
          className="px-6 py-3 bg-ink-dark text-white rounded-xl font-bold hover:bg-black shadow-lg"
        >
          Unlock Analysis
        </Button>
      </div>
    </motion.div>
  );
}

function CompetitorStep({
  count,
  list,
  setList,
}: {
  count: number;
  list?: CompetitorData[] | null;
  setList?: (list: CompetitorData[]) => void;
}) {
  const setThreatLevel = (index: number, level: string) => {
    if (!list || !setList) return;
    const newList = [...list];
    newList[index] = { ...newList[index], threatLevel: level };
    setList(newList);
  };

  return (
    <AnalysisStepItem value="competitors" title="Market Analysis Complete">
      <p className="mb-4">Found {count} existing solutions in this space.</p>

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
                <p className="font-bold text-ink-dark truncate">{comp.name}</p>
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
    </AnalysisStepItem>
  );
}

function AnalysisStepItem({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Accordion.Item value={value} asChild>
      <motion.div
        layout
        className="border border-ink-dark/10 rounded-xl overflow-hidden bg-gray-50/50"
      >
        <Accordion.Header>
          <Accordion.Trigger className="flex items-center w-full gap-4 py-4 px-4 text-left focus:outline-none group">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-base font-medium text-ink-dark flex-grow">
              {title}
            </span>
            <ChevronDown
              className="w-5 h-5 text-ink-dark/50 transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden
            />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="px-4 pb-4 pt-0 text-ink-dark/80 text-sm animate-radix-accordion-down">
          {children}
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function TarpitStep({
  data,
}: {
  data: NonNullable<TrustBuilderData["tarpitScore"]>;
}) {
  return (
    <AnalysisStepItem value="tarpitScore" title="Tarpit Risk Evaluated">
      Tarpit Risk Score: {Math.round(data.score)}.
      {data.isTarpit
        ? " High risk of entering a saturated market."
        : " Low risk. This is a defensible niche."}
    </AnalysisStepItem>
  );
}

function JTBDStep({
  data,
}: {
  data: NonNullable<TrustBuilderData["jtbdAnalysis"]>;
}) {
  return (
    <AnalysisStepItem value="jtbdAnalysis" title="Customer Jobs Analyzed">
      <p className="mb-2">
        <strong>Core Job:</strong> {data.job}
      </p>
      <p>
        <strong>Opportunity Score:</strong> {Math.round(data.opportunityScore)}{" "}
        / 20
      </p>
    </AnalysisStepItem>
  );
}

function GapAnalysisStep({
  data,
}: {
  data: NonNullable<TrustBuilderData["gapAnalysis"]>;
}) {
  return (
    <AnalysisStepItem value="gapAnalysis" title="Market Gaps Quantified">
      <ul className="list-disc pl-5 space-y-1">
        {data.map((gap, i) => (
          <li key={i}>
            <strong>{gap.feature}:</strong> {gap.competitor_deficit}
          </li>
        ))}
      </ul>
    </AnalysisStepItem>
  );
}

function MarketRadarStep({
  data,
}: {
  data: NonNullable<TrustBuilderData["marketRadar"]>;
}) {
  return (
    <AnalysisStepItem value="marketRadar" title="Market Radar Extracted">
      <p className="mb-2">
        <strong>Market Velocity:</strong> {data.market_velocity}
      </p>
      <p className="mb-1">
        <strong>Dominant Players:</strong> {data.dominant_players?.join(", ")}
      </p>
      <p className="mb-1">
        <strong>Emerging Threats:</strong> {data.emerging_threats?.join(", ")}
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
    </AnalysisStepItem>
  );
}

function FinalStrategyStep({
  data,
}: {
  data: NonNullable<TrustBuilderData["finalStrategy"]>;
}) {
  return (
    <AnalysisStepItem value="finalStrategy" title="Strategy Synthesized">
      <p className="mb-2">{data.reasoning}</p>
      <div className="bg-white p-3 rounded border border-ink-dark/10 mt-2 text-xs">
        <strong>Key Quote:</strong> "{data.exact_quote}"
      </div>
    </AnalysisStepItem>
  );
}
