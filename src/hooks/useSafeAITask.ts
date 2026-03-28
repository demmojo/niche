import { useState, useCallback, useTransition, useEffect, useRef } from "react";

export type SafeAIState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error; isTimeout: boolean };

export interface SafeAITaskOptions {
  timeoutMs?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 *
 */
export function useSafeAITask<T>(options?: SafeAITaskOptions) {
  const timeoutMs = options?.timeoutMs ?? 30000;

  const [isTransitionPending, startTransition] = useTransition();
  const [taskState, setTaskState] = useState<SafeAIState<T>>({
    status: "idle",
  });

  const isPending = isTransitionPending || taskState.status === "loading";

  const activeAbortController = useRef<AbortController | null>(null);

  // Cleanup on unmount to prevent memory leaks and dangling promises
  useEffect(() => {
    return () => {
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }
    };
  }, []);

  const executeTask = useCallback(
    (taskFn: (signal: AbortSignal) => Promise<T>) => {
      if (isPending) return; // Prevent concurrent executions

      // Setup AbortController for timeouts and unmounts
      if (activeAbortController.current) {
        activeAbortController.current.abort();
      }
      const abortController = new AbortController();
      activeAbortController.current = abortController;

      startTransition(() => {
        setTaskState({ status: "loading" });
      });

      const timeoutId = setTimeout(() => {
        abortController.abort(new Error("TimeoutExceeded"));
      }, timeoutMs);

      // We cannot await inside startTransition in React 19 directly without wrapping
      // the post-await state updates in another transition.
      taskFn(abortController.signal)
        .then((result) => {
          clearTimeout(timeoutId);
          startTransition(() => {
            setTaskState({ status: "success", data: result });
          });
          options?.onSuccess?.(result);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          const isTimeout =
            err.name === "AbortError" || err.message === "TimeoutExceeded";

          startTransition(() => {
            setTaskState({
              status: "error",
              error: isTimeout
                ? new Error("Analysis took too long. Please try again.")
                : err,
              isTimeout,
            });
          });

          options?.onError?.(err);
        });
    },
    [isPending, timeoutMs, options],
  );

  return {
    isPending,
    taskState,
    executeTask,
  };
}
