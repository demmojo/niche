import React from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface IntentRouterProps {
  onSelect: (intent: "idea" | "brainstorm") => void;
}

export const IntentRouter: React.FC<IntentRouterProps> = ({ onSelect }) => {
  return (
    <div className="flex-1 w-full flex items-center justify-center p-8 relative">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-ink-dark mb-4">
            How would you like to begin?
          </h1>
          <p className="text-xl text-ink-dark/60 max-w-2xl mx-auto">
            Choose your path to discover and build a defensible product niche.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Option A */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-3xl p-10 border-2 border-ink-dark/10 hover:border-sky/50 shadow-sm hover:shadow-xl hover:shadow-sky/10 cursor-pointer transition-all flex flex-col h-full"
            onClick={() => onSelect("idea")}
          >
            <div className="w-16 h-16 rounded-2xl bg-sky/10 text-sky flex items-center justify-center mb-6">
              <Lightbulb size={32} />
            </div>
            <h2 className="text-2xl font-bold text-ink-dark mb-3">
              I have a specific idea
            </h2>
            <p className="text-ink-dark/60 mb-8 flex-1">
              Start with your concept. We'll run it through the Tarpit Analyzer
              to find market gaps and validate its defensibility before you
              build.
            </p>
            <div className="text-sky font-semibold flex items-center gap-2 mt-auto">
              Validate Idea &rarr;
            </div>
          </motion.div>

          {/* Option B */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-ink-dark text-white rounded-3xl p-10 shadow-lg cursor-pointer transition-all flex flex-col h-full group"
            onClick={() => onSelect("brainstorm")}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              I want to brainstorm a new idea
            </h2>
            <p className="text-white/70 mb-8 flex-1">
              Skip straight to market analysis. Ingest competitor URLs to
              automatically synthesize a Hybrid Product and discover Blue Ocean
              opportunities.
            </p>
            <div className="text-white font-semibold flex items-center gap-2 mt-auto opacity-80 group-hover:opacity-100 transition-opacity">
              Start Brainstorming &rarr;
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
