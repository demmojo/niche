import { defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
  test: {
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
