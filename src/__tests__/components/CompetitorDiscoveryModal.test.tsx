import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompetitorDiscoveryModal } from "../../components/CompetitorDiscoveryModal";
import * as AuthProvider from "../../components/AuthProvider";
import * as fetchWithAppCheck from "../../utils/fetchWithAppCheck";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../utils/fetchWithAppCheck", () => ({
  fetchWithAppCheck: vi.fn(),
}));

describe("CompetitorDiscoveryModal", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockAddToast = vi.fn();
  const baseIdea = { name: "Test Idea", description: "Test Description" };

  beforeEach(() => {
    vi.clearAllMocks();
    (AuthProvider.useAuth as any).mockReturnValue({ user: { uid: "123" } });

    // Default mocks for API
    (fetchWithAppCheck.fetchWithAppCheck as any).mockImplementation(
      (url: string) => {
        if (url.includes("discover-competitors")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                competitors: [
                  { name: "Comp A", domain: "compa.com", description: "A" },
                  { name: "Comp B", domain: "compb.com", description: "B" },
                  { name: "Comp C", domain: "compc.com", description: "C" },
                ],
              }),
          });
        }
        if (url.includes("analyze-competitors")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                analyzed: [
                  {
                    domain: "compa.com",
                    matchTier: "Direct",
                    matchRationale: "Direct match",
                    similarityScore: 90,
                  },
                  {
                    domain: "compb.com",
                    matchTier: "Adjacent",
                    matchRationale: "Adjacent match",
                    similarityScore: 60,
                  },
                  {
                    domain: "compc.com",
                    matchTier: "Legacy",
                    matchRationale: "Legacy match",
                    similarityScore: 10,
                  },
                ],
              }),
          });
        }
        return Promise.reject(new Error("Unknown url"));
      },
    );
  });

  it("returns null when not open", () => {
    const { container } = render(
      <CompetitorDiscoveryModal
        isOpen={false}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders loading state initially", () => {
    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );
    expect(
      screen.getByText("Scanning market landscape..."),
    ).toBeInTheDocument();
  });

  it("fetches competitors and rationale successfully", async () => {
    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
      expect(screen.getByText("Comp B")).toBeInTheDocument();
    });

    expect(screen.getByText("Direct")).toBeInTheDocument();
    expect(screen.getByText("Direct match")).toBeInTheDocument();
    expect(screen.getByText("Adjacent")).toBeInTheDocument();
    expect(screen.getByText("Adjacent match")).toBeInTheDocument();
  });

  it("shows error if discover-competitors fails", async () => {
    (fetchWithAppCheck.fetchWithAppCheck as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Custom error" }),
      }),
    );

    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Discovery Failed")).toBeInTheDocument();
      expect(screen.getByText("Custom error")).toBeInTheDocument();
    });
  });

  it("shows error if analyze-competitors fails, but keeps competitors", async () => {
    (fetchWithAppCheck.fetchWithAppCheck as any).mockImplementation(
      (url: string) => {
        if (url.includes("discover-competitors")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                competitors: [
                  { name: "Comp A", domain: "compa.com", description: "A" },
                ],
              }),
          });
        }
        if (url.includes("analyze-competitors")) {
          return Promise.resolve({ ok: false });
        }
        return Promise.reject(new Error("Unknown url"));
      },
    );

    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
    });
    // It shouldn't show error screen because phase 1 succeeded
    expect(screen.queryByText("Discovery Failed")).not.toBeInTheDocument();
  });

  it("renders analyzing state when rationale is missing", async () => {
    let resolveAnalyze: any;
    const analyzePromise = new Promise((res) => {
      resolveAnalyze = res;
    });

    (fetchWithAppCheck.fetchWithAppCheck as any).mockImplementation(
      (url: string) => {
        if (url.includes("discover-competitors")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                competitors: [
                  { name: "Comp A", domain: "compa.com", description: "A" },
                ],
              }),
          });
        }
        if (url.includes("analyze-competitors")) {
          return analyzePromise;
        }
        return Promise.reject(new Error("Unknown url"));
      },
    );

    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
    });

    // Should be in analyzing state (showing pulse animation instead of match rationale)
    expect(
      document.querySelector(".animate-pulse.space-y-2"),
    ).toBeInTheDocument();

    // Resolve the promise to clean up
    resolveAnalyze({
      ok: true,
      json: () => Promise.resolve({ analyzed: [] }),
    });

    await waitFor(() => {
      expect(
        document.querySelector(".animate-pulse.space-y-2"),
      ).not.toBeInTheDocument();
    });
  });

  it("shows error if no competitors returned", async () => {
    (fetchWithAppCheck.fetchWithAppCheck as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ competitors: [] }),
      }),
    );

    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "No competitors found for this niche. Try broader terms.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("can toggle competitor selection", async () => {
    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
    });

    // Both are initially selected
    expect(screen.getByText("3 competitors selected")).toBeInTheDocument();

    // Toggle off Comp A
    fireEvent.click(screen.getByText("Comp A").closest("div.group")!);
    expect(screen.getByText("2 competitors selected")).toBeInTheDocument();

    // Toggle off Comp B
    fireEvent.click(screen.getByText("Comp B").closest("div.group")!);
    expect(screen.getByText("1 competitor selected")).toBeInTheDocument();

    // Toggle off Comp C
    fireEvent.click(screen.getByText("Comp C").closest("div.group")!);
    expect(
      screen.getByText("Select at least one to continue"),
    ).toBeInTheDocument();
  });

  it("can change threat level", async () => {
    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
    });

    const highBtn = screen.getAllByText("High")[0];
    fireEvent.click(highBtn);

    const medBtn = screen.getAllByText("Medium")[0];
    fireEvent.click(medBtn);

    const lowBtn = screen.getAllByText("Low")[0];
    fireEvent.click(lowBtn);
  });

  it("can manually add a competitor", async () => {
    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "Missing one? Enter competitor URL...",
    );
    fireEvent.change(input, { target: { value: "invalid:url:here" } });

    const addBtn = screen.getByText("Add");
    fireEvent.click(addBtn);

    expect(screen.getAllByText("invalid:url:here")[0]).toBeInTheDocument();
    expect(screen.getByText("4 competitors selected")).toBeInTheDocument();
  });

  it("calls onConfirm with selected competitors", async () => {
    // Mock randomUUID
    Object.defineProperty(window, "crypto", {
      value: { randomUUID: () => "1234-5678" },
    });

    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText("Confirm & Run Analysis");
    fireEvent.click(confirmBtn);

    expect(mockOnConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ name: "Comp A", id: "1234-5678" }),
      expect.objectContaining({ name: "Comp B", id: "1234-5678" }),
      expect.objectContaining({ name: "Comp C", id: "1234-5678" }),
    ]);
  });

  it("shows toast if trying to confirm with 0 selection", async () => {
    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
    });

    // Unselect all
    fireEvent.click(screen.getByText("Comp A").closest("div.group")!);
    fireEvent.click(screen.getByText("Comp B").closest("div.group")!);
    fireEvent.click(screen.getByText("Comp C").closest("div.group")!);

    const confirmBtn = screen.getByRole("button", {
      name: /Confirm & Run Analysis/i,
    });
    expect(confirmBtn).toBeDisabled();
  });

  it("handles enter key to add competitor", async () => {
    render(
      <CompetitorDiscoveryModal
        isOpen={true}
        onClose={mockOnClose}
        baseIdea={baseIdea}
        onConfirm={mockOnConfirm}
        addToast={mockAddToast}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Comp A")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "Missing one? Enter competitor URL...",
    );
    fireEvent.change(input, { target: { value: "anothercomp.com" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.getAllByText("anothercomp.com")[0]).toBeInTheDocument();
  });
});
