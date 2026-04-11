import { defineConfig, coverageConfigDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import { getSafePoolOptions } from "./scripts/test-utils/vitest-scaling";

export default defineConfig({
  plugins: [react()],
  test: {
    ...getSafePoolOptions(),
    environment: "jsdom",
    environmentMatchGlobs: [
      // Run non-UI tests in the much faster, lower-memory node environment
      ["src/__tests__/server/**/*.test.{ts,tsx}", "node"],
      ["src/__tests__/utils/**/*.test.{ts,tsx}", "node"],
      ["src/__tests__/firestore/**/*.test.{ts,tsx}", "node"],
      ["src/__tests__/workers/**/*.test.{ts,tsx}", "node"],
      ["scripts/openspec-cli/__tests__/**/*.test.{ts,tsx}", "node"],
    ],
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    testTimeout: 30000,
    include: [
      "src/**/*.test.{ts,tsx}",
      "scripts/openspec-cli/__tests__/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      all: true,
      include: [
        "scripts/openspec-cli/**/*.ts"
      ],
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
