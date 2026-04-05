import React from "react";
import { render, screen } from "@testing-library/react";
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
} from "../../components/WorkspaceProvider";

const TestComponent = () => {
  const workspaceId = useWorkspace();
  const setWorkspaceId = useWorkspaceDispatch();
  const isLoading = useWorkspaceLoading();

  return (
    <div>
      <div data-testid="workspaceId">{workspaceId}</div>
      <div data-testid="isLoading">{isLoading ? "true" : "false"}</div>
      <button onClick={() => setWorkspaceId("test-id-1")}>Set Workspace</button>
    </div>
  );
};

const ErrorComponent = () => {
  useWorkspace();
  return <div>Should not render</div>;
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
    expect(screen.getByTestId("isLoading")).toHaveTextContent("false"); // Default is false since it finishes loading immediately
  });

  it("updates context values when dispatch functions are called", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <TestComponent />
      </WorkspaceProvider>,
    );

    await user.click(screen.getByText("Set Workspace"));
    expect(screen.getByTestId("workspaceId")).toHaveTextContent("test-id-1");
  });

  it("throws an error when used outside of WorkspaceProvider", () => {
    // Suppress console.error for expected throw to keep test output clean
    const consoleSpy = vi.spyOn(console, "error");
    consoleSpy.mockImplementation(() => {});

    expect(() => render(<ErrorComponent />)).toThrow(
      "useWorkspace must be used within a WorkspaceProvider",
    );

    consoleSpy.mockRestore();
  });
});
