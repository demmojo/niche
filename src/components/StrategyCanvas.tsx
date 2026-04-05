import React, { useState } from "react";
import { cn } from "../lib/utils";
import { Lock } from "lucide-react";
import { AsyncButton } from "./AsyncButton";

interface Props {
  isLocked: boolean;
  children: React.ReactNode;
  onUnlockClick?: () => void | Promise<void>;
}

export function StrategyCanvas({ isLocked, children, onUnlockClick }: Props) {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUnlockClick = async () => {
    if (!onUnlockClick) return;
    startTransition(async () => {
      setError(null);
      try {
        await Promise.resolve(onUnlockClick());
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message || "Failed to unlock canvas.");
        } else {
          setError("An unexpected error occurred.");
        }
      }
    });
  };

  return (
    <div className="relative w-full h-full min-h-[400px] border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div
        data-testid="canvas-content"
        className={cn(
          "w-full h-full p-6 transition-all duration-500 ease-in-out",
          isLocked && "mask-gradient-to-b",
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
          className="absolute inset-x-0 bottom-0 top-[60%] z-10 flex flex-col items-center justify-center bg-gradient-to-t from-white via-white/90 to-transparent pt-12 pointer-events-none"
        >
          <div className="bg-white p-4 rounded-full shadow-lg text-amber-600 mb-4 pointer-events-auto">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-serif pointer-events-auto">
            Strategy Locked
          </h3>
          <p className="text-gray-600 mt-2 max-w-sm text-center pointer-events-auto">
            Sign up to unlock the strategy canvas, save your progress, and begin
            execution.
          </p>
          {error && (
            <p
              className="text-rose-600 mt-2 text-sm font-medium pointer-events-auto"
              role="alert"
            >
              {error}
            </p>
          )}
          <AsyncButton
            onClick={handleUnlockClick}
            isPending={isPending}
            loadingText="Unlocking Canvas..."
            className="mt-6 px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 rounded min-w-[160px] pointer-events-auto"
          >
            Unlock Canvas
          </AsyncButton>
        </div>
      )}
    </div>
  );
}
