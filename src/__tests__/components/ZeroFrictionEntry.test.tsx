import { fireEvent, render, screen, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZeroFrictionEntry } from "../../components/ZeroFrictionEntry";
import * as fetchUtils from "../../utils/fetchWithAppCheck";
import * as firebaseAuth from "firebase/auth";

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual("firebase/auth");
  return {
    ...actual,
    signInAnonymously: vi.fn().mockResolvedValue({ user: { uid: "anon-123" } }),
  };
});

vi.mock("../../firebase", () => ({
  auth: {
    currentUser: null,
  },
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

  it("renders the initial input form", async () => {
    const user = userEvent.setup();
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    expect(
      screen.getByText("What is your primary goal today?"),
    ).toBeInTheDocument();

    const validateBtn = screen.getByText("Validate an existing idea");
    await user.click(validateBtn);

    expect(
      screen.getByPlaceholderText("What are you thinking of building?"),
    ).toBeInTheDocument();
  });

  it("transitions to analyzing state and calls onComplete with pivoted idea", async () => {
    const onCompleteMock = vi.fn();
    render(<ZeroFrictionEntry onComplete={onCompleteMock} />);

    const user = userEvent.setup();

    // Select intent first
    const validateBtn = screen.getByText("Validate an existing idea");
    await user.click(validateBtn);

    const input = screen.getByPlaceholderText(
      "What are you thinking of building?",
    );

    await user.type(input, "A basic CRM");
    const form = input.closest("form")!;
    fireEvent.submit(form);

    // Should show analyzing state
    await waitFor(() => {
      expect(
        screen.getByText("Evaluating Market Viability..."),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetchUtils.fetchWithAppCheck).toHaveBeenCalledWith(
        "/api/scoring/stream",
        expect.any(Object),
      );
    });

    await waitFor(
      () => {
        expect(screen.getByText("Your Validated Idea")).toBeInTheDocument();
      },
      { timeout: 4000 },
    ); // timeout is long due to setTimeout in TrustBuilderScreen

    expect(screen.getByText("A better niche CRM")).toBeInTheDocument();

    const generateBtn = screen.getByRole("button", {
      name: "Generate Full Campaign",
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "A better niche CRM",
          jobId: null,
        }),
      );
    });
  });
});
