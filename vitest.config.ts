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
    ],
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    testTimeout: 30000,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "e2e/**",
        "e2e/**/*",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/firebase.ts",
        "src/types.ts",
        "src/App.tsx",
        "src/components/**",
        "src/store/**",
        "src/server/workers/**",
        "src/workers/**",
        "src/components/InsightBrainstormChat.tsx",
        "src/components/InsightBrainstormModal.tsx",
        "src/components/InsightGeneratorModal.tsx",
        "src/components/InsightQuestModal.tsx",
        "src/components/FhibliUI.tsx",
      ],
      reporter: ["text", "json-summary"],
      ignoreEmptyLines: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
