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
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/llm/surface-roast") {
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
      if (url === "/api/llm/surface-roast")
        return Promise.resolve({ ok: false });
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
      if (url === "/api/llm/surface-roast") {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ bullets: ["First"] }),
            });
          }, 50);
        });
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
    });

    // Try submitting with empty email (initial state is empty)
    const sendBtn = screen.getByRole("button", { name: /Get Full Report/i });
    fireEvent.submit(sendBtn.closest("form") as any);

    // Nothing should happen, meaning it doesn't show the success state
    expect(
      screen.queryByText(/We're preparing your deep dive report/i),
    ).not.toBeInTheDocument();
  });
});
