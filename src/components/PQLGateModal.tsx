import React from "react";
import { usePQLUpgrade } from "../hooks/usePQLUpgrade";

export function PQLGateModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { upgradeAccount, isPending, error } = usePQLUpgrade();

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    const success = await upgradeAccount();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 relative">
        <h2 className="text-2xl font-black text-ink-dark mb-2">
          Unlock Full Features
        </h2>
        <p className="text-ink-dark/70 mb-6">
          You're currently in a read-only or anonymous session. Sign up or log
          in to save your progress, deploy your strategy, and access all
          advanced features.
        </p>

        {error && (
          <div className="text-rose-500 bg-rose-50 p-3 rounded-lg text-sm font-medium mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgrade}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-ink-dark text-white font-bold rounded-lg hover:bg-ink-dark/90 transition-colors disabled:opacity-50"
          >
            {isPending ? "Upgrading..." : "Continue with Google"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-ink-dark/60 hover:text-ink-dark font-medium underline text-sm transition-colors"
          >
            No thanks, maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
