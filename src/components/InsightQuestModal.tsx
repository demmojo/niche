import { dictionary, tMessage } from "../content/dictionary";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Sprout, Sun, Leaf, X, Wheat } from "lucide-react";
import { Tooltip } from "./Tooltip";

/**
 * Properties for the InsightQuestModal component.
 */
interface InsightQuestModalProps {
  /** Controls whether the modal is visible */
  isOpen: boolean;
  /** Callback fired to close the modal */
  onClose: () => void;
  /** Array of insight objects to rank (requires at least 2) */
  insights: any[];
  /** Callback fired when the user selects a winning insight over a losing one */
  onRankInsight: (winnerId: string, loserId: string) => void;
}

/**
 * A utility component that animates text as if it's being typed on a typewriter.
 * @param props.text - The full string to display
 * @param props.onComplete - Optional callback when typing finishes
 * @param props.speed - Delay in milliseconds between each character (default: 40)
 */
const TypewriterText = ({
  text,
  onComplete,
  speed = 40,
}: {
  text: string;
  onComplete?: () => void;
  speed?: number;
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, onComplete]);

  // Special rendering for the word "harvest"
  /**
   *
   */
  const renderText = () => {
    const parts = displayedText.split(/(harvest)/i);
    return parts.map((part, index) => {
      if (part.toLowerCase() === "harvest") {
        return (
          <span key={index} className="relative group cursor-help inline-block">
            <span className="text-[#8B5A2B] font-bold border-b-2 border-[#8B5A2B] border-dashed pb-0.5">
              {part}
            </span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#FFF9E6] text-[#8B5A2B] text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-lg border-2 border-[#8B5A2B] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
              Insight Engine
            </span>
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return <span>{renderText()}</span>;
};

/**
 * A gamified A/B ranking modal for strategic insights.
 * @description
 * Uses a farming metaphor to reduce decision fatigue when ranking a large volume
 * of AI-generated insights. Users choose the "better" insight across up to 3 rounds.
 * If fewer than 2 insights are provided, the modal skips straight to the outro.
 * @example
 * ```tsx
 * <InsightQuestModal
 *   isOpen={true}
 *   insights={currentInsights}
 *   onClose={() => setOpen(false)}
 *   onRankInsight={(winner, loser) => handleEloUpdate(winner, loser)}
 * />
 * ```
 */
export function InsightQuestModal({
  isOpen,
  onClose,
  insights,
  onRankInsight,
}: InsightQuestModalProps) {
  const [step, setStep] = useState<
    "intro" | "name" | "pill" | "game" | "outro"
  >("intro");
  const [adventurerName, setAdventurerName] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [gameMode, setGameMode] = useState<1 | 2 | 3>(1);
  const [insightA, setInsightA] = useState<any>(null);
  const [insightB, setInsightB] = useState<any>(null);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const maxRounds = 3;

  useEffect(() => {
    if (isOpen) {
      setStep("intro");
      setAdventurerName("");
      setIsTyping(true);
      setRoundsPlayed(0);
    }
  }, [isOpen]);

  /**
   *
   */
  const pickInsights = () => {
    if (insights.length >= 2) {
      // Pick two random different insights
      const shuffled = [...insights].sort(() => 0.5 - Math.random());
      setInsightA(shuffled[0]);
      setInsightB(shuffled[1]);
      // Pick random game mode
      setGameMode((Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3);
      return true;
    }
    return false;
  };

  /**
   *
   */
  const handleNextStep = () => {
    if (step === "intro") setStep("name");
    else if (step === "name") setStep("pill");
    else if (step === "pill") {
      const hasEnough = pickInsights();
      if (hasEnough) {
        setStep("game");
      } else {
        setStep("outro");
      }
    }
  };

  /**
   *
   */
  const handleChoice = (winnerId: string, loserId: string) => {
    onRankInsight(winnerId, loserId);
    if (roundsPlayed + 1 >= maxRounds) {
      setStep("outro");
    } else {
      setRoundsPlayed((prev) => prev + 1);
      const hasEnough = pickInsights();
      if (!hasEnough) setStep("outro");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2C2C2C]/60 backdrop-blur-sm font-pixel overflow-hidden p-4">
      <div className="relative w-full max-w-3xl p-8 border-4 border-[#8B5A2B] bg-[#FFF9E6] text-[#2C2C2C] shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)] rounded-3xl overflow-hidden">
        <Tooltip
          content={tMessage(dictionary.tooltips.quest.close)}
          position="left"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#8B5A2B] hover:text-[#5C4033] z-50 bg-[#FFF9E6] rounded-full p-1 border-2 border-transparent hover:border-[#8B5A2B] transition-all"
          >
            <X size={24} />
          </button>
        </Tooltip>

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center space-y-8 py-12"
            >
              <div className="w-20 h-20 border-4 border-[#8B5A2B] bg-[#A4C639] rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] animate-bounce">
                <Sprout size={40} className="text-[#FFF9E6]" />
              </div>
              <p className="text-3xl leading-relaxed max-w-xl text-[#5C4033] font-medium">
                <TypewriterText
                  text="Welcome to the Valley of Insights! The harvest is plentiful today, but we need your help to sort the best crops."
                  onComplete={() => setIsTyping(false)}
                />
              </p>
              {!isTyping && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleNextStep}
                  className="mt-8 px-8 py-3 border-4 border-[#8B5A2B] bg-[#FFD700] text-[#8B5A2B] font-bold hover:bg-[#FFA500] hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,90,43,0.5)] transition-all rounded-xl text-2xl uppercase tracking-widest"
                >
                  Let's Go!
                </motion.button>
              )}
            </motion.div>
          )}

          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center space-y-8 py-12"
            >
              <p className="text-3xl text-[#5C4033] font-medium">
                <TypewriterText
                  text="Hello there! What's your name, new farmer?"
                  onComplete={() => setIsTyping(false)}
                />
              </p>
              {!isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full max-w-xs space-y-6"
                >
                  <input
                    type="text"
                    value={adventurerName}
                    onChange={(e) => setAdventurerName(e.target.value)}
                    placeholder="Enter Name"
                    className="w-full bg-[#FFF9E6] border-4 border-[#8B5A2B] rounded-xl text-center text-3xl py-3 text-[#5C4033] focus:outline-none focus:border-[#D2691E] font-bold placeholder:text-[#8B5A2B]/50 shadow-[inset_0_4px_4px_rgba(0,0,0,0.05)]"
                    autoFocus
                    onKeyDown={(e) =>
                      e.key === "Enter" && adventurerName && handleNextStep()
                    }
                  />
                  {adventurerName && (
                    <button
                      onClick={handleNextStep}
                      className="w-full px-8 py-3 border-4 border-[#8B5A2B] bg-[#FFD700] text-[#8B5A2B] font-bold hover:bg-[#FFA500] hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,90,43,0.5)] transition-all rounded-xl text-2xl uppercase tracking-widest"
                    >
                      Nice to meet you!
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {step === "pill" && (
            <motion.div
              key="pill"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center space-y-8 py-8"
            >
              <p className="text-3xl leading-relaxed max-w-2xl text-[#5C4033] min-h-[100px] font-medium">
                <TypewriterText
                  text={`Listen closely, ${adventurerName || "Farmer"}. We have two beautiful crops here, but we only have room in our basket for one. Which one should we keep?`}
                  onComplete={() => setIsTyping(false)}
                  speed={30}
                />
              </p>

              {!isTyping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex gap-12 mt-8"
                >
                  <button
                    onClick={handleNextStep}
                    className="group relative w-28 h-28 rounded-2xl border-4 border-[#8B5A2B] bg-[#FF6B6B] hover:bg-[#FF8787] hover:-translate-y-2 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.5)] hover:shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)] transition-all flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#C92A2A] shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform"></div>
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="group relative w-28 h-28 rounded-2xl border-4 border-[#8B5A2B] bg-[#4DABF7] hover:bg-[#74C0FC] hover:-translate-y-2 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.5)] hover:shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)] transition-all flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1864AB] shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform"></div>
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === "game" && insightA && insightB && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full min-h-[400px]"
            >
              <div className="text-center mb-8">
                <h3 className="text-4xl font-bold text-[#8B5A2B] mb-2 uppercase tracking-widest">
                  {gameMode === 1 && "The Spring Harvest"}
                  {gameMode === 2 && "The Summer Festival"}
                  {gameMode === 3 && "The Autumn Fair"}
                </h3>
                <p className="text-2xl text-[#5C4033]">
                  {gameMode === 1 &&
                    "Two crops have sprouted. Only one can go to the market. Choose carefully."}
                  {gameMode === 2 &&
                    "The festival needs a centerpiece. Which of these two will win the blue ribbon?"}
                  {gameMode === 3 &&
                    "The harvest is ending. Which of these two will we save for next year's seeds?"}
                </p>
                <div className="mt-4 text-xl font-bold text-[#8B5A2B] bg-[#FFD700] inline-block px-4 py-1 rounded-full border-2 border-[#8B5A2B]">
                  Day {roundsPlayed + 1} of {maxRounds}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 font-sans">
                {/* Insight A */}
                <button
                  onClick={() => handleChoice(insightA.id, insightB.id)}
                  className={`group relative p-6 border-4 rounded-2xl text-left transition-all duration-300 overflow-hidden
                    ${gameMode === 1 ? "border-[#8B5A2B] bg-[#E8F5E9] hover:bg-[#C8E6C9] hover:-translate-y-2 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)]" : ""}
                    ${gameMode === 2 ? "border-[#8B5A2B] bg-[#FFF3E0] hover:bg-[#FFE0B2] hover:-translate-y-2 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)]" : ""}
                    ${gameMode === 3 ? "border-[#8B5A2B] bg-[#FFF8E1] hover:bg-[#FFECB3] hover:-translate-y-2 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)]" : ""}
                  `}
                >
                  <div className="relative z-10">
                    <div className="text-sm font-bold text-[#8B5A2B] mb-3 flex items-center gap-2 bg-white/50 inline-flex px-3 py-1 rounded-full border-2 border-[#8B5A2B]/20">
                      {gameMode === 1 && (
                        <Sprout size={16} className="text-green-600" />
                      )}
                      {gameMode === 2 && (
                        <Sun size={16} className="text-orange-500" />
                      )}
                      {gameMode === 3 && (
                        <Leaf size={16} className="text-amber-600" />
                      )}
                      Crop A
                    </div>
                    <h4 className="text-xl font-bold text-[#2C2C2C] mb-3 leading-tight">
                      {insightA.title}
                    </h4>
                    <p className="text-base text-[#5C4033] leading-relaxed">
                      {insightA.description}
                    </p>
                  </div>
                </button>

                {/* Insight B */}
                <button
                  onClick={() => handleChoice(insightB.id, insightA.id)}
                  className={`group relative p-6 border-4 rounded-2xl text-left transition-all duration-300 overflow-hidden
                    ${gameMode === 1 ? "border-[#8B5A2B] bg-[#E8F5E9] hover:bg-[#C8E6C9] hover:-translate-y-2 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)]" : ""}
                    ${gameMode === 2 ? "border-[#8B5A2B] bg-[#FFF3E0] hover:bg-[#FFE0B2] hover:-translate-y-2 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)]" : ""}
                    ${gameMode === 3 ? "border-[#8B5A2B] bg-[#FFF8E1] hover:bg-[#FFECB3] hover:-translate-y-2 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)] hover:shadow-[8px_8px_0px_0px_rgba(139,90,43,0.5)]" : ""}
                  `}
                >
                  <div className="relative z-10">
                    <div className="text-sm font-bold text-[#8B5A2B] mb-3 flex items-center gap-2 bg-white/50 inline-flex px-3 py-1 rounded-full border-2 border-[#8B5A2B]/20">
                      {gameMode === 1 && (
                        <Sprout size={16} className="text-green-600" />
                      )}
                      {gameMode === 2 && (
                        <Sun size={16} className="text-orange-500" />
                      )}
                      {gameMode === 3 && (
                        <Leaf size={16} className="text-amber-600" />
                      )}
                      Crop B
                    </div>
                    <h4 className="text-xl font-bold text-[#2C2C2C] mb-3 leading-tight">
                      {insightB.title}
                    </h4>
                    <p className="text-base text-[#5C4033] leading-relaxed">
                      {insightB.description}
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "outro" && (
            <motion.div
              key="outro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center space-y-8 py-12"
            >
              <div className="w-24 h-24 border-4 border-[#8B5A2B] bg-[#FFD700] rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.3)]">
                <Wheat size={48} className="text-[#8B5A2B]" />
              </div>
              <p className="text-3xl leading-relaxed max-w-xl text-[#5C4033] font-medium">
                <TypewriterText
                  text={`The basket is full, ${adventurerName || "Farmer"}! The crops you chose will feed the village and grow our farm. The others will be composted to enrich the soil. Your choices shape the valley.`}
                  onComplete={() => setIsTyping(false)}
                />
              </p>
              {!isTyping && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={onClose}
                  className="mt-8 px-8 py-3 border-4 border-[#8B5A2B] bg-[#A4C639] text-[#FFF9E6] font-bold hover:bg-[#8EAC30] hover:-translate-y-1 shadow-[4px_4px_0px_0px_rgba(139,90,43,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(139,90,43,0.5)] transition-all rounded-xl text-2xl uppercase tracking-widest"
                >
                  Return to Farm
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
