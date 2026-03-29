import { defineConfig, coverageConfigDefaults } from "vitest/config";
import { getSafePoolOptions } from "./scripts/test-utils/vitest-scaling";

export default defineConfig({
  test: {
    ...getSafePoolOptions(),
    environment: "node",
    globals: true,
    include: ["scripts/openspec-cli/__tests__/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["scripts/openspec-cli/**/*.{ts,tsx}"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "scripts/openspec-cli/__tests__/**",
      ],
      thresholds: {
        lines: 56,
        functions: 83,
        branches: 73,
        statements: 56,
      },
    },
  },
});
