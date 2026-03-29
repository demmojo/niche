import { defineConfig } from "vitest/config";
import { getSafePoolOptions } from "./scripts/test-utils/vitest-scaling";

export default defineConfig({
  test: {
    ...getSafePoolOptions(),
    environment: "node",
    include: ["src/__tests__/eval/**/*.eval.test.{ts,tsx}"],
    testTimeout: 120000, // 2 minutes timeout for LLM stochastic testing
    reporters: ["default", "html"],
  },
});
