import React from "react";
import { motion } from "motion/react";
import { ShieldAlert, Zap } from "lucide-react";
import { useActionAuditStore } from "../store/actionAuditStore";

export const AutonomyDial: React.FC = () => {
  const mode = useActionAuditStore((state) => state.autonomyMode);
  const setMode = useActionAuditStore((state) => state.setAutonomyMode);

  return (
    <div className="flex items-center gap-2 bg-paper-base p-1.5 rounded-2xl border border-ink-dark/10 shadow-sm">
      <button
        onClick={() => setMode("Co-Pilot")}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
          mode === "Co-Pilot"
            ? "text-sky-600"
            : "text-ink-dark/40 hover:text-ink-dark/60"
        }`}
      >
        {mode === "Co-Pilot" && (
          <motion.div
            layoutId="autonomyDial"
            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-ink-dark/5"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <ShieldAlert size={16} className="relative z-10" />
        <span className="relative z-10">Co-Pilot</span>
      </button>

      <button
        onClick={() => setMode("Auto-Pilot")}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
          mode === "Auto-Pilot"
            ? "text-rose-500"
            : "text-ink-dark/40 hover:text-ink-dark/60"
        }`}
      >
        {mode === "Auto-Pilot" && (
          <motion.div
            layoutId="autonomyDial"
            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-ink-dark/5"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <Zap size={16} className="relative z-10" />
        <span className="relative z-10">Auto-Pilot</span>
      </button>
    </div>
  );
};
