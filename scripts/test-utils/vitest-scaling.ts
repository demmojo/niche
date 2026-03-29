import os from "node:os";
import type { UserConfig } from "vitest/config";

/**
 * Calculates a safe pool allocation for Vitest based on the environment and hardware limits.
 * Protects local IDEs from OOM crashes by severely bounding workers, and sets strict limits for CI.
 */
export function getSafePoolOptions(): UserConfig["test"] {
  const isCI = !!process.env.CI;

  // Local: Leave 1 core for the OS/IDE, max out at 3 to prevent crashes.
  // CI: Fallback to 2 (standard GHA) unless explicitly overridden by CI config
  const maxForks = isCI
    ? Number(process.env.VITEST_MAX_WORKERS || 2)
    : Math.min(3, Math.max(1, os.cpus().length - 1));

  return {
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks,
        isolate: true, // Requires --expose-gc flag down below to not leak memory
        execArgv: ["--expose-gc"],
      },
    },
  };
}
