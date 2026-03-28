import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { RapidPdlcWorkflow } from "../../../src/components/RapidPdlcWorkflow";

// Mock the artifacts to avoid Suspense/React.lazy issues with fake timers
vi.mock("../../../src/components/ArtifactRenderer", () => {
  return {
    /**
     *
     */
    ArtifactRenderer: ({
      activeArtifact,
      features,
      onFeatureAccept,
      onFeatureReject,
      acceptedFeatures,
      onDeploy,
    }: any) => {
      if (!activeArtifact) return <div>[ WAITING FOR COPILOT COMMAND ]</div>;
      return (
        <div data-testid="mock-artifact-renderer">
          <div>Active Artifact: {activeArtifact}</div>
          {activeArtifact === "TinderForFeatures" && (
            <div>
              {features?.map((f: any) => (
                <div key={f.id}>
                  <span>{f.title}</span>
                  <button onClick={() => onFeatureAccept(f.id)}>Accept</button>
                  <button onClick={() => onFeatureReject(f.id)}>Reject</button>
                </div>
              ))}
            </div>
          )}
          {activeArtifact === "CodeViewer" && (
            <button onClick={onDeploy}>Deploy</button>
          )}
        </div>
      );
    },
  };
});

describe("RapidPdlcWorkflow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders initial chat message", () => {
    render(<RapidPdlcWorkflow />);
    expect(
      screen.getByText(/Welcome to the Niche Rapid PDLC Workflow/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Type a product idea/i),
    ).toBeInTheDocument();
  });

  it("progresses through the workflow steps", async () => {
    render(<RapidPdlcWorkflow />);

    const input = screen.getByPlaceholderText(/Type a product idea/i);
    const sendButton = input.nextElementSibling as HTMLButtonElement;

    // Step 1 -> 2: Send idea, get Competitor Matrix
    fireEvent.change(input, { target: { value: "A CRM for plumbers" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("A CRM for plumbers")).toBeInTheDocument();

    act(() => {
      vi.runAllTimers();
    });

    expect(
      screen.getByText(/I've analyzed the market for your idea/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Active Artifact: CompetitorMatrix"),
    ).toBeInTheDocument();

    // Step 2 -> 3: Send another message, get Tinder for Features
    fireEvent.change(input, { target: { value: "Generate features" } });
    fireEvent.click(sendButton);

    act(() => {
      vi.runAllTimers();
    });

    expect(
      screen.getByText(/Here are some hyper-niche feature recommendations/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Active Artifact: TinderForFeatures"),
    ).toBeInTheDocument();
    expect(screen.getByText("Automated Plumber Dispatch")).toBeInTheDocument();

    // Accept a feature
    const acceptButtons = screen.getAllByRole("button", { name: /accept/i });
    if (acceptButtons.length > 0) {
      fireEvent.click(acceptButtons[0]);
    }

    // Step 3 -> 4: Extract strategy
    fireEvent.change(input, { target: { value: "Done selecting" } });
    fireEvent.click(sendButton);

    act(() => {
      vi.runAllTimers();
    });

    expect(
      screen.getByText(/I've generated a SWOT and Opportunity Solution Tree/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Active Artifact: StrategyExtraction"),
    ).toBeInTheDocument();

    // Step 4 -> 5: Generate Code
    fireEvent.change(input, { target: { value: "Generate code" } });
    fireEvent.click(sendButton);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByText(/Code generated!/i)).toBeInTheDocument();
    expect(screen.getByText("Deploy")).toBeInTheDocument();

    // Click Deploy
    const deployButton = screen.getByText("Deploy");
    fireEvent.click(deployButton);

    expect(screen.getByText(/Deployment initiated/i)).toBeInTheDocument();
    expect(screen.getByText("Active Artifact: TerminalUI")).toBeInTheDocument();
  });
});
