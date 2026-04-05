import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  Undo,
  ArrowRight,
  Lightbulb,
  Play,
  Loader2,
} from "lucide-react";
import { useFounderActiveProductId } from "./FounderProvider";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthProvider";

export function PivotSimulator() {
  const { user } = useAuth();
  const activeProductId = useFounderActiveProductId();
  const [cards, setCards] = useState([
    {
      id: "pivot-1",
      title: "Verticalize for Legal",
      description:
        "Shift target audience entirely to law firms who suffer from high document review costs.",
      pros: ["High willingness to pay", "Clear regulatory moat"],
      cons: ["Long sales cycles", "High security requirements"],
      confidenceScore: 85,
    },
    {
      id: "pivot-2",
      title: "Self-Serve PLG Model",
      description:
        "Drop enterprise sales and focus on a self-serve bottom-up motion.",
      pros: ["Faster feedback loop", "Lower CAC"],
      cons: ["Lower ACV", "Higher churn initially"],
      confidenceScore: 72,
    },
  ]);

  const [acceptedPivots, setAcceptedPivots] = useState<string[]>([]);
  const [rejectedPivots, setRejectedPivots] = useState<any[]>([]);
  const [shimmerIndex, setShimmerIndex] = useState<number | null>(null);

  const handleAccept = (card: any) => {
    setCards(cards.filter((c) => c.id !== card.id));
    setAcceptedPivots([...acceptedPivots, card.title]);

    // Trigger shimmer in the right pane
    setShimmerIndex(acceptedPivots.length);
    setTimeout(() => setShimmerIndex(null), 1500);
  };

  const handleReject = async (card: any) => {
    setCards(cards.filter((c) => c.id !== card.id));
    setRejectedPivots([...rejectedPivots, card]);

    if (user?.uid && activeProductId) {
      try {
        await setDoc(
          doc(db, "tenant_ideas", activeProductId),
          {
            userId: user.uid,
            negativeConstraints: arrayUnion(card.title),
          },
          { merge: true },
        );
      } catch (err) {
        console.error("Failed to save negative constraint", err);
      }
    }
  };

  const handleUndo = () => {
    if (rejectedPivots.length === 0) return;
    const lastRejected = rejectedPivots[rejectedPivots.length - 1];
    setRejectedPivots(rejectedPivots.slice(0, -1));
    setCards([lastRejected, ...cards]);
  };

  const [activeMobileTab, setActiveMobileTab] = useState<"queue" | "document">(
    "queue",
  );

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-[#F5F3ED]">
      {/* Mobile Tabs Toggle */}
      <div className="md:hidden flex p-2 bg-white border-b border-ink-dark/10 shadow-sm shrink-0">
        <button
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeMobileTab === "queue" ? "bg-ink-dark text-white" : "text-ink-dark/60 hover:bg-gray-100"}`}
          onClick={() => setActiveMobileTab("queue")}
        >
          Decision Queue
        </button>
        <button
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeMobileTab === "document" ? "bg-ink-dark text-white" : "text-ink-dark/60 hover:bg-gray-100"}`}
          onClick={() => setActiveMobileTab("document")}
        >
          Live Document
        </button>
      </div>

      {/* Left Pane: Decision Queue */}
      <div
        className={`w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-ink-dark/10 bg-white h-full ${activeMobileTab === "queue" ? "flex" : "hidden md:flex"}`}
      >
        <div className="p-4 border-b border-ink-dark/10 flex items-center justify-between">
          <h2 className="font-bold text-lg text-ink-dark">Decision Queue</h2>
          {rejectedPivots.length > 0 && (
            <button
              onClick={handleUndo}
              className="text-sm flex items-center gap-1 text-ink-dark/60 hover:text-ink-dark transition-colors"
            >
              <Undo className="w-4 h-4" /> Undo Reject
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {cards.length > 0 ? (
              cards.map((card) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-ink-dark/20 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-ink-dark">{card.title}</h3>
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                      <Lightbulb className="w-3 h-3" />
                      {card.confidenceScore}% Confidence
                    </div>
                  </div>
                  <p className="text-sm text-ink-dark/80 mb-4">
                    {card.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 block mb-1">
                        PROS
                      </span>
                      <ul className="text-xs text-ink-dark/70 space-y-1 list-disc list-inside">
                        {card.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-red-600 block mb-1">
                        CONS
                      </span>
                      <ul className="text-xs text-ink-dark/70 space-y-1 list-disc list-inside">
                        {card.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReject(card)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium text-sm"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleAccept(card)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-ink-dark text-white hover:bg-black transition-colors font-medium text-sm shadow-sm"
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-48 text-center"
              >
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-ink-dark mb-1">Queue Cleared</h3>
                <p className="text-sm text-ink-dark/60 mb-4">
                  You've reviewed all current insights.
                </p>

                <button className="flex items-center gap-2 px-4 py-2 bg-ink-dark text-white rounded-lg hover:bg-black transition-colors text-sm font-bold shadow-sm">
                  <Play className="w-4 h-4 fill-current" />
                  Run Market Radar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Pane: Live Document */}
      <div
        className={`w-full md:w-2/3 flex flex-col bg-[#F5F3ED] h-full ${activeMobileTab === "document" ? "flex" : "hidden md:flex"}`}
      >
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-ink-dark">
              Product Strategy Document
            </h1>

            <section className="bg-white rounded-xl p-6 shadow-sm border border-ink-dark/5">
              <h2 className="text-lg font-bold text-ink-dark mb-4 border-b border-ink-dark/10 pb-2">
                Jobs To Be Done (JTBD)
              </h2>
              <div className="text-ink-dark/80 text-sm">
                <p>
                  When I want to understand my market, help me discover hidden
                  competitors, so I can pivot to a blue ocean.
                </p>
              </div>
            </section>

            <section className="bg-white rounded-xl p-6 shadow-sm border border-ink-dark/5">
              <h2 className="text-lg font-bold text-ink-dark mb-4 border-b border-ink-dark/10 pb-2">
                Market Gaps
              </h2>
              <ul className="list-disc list-inside text-sm text-ink-dark/80 space-y-2">
                <li>
                  Competitors are focused on enterprise, leaving SMBs
                  underserved.
                </li>
                <li>
                  No automated workflow integration for current solutions.
                </li>
              </ul>
            </section>

            <section className="bg-white rounded-xl p-6 shadow-sm border border-ink-dark/5">
              <h2 className="text-lg font-bold text-ink-dark mb-4 border-b border-ink-dark/10 pb-2">
                Selected Pivot Vectors
              </h2>
              {acceptedPivots.length > 0 ? (
                <div className="space-y-3">
                  {acceptedPivots.map((pivot, i) => (
                    <motion.div
                      key={i}
                      animate={
                        shimmerIndex === i
                          ? {
                              backgroundColor: [
                                "#ffffff",
                                "#f0fdf4",
                                "#ffffff",
                              ],
                              scale: [1, 1.02, 1],
                              transition: { duration: 1.5 },
                            }
                          : {}
                      }
                      className="p-3 bg-gray-50 border border-ink-dark/10 rounded-lg text-sm text-ink-dark font-medium"
                    >
                      {pivot}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-dark/50 italic">
                  No pivots selected yet. Review the decision queue.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
