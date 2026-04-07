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

describe("ZeroFrictionEntry (JIT Flywheel)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fetchUtils, "fetchWithAppCheck").mockImplementation(
      (url: string) => {
        if (url === "/api/niche/validate-jit") {
          const encoder = new TextEncoder();
          const mockStream = new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  'data: {"type": "complete", "value": {"competitors": [{"domain":"tarpit1.com", "is_hyper_velocity_tarpit": true}]}}\n\n',
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

  it("renders the single input for idea/URL", () => {
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    expect(screen.getByText("Don't build in a Tarpit.")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e\.g\. AI for contract review/),
    ).toBeInTheDocument();
  });

  it("submits the idea, hits JIT API, and shows Market Gravity results", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<ZeroFrictionEntry onComplete={onComplete} />);

    const input = screen.getByPlaceholderText(/e\.g\. AI for contract review/);
    await user.type(input, "AI legal app");

    await user.click(
      screen.getByRole("button", { name: /Analyze Market Gravity/i }),
    );

    // Should sign in anonymously
    await waitFor(() => {
      expect(firebaseAuth.signInAnonymously).toHaveBeenCalled();
    });

    // Should show results
    expect(
      await screen.findByText("Market Gravity Detected"),
    ).toBeInTheDocument();
    expect(screen.getByText("tarpit1.com")).toBeInTheDocument();
    expect(screen.getByText("TARPIT")).toBeInTheDocument();

    // Proceed
    await user.click(
      screen.getByRole("button", { name: /Refine & Protect This Idea/i }),
    );

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "AI Idea",
        description: "AI legal app",
      }),
    );
  });

  it("shows error alert on API failure", async () => {
    const user = userEvent.setup();
    vi.spyOn(fetchUtils, "fetchWithAppCheck").mockRejectedValue(
      new Error("Network Error"),
    );

    render(<ZeroFrictionEntry onComplete={vi.fn()} />);

    const input = screen.getByPlaceholderText(/e\.g\. AI for contract review/);
    await user.type(input, "Failing idea");

    await user.click(
      screen.getByRole("button", { name: /Analyze Market Gravity/i }),
    );

    expect(await screen.findByText("Network Error")).toBeInTheDocument();
  });
});
