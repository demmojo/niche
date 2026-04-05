import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FounderWorkspace } from "../../components/FounderWorkspace";
import { useFounderActiveProductId } from "../../components/FounderProvider";

vi.mock("../../components/FounderProvider", () => ({
  useFounderActiveProductId: vi.fn(() => "test-product-id"),
  useFounderProducts: vi.fn(() => []),
  useFounderActiveProductDispatch: vi.fn(() => vi.fn()),
}));

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(() => ({ user: { uid: "123" } })),
}));

vi.mock("../../hooks/useTaxonomySync", () => ({
  useTaxonomySync: vi.fn(() => ({
    displayTaxonomy: [],
    evaluationStatus: null,
    mergeFeatures: vi.fn(),
  })),
}));

vi.mock("../../hooks/useSyncQueue", () => ({
  useSyncQueue: vi.fn(() => ({
    syncQueue: [],
    syncStatus: "idle",
    isReviewModalOpen: false,
    setReviewModalOpen: vi.fn(),
    dismissSync: vi.fn(),
  })),
}));

vi.mock("../../hooks/useSafeAITask", () => ({
  useSafeAITask: vi.fn(() => ({
    runAITask: vi.fn(),
    isExecuting: false,
    error: null,
  })),
}));

vi.mock("../../hooks/useActionCredits", () => ({
  useActionCredits: vi.fn(() => ({
    actionCredits: 100,
    isLoading: false,
    deductActionCredits: vi.fn(),
  })),
}));

vi.mock("../../store/visualKnowledgeStore", () => ({
  useVisualKnowledgeStore: vi.fn(() => ({ nodes: [], edges: [] })),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
}));

vi.mock("../../firebase", () => ({
  db: {},
  auth: {},
  safeDisableNetwork: vi.fn(),
}));

// Mock all child components to avoid huge rendering trees
vi.mock("../../components/DashboardExtensions", () => ({
  DashboardExtensions: () => <div data-testid="dashboard-extensions" />,
}));
vi.mock("../../components/InsightEngineChat", () => ({
  InsightEngineChat: () => <div data-testid="insight-engine-chat" />,
}));
vi.mock("../../components/CompetitorDiscoveryModal", () => ({
  CompetitorDiscoveryModal: () => (
    <div data-testid="competitor-discovery-modal" />
  ),
}));
vi.mock("../../components/ZeroFrictionEntry", () => ({
  ZeroFrictionEntry: () => <div data-testid="zero-friction-entry" />,
}));
vi.mock("../../components/JsonViewer", () => ({
  JsonViewer: () => <div data-testid="json-viewer" />,
}));
vi.mock("../../components/DataSourceCard", () => ({
  DataSourceCard: () => <div data-testid="data-source-card" />,
}));
vi.mock("../../components/InsightQuestModal", () => ({
  InsightQuestModal: () => <div data-testid="insight-quest-modal" />,
}));
vi.mock("../../components/InsightGeneratorModal", () => ({
  InsightGeneratorModal: () => <div data-testid="insight-generator-modal" />,
}));
vi.mock("../../components/lens/LensStrategyConsole", () => ({
  default: () => <div data-testid="lens-strategy-console" />,
}));
vi.mock("../../components/whiteboard/VisualWhiteboard", () => ({
  VisualWhiteboard: () => <div data-testid="visual-whiteboard" />,
}));
vi.mock("../../components/StrategyToolbox", () => ({
  StrategyToolbox: () => <div data-testid="strategy-toolbox" />,
}));
vi.mock("../../components/Settings", () => ({
  Settings: () => <div data-testid="settings" />,
}));
vi.mock("../../components/MarketShiftBanner", () => ({
  MarketShiftBanner: () => <div data-testid="market-shift-banner" />,
}));
vi.mock("../../components/ComputeMeter", () => ({
  ComputeMeter: () => <div data-testid="compute-meter" />,
}));
vi.mock("../../components/TarpitWarningModal", () => ({
  TarpitWarningModal: () => <div data-testid="tarpit-warning-modal" />,
}));
vi.mock("../../components/SupportHelpPage", () => ({
  SupportHelpPage: () => <div data-testid="support-help-page" />,
}));
vi.mock("../../components/SuperadminDashboard", () => ({
  SuperadminDashboard: () => <div data-testid="superadmin-dashboard" />,
}));
vi.mock("../../components/DLQViewer", () => ({
  DLQViewer: () => <div data-testid="dlq-viewer" />,
}));
vi.mock("../../components/LimitReachedModal", () => ({
  LimitReachedModal: () => <div data-testid="limit-reached-modal" />,
}));
vi.mock("../../components/RateLimitModal", () => ({
  RateLimitModal: () => <div data-testid="rate-limit-modal" />,
}));
vi.mock("../../components/MarketValueNotebook", () => ({
  MarketValueNotebook: () => <div data-testid="market-value-notebook" />,
}));
vi.mock("../../components/RapidPdlcWorkflow", () => ({
  RapidPdlcWorkflow: () => <div data-testid="rapid-pdlc-workflow" />,
}));
vi.mock("../../components/DataPointsTable", () => ({
  DataPointsTable: () => <div data-testid="data-points-table" />,
}));
vi.mock("../../components/HeadToHeadComparison", () => ({
  HeadToHeadComparison: () => <div data-testid="head-to-head-comparison" />,
}));
vi.mock("../../components/ideation/UnifiedIdeationEngine", () => ({
  UnifiedIdeationEngine: () => <div data-testid="unified-ideation-engine" />,
}));
vi.mock("../../components/PivotSimulator", () => ({
  PivotSimulator: () => <div data-testid="pivot-simulator" />,
}));
vi.mock("../../components/MyProduct", () => ({
  MyProduct: () => <div data-testid="my-product" />,
}));
vi.mock("../../components/InsightBrainstormModal", () => ({
  InsightBrainstormModal: () => <div data-testid="insight-brainstorm-modal" />,
}));
vi.mock("../../components/PageGuideModal", () => ({
  PageGuideModal: () => <div data-testid="page-guide-modal" />,
}));
vi.mock("../../components/UploadDataModal", () => ({
  UploadDataModal: () => <div data-testid="upload-data-modal" />,
}));
vi.mock("../../components/ConsolidateFeaturesModal", () => ({
  ConsolidateFeaturesModal: () => (
    <div data-testid="consolidate-features-modal" />
  ),
}));
vi.mock("../../components/TaxonomyMergeModal", () => ({
  TaxonomyMergeModal: () => <div data-testid="taxonomy-merge-modal" />,
}));
vi.mock("../../components/GlobalProgressBanner", () => ({
  GlobalProgressBanner: () => <div data-testid="global-progress-banner" />,
}));
vi.mock("../../components/Tooltip", () => ({
  Tooltip: () => <div data-testid="tooltip" />,
}));
vi.mock("../../components/ExportButton", () => ({
  default: () => <div data-testid="export-button" />,
}));
vi.mock("../../components/ProductSwitcher", () => ({
  ProductSwitcher: () => <div data-testid="product-switcher" />,
}));
vi.mock("../../components/SyncReviewModal", () => ({
  SyncReviewModal: () => <div data-testid="sync-review-modal" />,
}));
vi.mock("../../components/WorkspaceProvider", () => ({
  WorkspaceProvider: ({ children }: any) => (
    <div data-testid="workspace-provider">{children}</div>
  ),
  useWorkspace: vi.fn(() => ({})),
  useWorkspaceDispatch: vi.fn(() => vi.fn()),
  useWorkspaceLoading: vi.fn(() => false),
}));
vi.mock("../../components/useSuperadminBootstrap", () => ({
  useSuperadminBootstrap: vi.fn(),
}));

