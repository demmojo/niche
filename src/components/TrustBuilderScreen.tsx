import { Suspense, useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import * as Accordion from "@radix-ui/react-accordion";
import { fetchWithAppCheck } from "../utils/fetchWithAppCheck";
import { Loader2, CheckCircle2, ChevronDown } from "lucide-react";

// 1. Helper to create externally resolvable promises
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function StepLoading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 py-4 px-4 text-ink-dark/50">
      <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
      <span className="text-base font-medium">{title}</span>
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
  const [steps] = useState(() => ({
    competitors: createDeferred<number>(),
    jtbdAnalysis: createDeferred<any>(),
    gapAnalysis: createDeferred<any>(),
    tarpitScore: createDeferred<any>(),
    finalStrategy: createDeferred<any>(),
  }));

  const [activeItems, setActiveItems] = useState<string[]>([]);

  useEffect(() => {
    const abortController = new AbortController();

    async function streamValidation() {
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
              const data = JSON.parse(chunk.replace("data: ", ""));

              if (data.type === "competitor_count") {
                steps.competitors.resolve(data.value);
                setActiveItems((prev) => [...prev, "competitors"]);
              }
              if (data.type === "jtbd_analysis") {
                steps.jtbdAnalysis.resolve(data.value);
                setActiveItems((prev) => [...prev, "jtbdAnalysis"]);
              }
              if (data.type === "gap_analysis") {
                steps.gapAnalysis.resolve(data.value);
                setActiveItems((prev) => [...prev, "gapAnalysis"]);
              }
              if (data.type === "tarpit_score") {
                steps.tarpitScore.resolve(data.value);
                setActiveItems((prev) => [...prev, "tarpitScore"]);
              }
              if (data.type === "final") {
                steps.finalStrategy.resolve(data.value);
                setActiveItems((prev) => [...prev, "finalStrategy"]);

                // Allow user to read it shortly, then proceed
                setTimeout(() => onComplete(data.value), 3000);
              }
              if (data.type === "error") {
                throw new Error(data.value);
              }
            } catch (e) {
              console.error("Parse error on chunk", chunk, e);
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // Reject pending promises to trigger React Error Boundaries
          steps.competitors.reject(err);
          steps.jtbdAnalysis.reject(err);
          steps.gapAnalysis.reject(err);
          steps.tarpitScore.reject(err);
          steps.finalStrategy.reject(err);
        }
      }
    }

    streamValidation();
    return () => abortController.abort(); // Cleanup prevents zombie streams
  }, [ideaPayload, steps, onComplete]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-[#F5F3ED] px-4 py-12"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-ink-dark/10">
        <h2 className="text-2xl font-serif font-bold text-ink-dark mb-6 text-center">
          Evaluating Market Viability...
        </h2>

        <Accordion.Root
          type="multiple"
          value={activeItems}
          onValueChange={setActiveItems}
          className="space-y-4"
        >
          {/* Competitors Step */}
          <Suspense
            fallback={
              <StepLoading title="Scanning market for competitors..." />
            }
          >
            <CompetitorStep dataPromise={steps.competitors.promise} />
          </Suspense>

          {/* JTBD Analysis Step */}
          <Suspense
            fallback={<StepLoading title="Analyzing Customer Jobs (JTBD)..." />}
          >
            <JTBDStep dataPromise={steps.jtbdAnalysis.promise} />
          </Suspense>

          {/* Gap Analysis Step */}
          <Suspense
            fallback={<StepLoading title="Quantifying Market Gaps..." />}
          >
            <GapAnalysisStep dataPromise={steps.gapAnalysis.promise} />
          </Suspense>

          {/* Tarpit Score Step */}
          <Suspense fallback={<StepLoading title="Analyzing tarpit risk..." />}>
            <TarpitStep dataPromise={steps.tarpitScore.promise} />
          </Suspense>

          {/* Final Strategy Step */}
          <Suspense
            fallback={<StepLoading title="Synthesizing final strategy..." />}
          >
            <FinalStrategyStep dataPromise={steps.finalStrategy.promise} />
          </Suspense>
        </Accordion.Root>
      </div>
    </div>
  );
}

function CompetitorStep({ dataPromise }: { dataPromise: Promise<number> }) {
  const competitorCount = use(dataPromise); // Suspends here until resolved

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
          Found {competitorCount} existing solutions in this space.
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function TarpitStep({ dataPromise }: { dataPromise: Promise<any> }) {
  const scoreResult = use(dataPromise);

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
          Tarpit Risk Score: {Math.round(scoreResult.score)}.
          {scoreResult.isTarpit
            ? " High risk of entering a saturated market."
            : " Low risk. This is a defensible niche."}
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function JTBDStep({ dataPromise }: { dataPromise: Promise<any> }) {
  const jtbdResult = use(dataPromise);

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
            <strong>Core Job:</strong> {jtbdResult.job}
          </p>
          <p>
            <strong>Opportunity Score:</strong>{" "}
            {Math.round(jtbdResult.opportunityScore)} / 20
          </p>
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}

function GapAnalysisStep({ dataPromise }: { dataPromise: Promise<any[]> }) {
  const gapsResult = use(dataPromise);

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
            {gapsResult.map((gap, i) => (
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

function FinalStrategyStep({ dataPromise }: { dataPromise: Promise<any> }) {
  const finalResult = use(dataPromise);

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
          <p className="mb-2">{finalResult.reasoning}</p>
          <div className="bg-white p-3 rounded border border-ink-dark/10 mt-2 text-xs">
            <strong>Key Quote:</strong> "{finalResult.exact_quote}"
          </div>
        </Accordion.Content>
      </motion.div>
    </Accordion.Item>
  );
}
