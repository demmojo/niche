import { fireEvent, render, screen, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZeroFrictionEntry } from "../../components/ZeroFrictionEntry";
import * as fetchUtils from "../../utils/fetchWithAppCheck";
import * as firebaseAuth from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase";

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

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual("firebase/auth");
  return {
    ...actual,
    signInAnonymously: vi.fn().mockResolvedValue({ user: { uid: "anon-123" } }),
  };
});

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    setDoc: vi.fn().mockResolvedValue(undefined),
    doc: vi.fn((db, path, id) => ({ path, id })),
  };
});

vi.mock("../../firebase", () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

describe("ZeroFrictionEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fetchUtils, "fetchWithAppCheck").mockImplementation(
      (url: string) => {
        if (url === "/api/scoring/stream") {
          const encoder = new TextEncoder();
          const mockStream = new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  'data: {"type": "final", "value": {"reasoning": "Test", "suggestedNiches": ["A better niche CRM"], "isTarpit": true}}\n\n',
                ),
              );
              controller.close();
            },
          });
          return Promise.resolve({
            ok: true,
            status: 200,
            clone: function () {
              return this;
            },
            body: {
              getReader: () => mockStream.getReader(),
            },
          } as any);
        }
        return Promise.reject(new Error("Unknown route"));
      },
    );
  });

  it("renders the initial Fork in the Road intent selection", async () => {
    const user = userEvent.setup();
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    expect(
      screen.getByText("What is your primary goal today?"),
    ).toBeInTheDocument();

    const founderBtn = screen.getByText("I'm a Founder");
    const pmBtn = screen.getByText("I'm a Product Manager");

    expect(founderBtn).toBeInTheDocument();
    expect(pmBtn).toBeInTheDocument();
  });

  it("Path A (Founder): writes persona to Firestore anonymously before proceeding", async () => {
    const user = userEvent.setup();
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    const validateBtn = screen.getByText("I'm a Founder");
    await user.click(validateBtn);

    // Should sign in anonymously and set the persona
    await waitFor(() => {
      expect(firebaseAuth.signInAnonymously).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(), // doc() ref
        { persona: "solo_founder" },
        { merge: true },
      );
    });

    expect(
      screen.getByPlaceholderText("Category (e.g. CRM)"),
    ).toBeInTheDocument();
  });

  it("Path B (PM): writes persona to Firestore anonymously before proceeding", async () => {
    const user = userEvent.setup();
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    const analyzeBtn = screen.getByText("I'm a Product Manager");
    await user.click(analyzeBtn);

    // Should sign in anonymously and set the persona
    await waitFor(() => {
      expect(firebaseAuth.signInAnonymously).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(), // doc() ref
        { persona: "enterprise_pm" },
        { merge: true },
      );
    });

    expect(
      screen.getByPlaceholderText(
        "Which competitor or market do you want to analyze?",
      ),
    ).toBeInTheDocument();
  });

  it("Path C (URL): selects url intent and proceeds", async () => {
    const user = userEvent.setup();
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    const urlBtn = screen.getByText("I have a Website");
    await user.click(urlBtn);

    expect(
      screen.getByPlaceholderText("Paste a website URL (e.g. https://...)"),
    ).toBeInTheDocument();
  });

  it("shows error if form is submitted empty", async () => {
    const user = userEvent.setup();
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    await user.click(screen.getByText("I have a Website"));
    // Try to submit the empty form by firing submit directly on the input if hidden button
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
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

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
    render(<ZeroFrictionEntry onComplete={onComplete} />);

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

  it("shows error when auth fails", async () => {
    vi.spyOn(firebaseAuth, "signInAnonymously").mockRejectedValue(
      Object.assign(new Error("auth/operation-not-allowed"), {
        code: "auth/operation-not-allowed",
      }),
    );

    const user = userEvent.setup();
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    await user.click(screen.getByText("I have a Website"));
    const input = screen.getByPlaceholderText(
      "Paste a website URL (e.g. https://...)",
    );
    await user.type(input, "https://example.com");
    const form = input.closest("form");
    fireEvent.submit(form!);

    expect(
      await screen.findByText(/Anonymous Authentication is not enabled/),
    ).toBeInTheDocument();
  });

  it("shows API key error when auth fails with api-key-not-valid", async () => {
    vi.spyOn(firebaseAuth, "signInAnonymously").mockRejectedValue(
      Object.assign(new Error("auth/api-key-not-valid"), {
        code: "auth/api-key-not-valid",
      }),
    );

    const user = userEvent.setup();
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    await user.click(screen.getByText("I have a Website"));
    const input = screen.getByPlaceholderText(
      "Paste a website URL (e.g. https://...)",
    );
    await user.type(input, "https://example.com");
    const form = input.closest("form");
    fireEvent.submit(form!);

    expect(
      await screen.findByText(/Firebase API Key is missing or invalid/),
    ).toBeInTheDocument();
  });
});
