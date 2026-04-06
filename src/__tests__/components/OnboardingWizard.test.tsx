import React from "react";
import { fireEvent, render, screen, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OnboardingWizard } from "../../components/OnboardingWizard";
import { useAuth } from "../../components/AuthProvider";
import { setDoc } from "firebase/firestore";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  setDoc: vi.fn(),
  doc: vi.fn(() => "mock-doc-ref"),
}));

vi.mock("../../firebase", () => ({
  auth: {},
  db: {},
}));

// Mock react-dom useFormStatus
vi.mock("react-dom", () => ({
  ...vi.importActual("react-dom"),
  useFormStatus: () => ({ pending: false }),
}));

vi.mock("../../components/TrustBuilderScreen", () => ({
  TrustBuilderScreen: ({ ideaPayload, onComplete }: any) => (
    <div data-testid="mock-trust-builder">
      <button
        onClick={() =>
          onComplete({
            isTarpit: true,
            suggestedNiches: ["A better niche CRM"],
          })
        }
      >
        Complete Trust Builder
      </button>
    </div>
  ),
}));

vi.mock("../../components/URLTeaserScreen", () => ({
  URLTeaserScreen: ({ url, onComplete }: any) => (
    <div data-testid="url-teaser-screen">
      <button
        onClick={() => onComplete({ orthogonal_pivots: ["Pivot from URL"] })}
      >
        Complete URL Teaser
      </button>
    </div>
  ),
}));

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { uid: "123", isAnonymous: false },
    });
  });

  it("renders intent selection by default", () => {
    render(<OnboardingWizard onComplete={vi.fn()} />);
    expect(screen.getByText("Welcome to NicheAI")).toBeInTheDocument();
    expect(screen.getByText("I'm a Founder")).toBeInTheDocument();
    expect(screen.getByText("I'm a Product Manager")).toBeInTheDocument();
    expect(screen.getByText("I have a Website")).toBeInTheDocument();
  });

  it("transitions to founder input on clicking I'm a Founder", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={vi.fn()} />);

    await user.click(screen.getByText("I'm a Founder"));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Category (e.g. CRM)"),
      ).toBeInTheDocument();
    });

    // verify setDoc was called with persona
    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { persona: "solo_founder" },
      { merge: true },
    );
  });

  it("transitions to PM input on clicking I'm a Product Manager", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={vi.fn()} />);

    await user.click(screen.getByText("I'm a Product Manager"));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          "Which competitor or market do you want to analyze?",
        ),
      ).toBeInTheDocument();
    });

    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { persona: "enterprise_pm" },
      { merge: true },
    );
  });

  it("shows error if form is submitted empty", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={vi.fn()} />);

    await user.click(screen.getByText("I have a Website"));

    const form = screen
      .getByPlaceholderText("Paste a website URL (e.g. https://...)")
      .closest("form");
    fireEvent.submit(form!);

    expect(
      await screen.findByText("Please fill out all required fields."),
    ).toBeInTheDocument();
  });

  it("submits the URL form successfully", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={vi.fn()} />);

    await user.click(screen.getByText("I have a Website"));
    const input = screen.getByPlaceholderText(
      "Paste a website URL (e.g. https://...)",
    );
    await user.type(input, "https://example.com");
    const form = input.closest("form");
    fireEvent.submit(form!);

    // Should move to analyzing step, which renders URLTeaserScreen
    const teaser = await screen.findByTestId("url-teaser-screen");
    expect(teaser).toBeInTheDocument();

    await user.click(screen.getByText("Complete URL Teaser"));
    expect(await screen.findByText("Your Validated Idea")).toBeInTheDocument();
  });

  it("submits the Founder form successfully and completes flow", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingWizard onComplete={onComplete} />);

    await user.click(screen.getByText("I'm a Founder"));

    const catInput = screen.getByPlaceholderText("Category (e.g. CRM)");
    const audInput = screen.getByPlaceholderText("Audience (e.g. Plumbers)");
    const probInput = screen.getByPlaceholderText("Problem (e.g. scheduling)");
    const chanInput = screen.getByPlaceholderText("Channel (e.g. cold email)");

    await user.type(catInput, "App");
    await user.type(audInput, "Users");
    await user.type(probInput, "Issues");
    await user.type(chanInput, "Ads");

    await user.click(screen.getByRole("button", { name: "Validate Niche" }));

    const builder = await screen.findByTestId("mock-trust-builder");
    expect(builder).toBeInTheDocument();

    await user.click(screen.getByText("Complete Trust Builder"));

    expect(
      await screen.findByText("Tarpit Detected: Pivot Recommended"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Proceed with Pivot" }),
    );

    expect(onComplete).toHaveBeenCalled();
  });
});
