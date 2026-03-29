import { fireEvent, render, screen, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZeroFrictionEntry } from "../../components/ZeroFrictionEntry";
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
    global.fetch = vi.fn((url: string) => {
      if (url === "/api/scoring/tarpit-analyze") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              isTarpit: true,
              suggestedNiches: ["A better niche CRM"],
            }),
        });
      }
      if (url === "/api/campaign/start") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jobId: "job-123" }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    }) as any;
  });

  it("renders the initial input form", () => {
    render(<ZeroFrictionEntry onComplete={vi.fn()} />);
    expect(
      screen.getByPlaceholderText("What are you thinking of building?"),
    ).toBeInTheDocument();
  });

  it("transitions to analyzing state and calls onComplete with pivoted idea", async () => {
    const onCompleteMock = vi.fn();
    render(<ZeroFrictionEntry onComplete={onCompleteMock} />);

    const user = userEvent.setup();
    const input = screen.getByPlaceholderText(
      "What are you thinking of building?",
    );

    await user.type(input, "A basic CRM");
    const form = input.closest("form")!;
    fireEvent.submit(form);

    // Should optimistically show analyzing state
    expect(
      screen.getByText("Analyzing market saturation..."),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/scoring/tarpit-analyze",
        expect.any(Object),
      );
      expect(screen.getByText("Your Validated Idea")).toBeInTheDocument();
      expect(screen.getByText("A better niche CRM")).toBeInTheDocument();
    });

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
