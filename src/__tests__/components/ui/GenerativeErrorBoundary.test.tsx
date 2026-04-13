import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GenerativeErrorBoundary } from "../../../components/ui/GenerativeErrorBoundary";

describe("GenerativeErrorBoundary", () => {
  it("should render children when there is no error", () => {
    render(
      <GenerativeErrorBoundary stopStream={() => {}}>
        <div>Safe content</div>
      </GenerativeErrorBoundary>,
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("should render fallback UI and call stopStream when an error occurs", () => {
    const stopStreamMock = vi.fn();

    const ErrorComponent = () => {
      throw new Error("Simulated rendering crash");
    };

    // Suppress console.error for the intentional throw
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <GenerativeErrorBoundary stopStream={stopStreamMock}>
        <ErrorComponent />
      </GenerativeErrorBoundary>,
    );

    // Should call stopStream to stop token hemorrhaging
    expect(stopStreamMock).toHaveBeenCalledTimes(1);

    // Should render a fallback
    expect(screen.getByText(/Error rendering generation/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
