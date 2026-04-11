export async function fetchTokenResiliently(
  user: any,
  signal?: AbortSignal,
): Promise<string> {
  const CIRCUIT_BREAKER_MS = 5000;
  const startTime = Date.now();
  let attempt = 0;

  while (true) {
    if (signal?.aborted) {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    }

    const elapsed = Date.now() - startTime;
    if (elapsed >= CIRCUIT_BREAKER_MS) {
      throw new Error("Circuit breaker timeout exceeded");
    }

    let abortListener: (() => void) | undefined;
    let timer: NodeJS.Timeout | undefined;

    try {
      const token = await Promise.race([
        user.getIdToken(),
        new Promise<never>((_, reject) => {
          if (signal) {
            abortListener = () => {
              const err = new Error("aborted");
              err.name = "AbortError";
              reject(err);
            };
            signal.addEventListener("abort", abortListener, { once: true });
          }
          const remaining = CIRCUIT_BREAKER_MS - (Date.now() - startTime);
          timer = setTimeout(
            () => reject(new Error("Circuit breaker timeout exceeded")),
            remaining,
          );
        }),
      ]);

      if (signal && abortListener) {
        signal.removeEventListener("abort", abortListener);
      }
      clearTimeout(timer);

      return token;
    } catch (error: any) {
      if (signal && abortListener) {
        signal.removeEventListener("abort", abortListener);
      }
      clearTimeout(timer);

      if (
        error.message === "aborted" ||
        error.message === "Circuit breaker timeout exceeded"
      ) {
        throw error;
      }

      attempt++;
      const backoffMs = 500 * Math.pow(2, attempt - 1);
      const remaining = CIRCUIT_BREAKER_MS - (Date.now() - startTime);

      if (backoffMs >= remaining) {
        // Sleep until circuit breaker timeout
        await new Promise<void>((_, reject) => {
          let timer: NodeJS.Timeout;
          const abortHandler = () => {
            clearTimeout(timer);
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          };
          if (signal) {
            signal.addEventListener("abort", abortHandler, { once: true });
          }
          timer = setTimeout(() => {
            if (signal) signal.removeEventListener("abort", abortHandler);
            reject(new Error("Circuit breaker timeout exceeded"));
          }, remaining);
        });
      } else {
        // Sleep for backoff duration
        await new Promise<void>((resolve, reject) => {
          let timer: NodeJS.Timeout;
          const abortHandler = () => {
            clearTimeout(timer);
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          };
          if (signal) {
            signal.addEventListener("abort", abortHandler, { once: true });
          }
          timer = setTimeout(() => {
            if (signal) signal.removeEventListener("abort", abortHandler);
            resolve();
          }, backoffMs);
        });
      }
    }
  }
}
