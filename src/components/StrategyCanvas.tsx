import React from "react";
import { cn } from "../lib/utils";
import { Lock } from "lucide-react";

interface Props {
  isLocked: boolean;
  children: React.ReactNode;
  onUnlockClick?: () => void;
}

export function StrategyCanvas({ isLocked, children, onUnlockClick }: Props) {
  return (
    <div className="relative w-full h-full min-h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div
        data-testid="canvas-content"
        className={cn(
          "w-full h-full p-6 transition-all duration-500 ease-in-out",
          isLocked &&
            "blur-[4px] grayscale-[50%] select-none pointer-events-none",
        )}
      >
        {children}
      </div>

      {isLocked && (
        <div
          data-testid="lock-overlay"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/30"
        >
          <div className="bg-white p-4 rounded-full shadow-lg text-amber-600 mb-4">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-serif">
            Strategy Locked
          </h3>
          <p className="text-gray-600 mt-2 max-w-sm text-center">
            Sign up to unlock the strategy canvas, save your progress, and begin
            execution.
          </p>
          <button
            onClick={onUnlockClick}
            className="mt-6 px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded"
          >
            Unlock Canvas
          </button>
        </div>
      )}
    </div>
  );
}
