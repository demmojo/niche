import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { Lock } from "lucide-react";

interface Props {
  isLocked: boolean;
  children: React.ReactNode;
  onUnlockClick?: () => void | Promise<void>;
}

export function StrategyCanvas({ isLocked, children, onUnlockClick }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleUnlockClick = async () => {
    if (!onUnlockClick) return;
    setIsPending(true);
    setError(null);
    try {
      await Promise.resolve(onUnlockClick());
    } catch (e: any) {
      if (isMounted.current) {
        setError(e.message || "Failed to unlock canvas.");
      }
    } finally {
      if (isMounted.current) {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div
        data-testid="canvas-content"
        inert={isLocked || undefined}
        className={cn(
          "w-full h-full p-6 transition-all duration-500 ease-in-out",
          isLocked &&
            "opacity-50 select-none pointer-events-none mask-gradient-to-b",
        )}
        style={
          isLocked
            ? {
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 30%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, black 30%, transparent 100%)",
              }
            : undefined
        }
      >
        {children}
      </div>

      {isLocked && (
        <div
          data-testid="lock-overlay"
          className="absolute inset-x-0 bottom-0 top-[30%] z-10 flex flex-col items-center justify-center bg-gradient-to-t from-white via-white/90 to-transparent pt-12"
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
          {error && (
            <p className="text-rose-600 mt-2 text-sm font-medium">{error}</p>
          )}
          <button
            onClick={handleUnlockClick}
            disabled={isPending}
            className="mt-6 px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
          >
            {isPending ? (
              <span
                className="flex items-center gap-2"
                aria-live="polite"
                aria-busy="true"
              >
                <div
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                <span>Unlocking Canvas...</span>
              </span>
            ) : (
              "Unlock Canvas"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
