import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    isolate: true,
    pool: "threads",
    testTimeout: 15000,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "e2e/**",
        "e2e/**/*",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/firebase.ts",
        "src/types.ts",
        "src/App.tsx",
        "src/components/InsightBrainstormChat.tsx",
        "src/components/InsightBrainstormModal.tsx",
        "src/components/InsightGeneratorModal.tsx",
        "src/components/InsightQuestModal.tsx",
        "src/components/FhibliUI.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
