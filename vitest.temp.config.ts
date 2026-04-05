import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    testTimeout: 30000,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/components/SimulatedHighlight.tsx",
        "src/components/SimulatedHighlightText.tsx",
        "src/components/StrategyCanvas.tsx",
        "src/components/NodeGraphPipeline.tsx",
        "src/lib/utils.ts",
        "src/components/ZeroFrictionEntry.tsx",
        "src/components/WorkspaceProvider.tsx",
        "src/components/PageGuideModal.tsx",
        "src/components/PQLGateModal.tsx",
        "src/server/utils/anonymousUsage.ts",
      ],
      reporter: ["text"],
    },
  },
});
