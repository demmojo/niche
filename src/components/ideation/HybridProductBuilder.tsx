import React, { useState, useEffect } from "react";
import { motion, useAnimation, PanInfo } from "motion/react";
import {
  Check,
  X,
  Sparkles,
  Map,
  HeartHandshake,
  AlertTriangle,
  Play,
} from "lucide-react";

interface HybridProductBuilderProps {
  features: any[];
  onFinish: (approvedFeatures: any[]) => void;
}

/**
 *
 */
export const HybridProductBuilder: React.FC<HybridProductBuilderProps> = ({
  features: initialFeatures,
  onFinish,
}) => {
  const [deck, setDeck] = useState(initialFeatures);
  const [approved, setApproved] = useState<any[]>([]);
  const [budgetUsed, setBudgetUsed] = useState(0);
  const MAX_BUDGET = 30; // 30 days of effort
  const [showWarning, setShowWarning] = useState(false);

  const controls = useAnimation();

  // Add gap features
  /**
   *
   */
  const handleFindNiche = () => {
    const gapFeatures = [
      {
        id: "gap-1",
        title: "HIPAA Compliant Local Hosting",
        cost: 15,
        source: "Market Gap",
        isGap: true,
        confidence: "92%",
        marketSize: "$1.2B",
      },
      {
        id: "gap-2",
        title: "Zero-knowledge E2E Encryption",
        cost: 10,
        source: "Market Gap",
        isGap: true,
        confidence: "88%",
        marketSize: "$800M",
      },
    ];
    setDeck([...gapFeatures, ...deck]);
  };

  /**
   *
   */
  const handleSwipe = async (dir: "left" | "right", feature: any) => {
    if (dir === "right") {
      const newBudget = budgetUsed + feature.cost;
      if (newBudget > MAX_BUDGET) {
        setShowWarning(true);
        // Animate reject/shake
        await controls.start({
          x: [-10, 10, -10, 10, 0],
          transition: { duration: 0.4 },
        });
        return; // Don't proceed
      }
      setApproved([...approved, feature]);
      setBudgetUsed(newBudget);
    }

    // Remove top card
    setDeck(deck.slice(1));
  };

  /**
   *
   */
  const handleDragEnd = async (e: any, info: PanInfo, feature: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      await controls.start({ x: 500, opacity: 0 });
      handleSwipe("right", feature);
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -500, opacity: 0 });
      handleSwipe("left", feature);
    } else {
      controls.start({ x: 0, opacity: 1 });
    }
  };

  if (deck.length === 0) {
    return (
      <div className="flex-1 w-full bg-paper-base flex items-center justify-center p-8">
        <div className="text-center max-w-md bg-white p-12 rounded-3xl border border-ink-dark/10 shadow-xl">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={40} />
          </div>
          <h2 className="text-3xl font-bold text-ink-dark mb-4">
            MVP Selected
          </h2>
          <p className="text-ink-dark/60 mb-8">
            You've curated a lean, defensible MVP weighing in at {budgetUsed}{" "}
            days of effort.
          </p>
          <button
            onClick={() => onFinish(approved)}
            className="w-full h-14 bg-ink-dark text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors"
          >
            Generate Product Spec <Play size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  const currentFeature = deck[0];
  const budgetPercentage = Math.min((budgetUsed / MAX_BUDGET) * 100, 100);
  const isDanger = budgetUsed > 25;

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-paper-light p-4 relative overflow-hidden">
      {/* Budget Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 z-50 flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white p-4 rounded-2xl border border-ink-dark/10 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-ink-dark">MVP Scope Budget</span>
            <span
              className={`${isDanger ? "text-rose-500" : "text-emerald-500"}`}
            >
              {budgetUsed} / {MAX_BUDGET} Days
            </span>
          </div>
          <div className="w-full h-3 bg-paper-base rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all duration-500 ${isDanger ? "bg-rose-500" : budgetUsed > 15 ? "bg-amber-400" : "bg-emerald-500"}`}
              style={{ width: `${budgetPercentage}%` }}
              layout
            />
          </div>
        </div>
      </div>

      {/* Find a Niche Button */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4">
        <button
          onClick={handleFindNiche}
          className="group relative bg-white border-2 border-amber-300 hover:border-amber-400 shadow-xl shadow-amber-500/10 rounded-2xl p-6 text-center w-64 transition-transform hover:scale-105"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-ink-dark text-lg">Find a Niche</h3>
            <p className="text-sm text-ink-dark/60 font-medium leading-snug">
              Pause extraction and discover highly-differentiated Gap Features.
            </p>
          </div>
        </button>
      </div>

      {/* Swipe Deck */}
      <div className="relative w-full max-w-sm h-[500px] z-30 perspective-[1000px]">
        {deck
          .slice(0, 3)
          .reverse()
          .map((feature, i, arr) => {
            const isTop = i === arr.length - 1;
            const indexFromTop = arr.length - 1 - i;

            return (
              <motion.div
                key={feature.id}
                className={`absolute inset-0 bg-white rounded-3xl border-2 shadow-2xl flex flex-col p-8 ${
                  feature.isGap
                    ? "border-amber-400 shadow-amber-400/20"
                    : "border-ink-dark/10"
                }`}
                style={{
                  zIndex: isTop ? 10 : i,
                  scale: 1 - indexFromTop * 0.05,
                  y: indexFromTop * 20,
                }}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, info) => handleDragEnd(e, info, feature)}
                animate={isTop ? controls : undefined}
              >
                {feature.isGap && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-amber-400/20 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} fill="currentColor" /> Blue Ocean Gap
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-3xl font-bold text-ink-dark leading-tight mb-4 text-center">
                    {feature.title}
                  </h3>

                  {feature.isGap ? (
                    <div className="space-y-3 mt-6">
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center text-sm font-semibold text-amber-900">
                        <span>Market Size</span>
                        <span>{feature.marketSize}</span>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center text-sm font-semibold text-amber-900">
                        <span>Confidence</span>
                        <span>{feature.confidence}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-paper-base border border-ink-dark/10 p-4 rounded-xl mt-6 relative group cursor-help">
                      <span className="text-xs font-bold text-ink-dark/40 uppercase tracking-wider block mb-2">
                        Provenance
                      </span>
                      <p className="text-sm font-medium text-ink-dark">
                        "Found in {feature.source}"
                      </p>

                      {/* Provenance Popover Hover */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-ink-dark text-white p-4 rounded-xl text-xs shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-ink-dark rotate-45" />
                        <p className="font-semibold text-sky-300 mb-1">
                          X-Ray Citation
                        </p>
                        <p className="opacity-80">
                          This feature was extracted directly from the
                          competitor's landing page pricing section with 98%
                          confidence.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex justify-between items-center pt-6 border-t border-ink-dark/10">
                  <span className="text-ink-dark/50 font-semibold text-sm">
                    Cost: {feature.cost} Days
                  </span>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Swipe Controls */}
      <div className="flex items-center gap-6 mt-12 z-30">
        <button
          onClick={() => handleSwipe("left", currentFeature)}
          className="w-16 h-16 rounded-full bg-white text-rose-500 border-2 border-ink-dark/10 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-lg shadow-ink-dark/5"
        >
          <X size={32} strokeWidth={3} />
        </button>
        <button
          onClick={() => handleSwipe("right", currentFeature)}
          className="w-16 h-16 rounded-full bg-white text-emerald-500 border-2 border-ink-dark/10 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors shadow-lg shadow-ink-dark/5"
        >
          <Check size={32} strokeWidth={3} />
        </button>
      </div>

      {/* Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink-dark/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-ink-dark/10"
          >
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-ink-dark mb-3">
              Tarpit Warning
            </h2>
            <p className="text-ink-dark/70 mb-8 leading-relaxed">
              Your MVP scope just exceeded {MAX_BUDGET} days of effort. To stay
              defensible and get to market quickly, you must discard a feature
              or move it to your post-launch roadmap.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full py-4 bg-ink-dark text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              Back to Drawing Board
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
