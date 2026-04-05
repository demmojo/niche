import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "../../../src/components/AuthProvider";

vi.mock("../../../src/components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

import {
  WorkspaceProvider,
  useWorkspace,
  useWorkspaceDispatch,
  useWorkspaceLoading,
  useInsights,
  useInsightsDispatch,
} from "../../components/WorkspaceProvider";

const TestComponent = () => {
  const workspaceId = useWorkspace();
  const setWorkspaceId = useWorkspaceDispatch();
  const isLoading = useWorkspaceLoading();
  const insights = useInsights();
  const dispatchInsights = useInsightsDispatch();

  return (
    <div>
      <div data-testid="workspaceId">{workspaceId}</div>
      <div data-testid="isLoading">{isLoading ? "true" : "false"}</div>
      <div data-testid="insights-count">{insights.length}</div>
      <div data-testid="insights-content">
        {insights.map((i) => (
          <span key={i.id}>{i.content}</span>
        ))}
      </div>
      <button onClick={() => setWorkspaceId("test-id-1")}>Set Workspace</button>
      <button
        onClick={() =>
          dispatchInsights({
            type: "ADD_INSIGHT",
            insight: { id: "1", type: "insight", content: "test insight" },
          })
        }
      >
        Add Insight
      </button>
      <button
        onClick={() => dispatchInsights({ type: "REMOVE_INSIGHT", id: "1" })}
      >
        Remove Insight
      </button>
    </div>
  );
};

describe("WorkspaceProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { uid: "test-user" } });
  });

  it("provides default state correctly", () => {
    render(
      <WorkspaceProvider>
        <TestComponent />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId("workspaceId")).toHaveTextContent("");
    expect(screen.getByTestId("isLoading")).toHaveTextContent("false");
    expect(screen.getByTestId("insights-count")).toHaveTextContent("0");
  });

  it("updates workspace context values when dispatch functions are called", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <TestComponent />
      </WorkspaceProvider>,
    );

    await user.click(screen.getByText("Set Workspace"));
    expect(screen.getByTestId("workspaceId")).toHaveTextContent("test-id-1");
  });

  it("adds and removes insights via dispatch", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <TestComponent />
      </WorkspaceProvider>,
    );

    await user.click(screen.getByText("Add Insight"));
    expect(screen.getByTestId("insights-count")).toHaveTextContent("1");
    expect(screen.getByTestId("insights-content")).toHaveTextContent(
      "test insight",
    );

    await user.click(screen.getByText("Remove Insight"));
    expect(screen.getByTestId("insights-count")).toHaveTextContent("0");
  });
});