// Render Recharts components as simple divs
vi.mock("recharts", () => ({
  Radar: () => <div data-testid="recharts-radar" />,
  RadarChart: () => <div data-testid="recharts-radarchart" />,
  PolarGrid: () => <div data-testid="recharts-polargrid" />,
  PolarAngleAxis: () => <div data-testid="recharts-polarangleaxis" />,
  PolarRadiusAxis: () => <div data-testid="recharts-polarradiusaxis" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="recharts-responsivecontainer">{children}</div>
  ),
  Tooltip: () => <div data-testid="recharts-tooltip" />,
  ScatterChart: () => <div data-testid="recharts-scatterchart" />,
  Scatter: () => <div data-testid="recharts-scatter" />,
  XAxis: () => <div data-testid="recharts-xaxis" />,
  YAxis: () => <div data-testid="recharts-yaxis" />,
  CartesianGrid: () => <div data-testid="recharts-cartesiangrid" />,
  ZAxis: () => <div data-testid="recharts-zaxis" />,
  ReferenceLine: () => <div data-testid="recharts-referenceline" />,
  Label: () => <div data-testid="recharts-label" />,
}));

describe("FounderWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub global localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it("covers the huge hardcoded data by rendering as superadmin for prod-kageform", () => {
    (useFounderActiveProductId as any).mockReturnValue("prod-kageform");
    render(
      <FounderWorkspace
        user={{ uid: "123", email: "mo.hassaniv@gmail.com" }}
        isSuperadmin={true}
      />,
    );

    expect(screen.getByText("NicheAI")).toBeInTheDocument();
  });

  it("switches tabs correctly", () => {
    const { fireEvent } = require("@testing-library/react");
    render(<FounderWorkspace user={{ uid: "123" }} isSuperadmin={false} />);

    expect(screen.getByTestId("pivot-simulator")).toBeInTheDocument();

    // Switch to Rapid PDLC
    const pdlcTab = screen.getByText("Rapid PDLC");
    fireEvent.click(pdlcTab);

    expect(screen.getByTestId("rapid-pdlc-workflow")).toBeInTheDocument();
  });
});
