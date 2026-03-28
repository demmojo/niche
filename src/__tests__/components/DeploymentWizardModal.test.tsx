import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { DeploymentWizardModal } from "../../components/DeploymentWizardModal";

const mockProductData = {
  name: "Test App",
  description: "A great app",
  targetAudience: "Everyone",
  valueProposition: "It works",
  features: [],
};

describe("DeploymentWizardModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render when closed", () => {
    const onClose = vi.fn();
    const { container } = render(
      <DeploymentWizardModal
        isOpen={false}
        onClose={onClose}
        myProductData={mockProductData}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders initial oauth step when open", () => {
    const onClose = vi.fn();
    render(
      <DeploymentWizardModal
        isOpen={true}
        onClose={onClose}
        myProductData={mockProductData}
      />,
    );

    expect(
      screen.getByText(/Connect your Cloudflare Account/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect with Cloudflare/i }),
    ).toBeInTheDocument();
  });

  it("progresses through deployment steps when connected", async () => {
    const onClose = vi.fn();
    render(
      <DeploymentWizardModal
        isOpen={true}
        onClose={onClose}
        myProductData={mockProductData}
      />,
    );

    const connectBtn = screen.getByRole("button", {
      name: /Connect with Cloudflare/i,
    });
    fireEvent.click(connectBtn);

    expect(screen.getByText(/Connecting\.\.\./i)).toBeInTheDocument();

    // Fast-forward past the 2s timeout for connection
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // Should be on the deploying step
    expect(screen.getByText(/Deployment Checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Securing domain/i)).toBeInTheDocument();

    // Fast-forward through deployment intervals (4 steps * 2s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000);
    });

    // Should be on the success step
    expect(screen.getByText(/Deployed Successfully!/i)).toBeInTheDocument();

    const liveLink = screen.getByText(/Visit live site/i);
    expect(liveLink).toHaveAttribute("href", "https://test-app.pages.dev");
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <DeploymentWizardModal
        isOpen={true}
        onClose={onClose}
        myProductData={mockProductData}
      />,
    );

    // Find the close button (the X icon button in the header)
    const closeButtons = screen.getAllByRole("button");
    const closeButton = closeButtons[0]; // The X button is the first one

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
