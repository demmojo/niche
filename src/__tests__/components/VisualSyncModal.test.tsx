import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { VisualSyncModal } from "../../components/VisualSyncModal";

const mockProductData = {
  name: "My App",
  description: "A great app",
  targetAudience: "Everyone",
  valueProposition: "It works",
  targetRegions: [],
  strategy: [],
  features: [],
};

describe("VisualSyncModal", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("does not render when closed", () => {
    const onClose = vi.fn();
    const setMyProductData = vi.fn();
    const { container } = render(
      <VisualSyncModal
        isOpen={false}
        onClose={onClose}
        myProductData={mockProductData}
        setMyProductData={setMyProductData}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders upload step initially when open", () => {
    const onClose = vi.fn();
    const setMyProductData = vi.fn();
    render(
      <VisualSyncModal
        isOpen={true}
        onClose={onClose}
        myProductData={mockProductData}
        setMyProductData={setMyProductData}
      />,
    );

    expect(screen.getByText(/Visual Sync Engine/i)).toBeInTheDocument();
    expect(screen.getByText("Upload Screenshot")).toBeInTheDocument();
  });

  it("processes image upload and shows proposed updates", async () => {
    // Mock successful fetch for image processing
    (global.fetch as any).mockResolvedValue({
      /**
       *
       */
      json: () =>
        Promise.resolve({
          proposedUpdates: [
            {
              featureName: "Sidebar Navigation",
              reason: "Found sidebar in UI",
              proposedStatus: "live",
            },
          ],
        }),
    });

    const user = userEvent.setup();
    const onClose = vi.fn();
    const setMyProductData = vi.fn();

    const { container } = render(
      <VisualSyncModal
        isOpen={true}
        onClose={onClose}
        myProductData={mockProductData}
        setMyProductData={setMyProductData}
      />,
    );

    // Mock file upload
    const file = new File(["hello"], "hello.png", { type: "image/png" });

    // Create a mock FileReader to instantly trigger the loadend event
    const mockFileReader = {
      readAsDataURL: vi.fn(function () {
        this.result = "data:image/png;base64,hello";
        this.onloadend();
      }),
      onloadend: vi.fn(),
    };
    global.FileReader = vi.fn(() => mockFileReader) as any;

    const input = container.querySelector('input[type="file"]');
    if (input) {
      await user.upload(input as HTMLElement, file);
    }

    // Should now be on reality-check step
    await waitFor(() => {
      expect(screen.getByText(/Reality Check Diff/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Sidebar Navigation")).toBeInTheDocument();
    expect(screen.getByText("Found sidebar in UI")).toBeInTheDocument();

    // Click apply button
    const applyBtn = screen.getByRole("button", {
      name: /Apply Sync Updates/i,
    });
    await user.click(applyBtn);

    // Should call setMyProductData and onClose
    expect(setMyProductData).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const setMyProductData = vi.fn();

    render(
      <VisualSyncModal
        isOpen={true}
        onClose={onClose}
        myProductData={mockProductData}
        setMyProductData={setMyProductData}
      />,
    );

    const closeBtn = screen.getAllByRole("button")[0]; // First button is close (X)
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
