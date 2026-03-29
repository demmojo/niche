import React from "react";
import { render, screen, fireEvent } from "../../test-utils/render";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tMessage } from "../../content/dictionary";
import { Tooltip } from "../../components/Tooltip";

// Radix Tooltip mock
vi.mock("@radix-ui/react-tooltip", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  Root: ({ children }: any) => <>{children}</>,
  Trigger: ({ children }: any) => <>{children}</>,
  Portal: ({ children }: any) => <>{children}</>,
  Content: ({ children, "data-state": state = "open" }: any) => (
    <div data-testid="tooltip-content" data-state={state}>
      {children}
    </div>
  ),
  Arrow: () => null,
}));

describe("Tooltip Component", () => {
  it("renders trigger element correctly", () => {
    render(
      <Tooltip content={tMessage("Tooltip text")}>
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();

    // With Radix, the content is always rendered in the DOM, but typically hidden by CSS or state
    // Our mock renders it always. So we just verify it exists.
    expect(screen.getByTestId("tooltip-content")).toBeInTheDocument();
  });
});
