import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Clock, Play } from "lucide-react";
import { useActionAuditStore } from "../store/actionAuditStore";

export const ActionAuditLog: React.FC = () => {
  const logs = useActionAuditStore((state) => state.logs);
  const approveAction = useActionAuditStore((state) => state.approveAction);
  const mode = useActionAuditStore((state) => state.autonomyMode);

  const pendingLogs = logs.filter((l) => l.status === "PENDING_CONSENT");

  if (pendingLogs.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-500/30 overflow-hidden flex flex-col">
        <div className="p-4 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
          <h3 className="font-bold text-sky-900 flex items-center gap-2">
            <Clock size={18} />
            Action Required
          </h3>
          <span className="text-xs font-semibold bg-sky-100 text-sky-700 px-2 py-1 rounded-md">
            {mode} Mode
          </span>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto space-y-4">
          <AnimatePresence>
            {pendingLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-paper-base rounded-xl p-4 border border-ink-dark/10"
              >
                <h4 className="font-bold text-ink-dark text-sm mb-2">
                  {log.proposedAction?.title || "Proposed AI Action"}
                </h4>
                <p className="text-xs text-ink-dark/60 mb-4">
                  {log.proposedAction?.description ||
                    "Review context before proceeding."}
                </p>

                <button
                  onClick={() => approveAction(log.id)}
                  className="w-full py-2 bg-sky-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-sky-600 transition-colors"
                >
                  <Play size={16} fill="currentColor" />
                  Approve & Execute
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
