import { fireEvent, render, screen, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZeroFrictionEntry } from "../../components/ZeroFrictionEntry";
import * as fetchUtils from "../../utils/fetchWithAppCheck";
import * as firebaseAuth from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase";

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
      screen.getByPlaceholderText("What are you thinking of building?"),
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
});
