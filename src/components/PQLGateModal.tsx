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
      {/* Background blurred mockup of generated analysis */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none select-none flex flex-col gap-6 p-8 filter blur-sm">
        <div className="w-3/4 h-32 bg-slate-800 rounded-lg animate-pulse"></div>
        <div className="w-1/2 h-8 bg-slate-800 rounded flex gap-2"></div>
        <div className="w-full h-48 bg-slate-800 rounded-lg"></div>
        <div className="w-2/3 h-24 bg-slate-800 rounded-lg"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 relative z-10 border border-slate-200">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-3 text-center">
          Save Your Analysis
        </h2>
        <p className="text-slate-600 mb-6 text-center leading-relaxed">
          Your market strategy is ready, but you're in an anonymous session.
          <span className="font-semibold text-slate-900 block mt-2">
            Sign in to save these insights before they're lost.
          </span>
        </p>

        {error && (
          <div className="text-rose-500 bg-rose-50 p-3 rounded-lg text-sm font-medium mb-4 text-center">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handleUpgrade}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              "Continue with Google"
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors mt-2"
          >
            Discard analysis
          </button>
        </div>
      </div>
    </div>
  );
}
