import { render, screen } from "../../test-utils/render";
import { PivotSimulator } from "../../components/PivotSimulator";
import { FounderProvider } from "../../components/FounderProvider";
import { describe, it, expect, vi } from "vitest";

vi.mock("../../hooks/useUserProfile", () => ({
  useUserProfile: vi.fn().mockReturnValue({
    profile: {
      persona: "solo_founder",
      tier: "free",
    },
    loading: false,
    updateProfile: vi.fn(),
  }),
}));

// Mock the WorkspaceProvider context since FounderProvider depends on it
vi.mock("../../components/WorkspaceProvider", () => ({
  useWorkspace: vi.fn().mockReturnValue({
    workspaceId: "test-workspace-id",
    isLoading: false,
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual("framer-motion");
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
  Loader2: () => <div data-testid="icon-loader2" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  CheckCircle2: () => <div data-testid="icon-check" />,
  XCircle: () => <div data-testid="icon-x" />,
  Undo: () => <div data-testid="icon-undo" />,
  AlertCircle: () => <div data-testid="icon-alert" />,
  TrendingUp: () => <div data-testid="icon-trending" />,
  Target: () => <div data-testid="icon-target" />,
  Zap: () => <div data-testid="icon-zap" />,
  X: () => <div data-testid="icon-close" />,
  Lightbulb: () => <div data-testid="icon-lightbulb" />,
  CheckCircle: () => <div data-testid="icon-check" />,
  Brain: () => <div data-testid="icon-brain" />,
  RotateCcw: () => <div data-testid="icon-undo" />,
  MousePointerClick: () => <div data-testid="icon-mouse" />,
  Check: () => <div data-testid="icon-check" />,
}));

describe("PivotSimulator Component", () => {
  it("renders the Pivot Simulator correctly", async () => {
    render(
      <FounderProvider>
        <PivotSimulator />
      </FounderProvider>,
    );

    // Check if the title is rendered
    const elements = await screen.findAllByText("Decision Queue");
    expect(elements.length).toBeGreaterThan(0);
  });
});
