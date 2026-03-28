import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { DashboardExtensions } from "../../components/DashboardExtensions";

// Mock child components to isolate tests
vi.mock("../../components/FakeDoorMetrics", () => ({
  FakeDoorMetrics: () => <div data-testid="fake-door-metrics" />,
}));

vi.mock("../../components/SuggestionFeed", () => ({
  SuggestionFeed: () => <div data-testid="suggestion-feed" />,
}));

vi.mock("../../components/CapabilityGapDashboard", () => ({
  CapabilityGapDashboard: () => <div data-testid="capability-gap-dashboard" />,
}));

vi.mock("../../components/VisualSyncModal", () => ({
  VisualSyncModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="visual-sync-modal" /> : null,
}));

vi.mock("../../components/DeploymentWizardModal", () => ({
  DeploymentWizardModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="deployment-wizard-modal" /> : null,
}));

const mockProductData = {
  name: "My App",
  description: "A great app",
  targetAudience: "Everyone",
  valueProposition: "It works",
  targetRegions: [],
  strategy: [],
  features: [],
};

const mockInsights = [
  {
    id: "1",
    title: "Insight 1",
    description: "Desc 1",
    source: "Market" as any,
    category: "trend" as any,
    impact: "high" as any,
    timestamp: "now",
    relevanceScore: 90,
  },
];

const mockCompetitors = [];

describe("DashboardExtensions", () => {
  it("renders child components", () => {
    const setProductData = vi.fn();
    render(
      <DashboardExtensions
        productData={mockProductData}
        setProductData={setProductData}
        insights={mockInsights}
        competitors={mockCompetitors}
      />,
    );

    expect(screen.getByTestId("fake-door-metrics")).toBeInTheDocument();
    expect(screen.getByTestId("suggestion-feed")).toBeInTheDocument();
    expect(screen.getByTestId("capability-gap-dashboard")).toBeInTheDocument();
  });

  it("opens Visual Sync modal on button click", async () => {
    const user = userEvent.setup();
    const setProductData = vi.fn();
    render(
      <DashboardExtensions
        productData={mockProductData}
        setProductData={setProductData}
        insights={mockInsights}
        competitors={mockCompetitors}
      />,
    );

    expect(screen.queryByTestId("visual-sync-modal")).not.toBeInTheDocument();

    const visualSyncBtn = screen.getByText(/Visual Sync/i);
    await user.click(visualSyncBtn);

    expect(screen.getByTestId("visual-sync-modal")).toBeInTheDocument();
  });

  it("opens Deployment Wizard modal on button click", async () => {
    const user = userEvent.setup();
    const setProductData = vi.fn();
    render(
      <DashboardExtensions
        productData={mockProductData}
        setProductData={setProductData}
        insights={mockInsights}
        competitors={mockCompetitors}
      />,
    );

    expect(
      screen.queryByTestId("deployment-wizard-modal"),
    ).not.toBeInTheDocument();

    const deployBtn = screen.getByText(/Deploy Smoke Test/i);
    await user.click(deployBtn);

    expect(screen.getByTestId("deployment-wizard-modal")).toBeInTheDocument();
  });
});
