import { dictionary, tMessage } from "../content/dictionary";
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { InsightBrainstormChat } from "./InsightBrainstormChat";
import { Tooltip } from "./Tooltip";

interface InsightBrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitors: any[];
  insights: any[];
  rawData: any[];
  onSaveInsight: (insight: any) => void;
}

/**
 *
 */
export function InsightBrainstormModal({
  isOpen,
  onClose,
  competitors,
  insights,
  rawData,
  onSaveInsight,
}: InsightBrainstormModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink-dark/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-paper-light rounded-2xl shadow-2xl overflow-hidden border border-ink-dark/20"
        >
          <Tooltip
            content={tMessage(dictionary.tooltips.brainstorm.close)}
            position="left"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-ink-muted hover:text-ink-dark hover:bg-paper-base rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>
          </Tooltip>

          <InsightBrainstormChat
            competitors={competitors}
            insights={insights}
            rawData={rawData}
            onSaveInsight={onSaveInsight}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
