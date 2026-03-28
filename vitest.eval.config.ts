import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/__tests__/eval/**/*.eval.test.{ts,tsx}"],
    testTimeout: 120000, // 2 minutes timeout for LLM stochastic testing
    pool: "forks",
    reporters: ["default", "html"],
  },
});
