import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RoastMyNiche } from "../../components/superadmin/RoastMyNiche";

// Mock Firebase functions
vi.mock("../../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getCountFromServer: vi.fn(),
  addDoc: vi.fn(),
}));

// Mock AuthProvider
vi.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      getIdToken: () => Promise.resolve("mock-token"),
    },
  }),
}));

describe("RoastMyNiche UI", () => {
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation((url: string, options: any) => {
      if (url === "/api/llm/generateStream" || url === "/api/chat") {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode(
                `data: {"type":"start","messageId":"msg-1"}\n\n` +
                  `data: {"type":"text-start","id":"text-1"}\n\n` +
                  `data: {"type":"text-delta","id":"text-1","delta":"First bullet point. "}\n\n` +
                  `data: {"type":"text-delta","id":"text-1","delta":"Second bullet point. "}\n\n` +
                  `data: {"type":"text-delta","id":"text-1","delta":"Third bullet point."}\n\n` +
                  `data: {"type":"text-end","id":"text-1"}\n\n` +
                  `data: {"type":"finish"}\n\n`,
              ),
            );
            controller.close();
          },
        });
        return Promise.resolve(
          new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "x-vercel-ai-data-stream": "v1",
            },
          }),
        );
      }
      if (url === "/api/roast") {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () =>
                Promise.resolve({
                  bullets: [
                    "First bullet point.",
                    "Second bullet point.",
                    "Third bullet point.",
                  ],
                }),
            });
          }, 100);
        });
      }
      if (url === "/api/campaign/submit-lead") {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true }),
            });
          }, 100);
        });
      }
      return Promise.reject(new Error("Unknown url " + url));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("renders the input form and handles submission", async () => {
    const { getCountFromServer } = await import("firebase/firestore");
    vi.mocked(getCountFromServer).mockResolvedValue({
      data: () => ({ count: 10 }),
    } as any);

    render(<RoastMyNiche />);

    const input = await screen.findByPlaceholderText(
      /Describe your product idea/i,
    );
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "An app for AI agents" } });
    const submitBtn = screen.getByRole("button", { name: /Roast My Idea/i });
    fireEvent.submit(submitBtn.closest("form") as any);

    // Should show loading state with explainable aria-live polite
    expect(
      await screen.findByText(/Analyzing market saturation/i),
    ).toBeInTheDocument();

    // Wait for the mock response
    await waitFor(() => {
      expect(screen.getByText(/First bullet point/i)).toBeInTheDocument();
    });

    // Should show the email capture form now
    const emailInput = screen.getByPlaceholderText(
      /Enter your email for the deep dive/i,
    );
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const sendBtn = screen.getByRole("button", { name: /Get Full Report/i });
    fireEvent.submit(sendBtn.closest("form") as any);

    await waitFor(() => {
      expect(
        screen.getByText(/We're preparing your deep dive report/i),
      ).toBeInTheDocument();
    });
  });

  it("disables submissions if queue > 50", async () => {
    const { getCountFromServer } = await import("firebase/firestore");
    vi.mocked(getCountFromServer).mockResolvedValue({
      data: () => ({ count: 51 }),
    } as any);

    render(<RoastMyNiche />);

    await waitFor(() => {
      expect(
        screen.getByText(/High Volume - Check Back Later/i),
      ).toBeInTheDocument();
    });

    const submitBtn = screen.queryByRole("button", { name: /Roast My Idea/i });
    expect(submitBtn).not.toBeInTheDocument();
    // Input should be disabled or not present
    const input = screen.queryByPlaceholderText(/Describe your product idea/i);
    expect(input).not.toBeInTheDocument();
  });

  it("handles fetch failure for surface roast gracefully", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/llm/generateStream" || url === "/api/chat") {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode(
                `data: {"type":"error","errorText":"Failed to fetch analysis"}\n\n`,
              ),
            );
            controller.close();
          },
        });
        return Promise.resolve(
          new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "x-vercel-ai-data-stream": "v1",
            },
          }),
        );
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    const { getCountFromServer } = await import("firebase/firestore");
    vi.mocked(getCountFromServer).mockResolvedValue({
      data: () => ({ count: 10 }),
    } as any);

    render(<RoastMyNiche />);

    const input = await screen.findByPlaceholderText(
      /Describe your product idea/i,
    );
    fireEvent.change(input, { target: { value: "An app for AI agents" } });
    const submitBtn = screen.getByRole("button", { name: /Roast My Idea/i });
    fireEvent.submit(submitBtn.closest("form") as any);

    expect(
      await screen.findByText(/Failed to fetch analysis/i),
    ).toBeInTheDocument();
  });

  it("handles empty idea gracefully", async () => {
    const { getCountFromServer } = await import("firebase/firestore");
    vi.mocked(getCountFromServer).mockResolvedValue({
      data: () => ({ count: 10 }),
    } as any);

    render(<RoastMyNiche />);

    const submitBtn = await screen.findByRole("button", {
      name: /Roast My Idea/i,
    });
    fireEvent.submit(submitBtn.closest("form") as any);

    // Should not show loading
    expect(
      screen.queryByText(/Analyzing market saturation/i),
    ).not.toBeInTheDocument();
  });

  it("handles fetch failure for deep dive email capture gracefully", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/llm/generateStream" || url === "/api/chat") {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode(
                `data: {"type":"start","messageId":"msg-1"}\n\n` +
                  `data: {"type":"text-start","id":"text-1"}\n\n` +
                  `data: {"type":"text-delta","id":"text-1","delta":"First bullet point. "}\n\n` +
                  `data: {"type":"text-end","id":"text-1"}\n\n` +
                  `data: {"type":"finish"}\n\n`,
              ),
            );
            controller.close();
          },
        });
        return Promise.resolve(
          new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "x-vercel-ai-data-stream": "v1",
            },
          }),
        );
      }
      if (url === "/api/campaign/submit-lead") {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: false });
          }, 50);
        });
      }
      return Promise.reject(new Error("Unknown"));
    });

    const { getCountFromServer } = await import("firebase/firestore");
    vi.mocked(getCountFromServer).mockResolvedValue({
      data: () => ({ count: 10 }),
    } as any);

    render(<RoastMyNiche />);

    const input = await screen.findByPlaceholderText(
      /Describe your product idea/i,
    );
    fireEvent.change(input, { target: { value: "An app for AI agents" } });
    const submitBtn = screen.getByRole("button", { name: /Roast My Idea/i });
    fireEvent.submit(submitBtn.closest("form") as any);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Enter your email for the deep dive/i),
      ).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(
      /Enter your email for the deep dive/i,
    );
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const sendBtn = screen.getByRole("button", { name: /Get Full Report/i });
    fireEvent.submit(sendBtn.closest("form") as any);

    expect(await screen.findByText(/Failed to submit/i)).toBeInTheDocument();
  });

  it("handles check queue error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getCountFromServer } = await import("firebase/firestore");
    vi.mocked(getCountFromServer).mockRejectedValueOnce(
      new Error("Firebase offline"),
    );

    render(<RoastMyNiche />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to check queue",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("handles early return on empty email (branch coverage)", async () => {
    const { getCountFromServer } = await import("firebase/firestore");
    vi.mocked(getCountFromServer).mockResolvedValue({
      data: () => ({ count: 10 }),
    } as any);

    render(<RoastMyNiche />);

    const input = await screen.findByPlaceholderText(
      /Describe your product idea/i,
    );
    fireEvent.change(input, { target: { value: "An app for AI agents" } });
    const submitBtn = screen.getByRole("button", { name: /Roast My Idea/i });
    fireEvent.submit(submitBtn.closest("form") as any);

    await waitFor(() => {
      expect(screen.getByText(/First bullet point/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Enter your email for the deep dive/i),
      ).toBeInTheDocument();
    });

    // Try submitting with empty email (initial state is empty)
    const sendBtn = screen.getByRole("button", { name: /Get Full Report/i });
    fireEvent.submit(sendBtn.closest("form") as any);

    // Nothing should happen, meaning it doesn't show the success state
    expect(
      screen.queryByText(/We're preparing your deep dive report/i),
    ).not.toBeInTheDocument();
  });

  it("Phase 1: uses React 19 startTransition and handles 202 Accepted with precise status indicators", async () => {
    // Override fetch to return 202 Accepted with a phase 1 fast data message
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/llm/generateStream" || url === "/api/chat") {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode(
                `data: {"type":"data-status","data":"searching_exa"}\n\n`,
              ),
            );
            controller.close();
          },
        });
        return Promise.resolve(
          new Response(stream, {
            status: 202,
            headers: {
              "Content-Type": "text/event-stream",
              "x-vercel-ai-data-stream": "v1",
            },
          }),
        );
      }
      return Promise.reject(new Error("Unknown url " + url));
    });

    const { getCountFromServer } = await import("firebase/firestore");
    vi.mocked(getCountFromServer).mockResolvedValue({
      data: () => ({ count: 10 }),
    } as any);

    render(<RoastMyNiche />);

    const input = await screen.findByPlaceholderText(
      /Describe your product idea/i,
    );
    fireEvent.change(input, { target: { value: "A new startup idea" } });

    // Important: we need to ensure the UI updates with an explainable state, NOT a generic spinner
    const submitBtn = screen.getByRole("button", { name: /Roast My Idea/i });

    // In React 19, the startTransition should be used. The precise status should appear.
    fireEvent.submit(submitBtn.closest("form") as any);

    // Assert that the exact precise status string is displayed
    expect(await screen.findByText(/searching_exa/i)).toBeInTheDocument();

    // The test asserts that the generic spinner does NOT exist
    expect(screen.queryByTestId("generic-spinner")).not.toBeInTheDocument();
  });
});
