// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerativeErrorBoundary } from "../../../components/ErrorBoundary/GenerativeErrorBoundary";

// A component that intentionally throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test generative error");
  }
  return <div>Safe Content</div>;
};

describe("GenerativeErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error in tests to avoid noisy output for expected errors
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when there is no error", () => {
    render(
      <GenerativeErrorBoundary>
        <ThrowError shouldThrow={false} />
      </GenerativeErrorBoundary>,
    );
    expect(screen.getByText("Safe Content")).toBeDefined();
  });

  it("renders fallback UI when an error is thrown", () => {
    render(
      <GenerativeErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GenerativeErrorBoundary>,
    );

    expect(screen.getByText("Streaming Error")).toBeDefined();
    expect(screen.getByText("Test generative error")).toBeDefined();
    // Safe content should not be rendered
    expect(screen.queryByText("Safe Content")).toBeNull();
  });

  it("allows resetting the error state", () => {
    const { rerender } = render(
      <GenerativeErrorBoundary>
        <ThrowError shouldThrow={true} />
      </GenerativeErrorBoundary>,
    );

    expect(screen.getByText("Streaming Error")).toBeDefined();

    // To properly test the "Try Again" functionality we need to swap out the throwing component
    // otherwise it will just immediately throw again
    rerender(
      <GenerativeErrorBoundary>
        <ThrowError shouldThrow={false} />
      </GenerativeErrorBoundary>,
    );

    // Click try again
    fireEvent.click(screen.getByText("Try Again"));

    // Now it should show safe content
    expect(screen.getByText("Safe Content")).toBeDefined();
    expect(screen.queryByText("Streaming Error")).toBeNull();
  });
});
