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
  URLTeaserScreen: ({ url, onComplete, onCancel }: any) => (
    <div data-testid="url-teaser-screen">
      <button
        onClick={() => onComplete({ orthogonal_pivots: ["Pivot from URL"] })}
      >
        Complete URL Teaser
      </button>
      <button onClick={onCancel}>Cancel URL Teaser</button>
    </div>
  ),
}));

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (useAuth as any).mockReturnValue({
      user: { uid: "123", isAnonymous: false },
    });
    global.fetch = vi.fn();
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

    // verify setDoc was NOT called immediately
    expect(setDoc).not.toHaveBeenCalled();
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

    expect(setDoc).not.toHaveBeenCalled();
  });

  it("shows error if founder form is submitted empty", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard onComplete={vi.fn()} />);

    await user.click(screen.getByText("I'm a Founder"));

    // Remove required attributes to bypass browser validation and test component validation
    screen
      .getByPlaceholderText("Category (e.g. CRM)")
      .removeAttribute("required");
    screen
      .getByPlaceholderText("Audience (e.g. Plumbers)")
      .removeAttribute("required");
    screen
      .getByPlaceholderText("Problem (e.g. scheduling)")
      .removeAttribute("required");
    screen
      .getByPlaceholderText("Channel (e.g. cold email)")
      .removeAttribute("required");

    await user.click(screen.getByRole("button", { name: "Validate Niche" }));

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

    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { persona: "solo_founder" },
      { merge: true },
    );
    expect(onComplete).toHaveBeenCalled();
  });

  it("handles errors when setting persona on completion", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (setDoc as any).mockRejectedValueOnce(new Error("Firestore error"));

    render(<OnboardingWizard onComplete={vi.fn()} />);
    await user.click(screen.getByText("I'm a Founder"));

    await user.type(screen.getByPlaceholderText("Category (e.g. CRM)"), "App");
    await user.type(
      screen.getByPlaceholderText("Audience (e.g. Plumbers)"),
      "Users",
    );
    await user.type(
      screen.getByPlaceholderText("Problem (e.g. scheduling)"),
      "Issues",
    );
    await user.type(
      screen.getByPlaceholderText("Channel (e.g. cold email)"),
      "Ads",
    );

    await user.click(screen.getByRole("button", { name: "Validate Niche" }));

    await screen.findByTestId("mock-trust-builder");
    await user.click(screen.getByText("Complete Trust Builder"));

    await user.click(
      screen.getByRole("button", { name: "Proceed with Pivot" }),
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to set persona:",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("handles PM input flow, form errors, and successful fetch", async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        extracted_idea: "A new PM tool",
      }),
    });

    render(<OnboardingWizard onComplete={vi.fn()} />);
    await user.click(screen.getByText("I'm a Product Manager"));

    // Submit empty to trigger error
    const input = screen.getByPlaceholderText(
      "Which competitor or market do you want to analyze?",
    );
    input.removeAttribute("required");
    await user.click(screen.getByRole("button", { name: "Analyze" }));

    expect(
      await screen.findByText("Please fill out all required fields."),
    ).toBeInTheDocument();

    // Back out of error state
    await user.click(screen.getByRole("button", { name: "← Back" }));

    // Re-enter PM flow
    await user.click(screen.getByText("I'm a Product Manager"));

    // Now submit successfully
    const input2 = screen.getByPlaceholderText(
      "Which competitor or market do you want to analyze?",
    );
    await user.type(input2, "Jira competitor");
    await user.click(screen.getByRole("button", { name: "Analyze" }));

    const builder = await screen.findByTestId("mock-trust-builder");
    expect(builder).toBeInTheDocument();
  });

  it("handles API failure in PM flow", async () => {
    const user = userEvent.setup();
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    render(<OnboardingWizard onComplete={vi.fn()} />);
    await user.click(screen.getByText("I'm a Product Manager"));

    const input = screen.getByPlaceholderText(
      "Which competitor or market do you want to analyze?",
    );
    await user.type(input, "Jira competitor");
    await user.click(screen.getByRole("button", { name: "Analyze" }));

    // Note: OnboardingWizard itself doesn't fetch in handleAction anymore,
    // it delegates to TrustBuilderScreen. We just check if it gets there.
    const builder = await screen.findByTestId("mock-trust-builder");
    expect(builder).toBeInTheDocument();
  });

  it("can use the Proceed with Original Idea button on the pivoted screen", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingWizard onComplete={onComplete} />);

    await user.click(screen.getByText("I'm a Founder"));

    await user.type(screen.getByPlaceholderText("Category (e.g. CRM)"), "App");
    await user.type(
      screen.getByPlaceholderText("Audience (e.g. Plumbers)"),
      "Users",
    );
    await user.type(
      screen.getByPlaceholderText("Problem (e.g. scheduling)"),
      "Issues",
    );
    await user.type(
      screen.getByPlaceholderText("Channel (e.g. cold email)"),
      "Ads",
    );

    await user.click(screen.getByRole("button", { name: "Validate Niche" }));

    await screen.findByTestId("mock-trust-builder");
    await user.click(screen.getByText("Complete Trust Builder"));

    expect(
      await screen.findByText("Tarpit Detected: Pivot Recommended"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Proceed with Original Idea" }),
    );

    expect(onComplete).toHaveBeenCalled();
  });

  it("can cancel from the analyzing screen to go back to intent", async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard onComplete={vi.fn()} />);

    await user.click(screen.getByText("I have a Website"));

    const input = screen.getByPlaceholderText(
      "Paste a website URL (e.g. https://...)",
    );
    await user.type(input, "https://example.com");
    await user.click(screen.getByRole("button", { name: "Extract URL" }));

    await screen.findByTestId("url-teaser-screen");

    await user.click(screen.getByText("Cancel URL Teaser"));

    // Should return to intent selection
    expect(await screen.findByText("Welcome to NicheAI")).toBeInTheDocument();
  });
  it("can use the Start Over button on the pivoted screen", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<OnboardingWizard onComplete={onComplete} />);

    await user.click(screen.getByText("I have a Website"));

    const input = screen.getByPlaceholderText(
      "Paste a website URL (e.g. https://...)",
    );
    await user.type(input, "https://example.com");
    await user.click(screen.getByRole("button", { name: "Extract URL" }));

    await screen.findByTestId("url-teaser-screen");
    await user.click(screen.getByText("Complete URL Teaser"));

    expect(await screen.findByText("Your Validated Idea")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start Over" }));

    // Should return to intent selection
    expect(await screen.findByText("Welcome to NicheAI")).toBeInTheDocument();
  });

  it("can use the Edit my inputs button on the pivoted screen", async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard onComplete={vi.fn()} />);

    await user.click(screen.getByText("I have a Website"));

    const input = screen.getByPlaceholderText(
      "Paste a website URL (e.g. https://...)",
    );
    await user.type(input, "https://example.com");
    await user.click(screen.getByRole("button", { name: "Extract URL" }));

    await screen.findByTestId("url-teaser-screen");
    await user.click(screen.getByText("Complete URL Teaser"));

    expect(await screen.findByText("Your Validated Idea")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit my inputs" }));

    // Should return to input screen
    expect(
      await screen.findByPlaceholderText(
        "Paste a website URL (e.g. https://...)",
      ),
    ).toBeInTheDocument();
  });
});
