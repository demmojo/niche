import React from "react";
import { render, screen, act, fireEvent, waitFor } from "../test-utils/render";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../App";
import * as firestore from "firebase/firestore";

// Mock dependencies
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ actionCredits: 50 }),
  }),
  setDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn((_doc, cb) => {
    setTimeout(() => {
      cb({
        exists: () => true,
        data: () => ({
          status: "completed",
          progress: 100,
          total: 100,
          results: [{ name: "Competitor", trueCompetitorScore: 0.1 }],
        }),
      });
    }, 10);
    return () => {};
  }),
  getFirestore: vi.fn(),
}));

vi.mock("../firebase", () => ({
  db: {},
  safeDisableNetwork: vi.fn(),
  auth: {
    currentUser: { uid: "test-user-id", email: "mo@nicheai.com" },
    onAuthStateChanged: vi.fn(),
  },
}));

vi.mock("../components/AuthProvider", () => ({
  useAuth: () => ({
    user: { uid: "test-user-id", email: "mo@nicheai.com" },
    loading: false,
    logout: vi.fn(),
  }),
}));

// Mock aiClient
vi.mock("../utils/aiClient", () => ({
  withModelFallback: vi.fn().mockImplementation(async (cb) => {
    return cb(
      {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify(["example.com"]),
          candidates: [{ groundingMetadata: { groundingChunks: [] } }],
        }),
      },
      "gemini-3.1-pro-preview",
    );
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("App System/Integration Tests", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete (window as any).location;
    window.location = new URL("http://localhost/?w=test-workspace") as any;

    window.localStorage.setItem(
      "test-workspace_my_product_data_test-user-id_prod-kageform",
      JSON.stringify({
        name: "Test Product",
        description: "Test Description",
        targetRegions: [],
        features: [{ name: "Test Feature 1" }],
        strategy: [],
      }),
    );

    // Seed some mock competitors so sync runs an enrichment cycle
    window.localStorage.setItem(
      "test-workspace_competitors_test-user-id_prod-kageform",
      JSON.stringify([
        {
          id: "mock-comp-1",
          name: "Mock Competitor",
          website: "mockcomp.com",
          techStack: ["OldTech"],
          fundingHistory: "Unknown",
        },
      ]),
    );

    window.localStorage.setItem(
      "test-workspace_active_product_id_test-user-id",
      '"prod-kageform"',
    );

    vi.clearAllMocks();
  });

  it.skip("can trigger Sync Now and handle Apollo mock responses", async () => {
    // Suppress console warnings about recharts
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (/ResizeObserver/.test(args[0])) return;
      originalConsoleError(...args);
    };

    // Setup fetch mock for our endpoints
    mockFetch.mockImplementation(async (url, options) => {
      if (url === "/api/apollo/search") {
        return {
          ok: true,
          json: async () => ({
            organizations: [{ website_url: "https://newcomp.com" }],
          }),
        };
      }
      if (url === "/api/apollo/enrich") {
        return {
          ok: true,
          json: async () => ({
            organization: {
              id: "org123",
              annual_revenue_printed: "10M",
              estimated_num_employees: 50,
              latest_funding_stage: "Series A",
              total_funding_printed: "5M",
              current_technologies: [{ name: "React" }],
              keywords: ["SaaS"],
            },
          }),
        };
      }
      if (url === "/api/apollo/news") {
        return {
          ok: true,
          json: async () => ({
            news_articles: [
              {
                title: "News 1",
                url: "https://news.com/1",
                snippet: "A snippet",
              },
            ],
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    let getByText: any,
      getAllByText: any,
      queryByText: any,
      findByText: any,
      findAllByText: any;

    await act(async () => {
      const result = render(<App />);
      getByText = result.getByText;
      getAllByText = result.getAllByText;
      queryByText = result.queryByText;
      findByText = result.findByText;
      findAllByText = result.findAllByText;
    });

    // Navigate to Dashboard
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    });
    expect(getByText("Dashboard", { selector: "h1" })).toBeInTheDocument();

    // Click Sync Now
    const syncButtons = screen.getAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    expect(syncButtons.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(syncButtons[0]);
    });

    // Expect a toast indicating sync started
    await waitFor(() => {
      expect(getByText(/Validation campaign started/i)).toBeInTheDocument();
    });

    // Based on the data-sync-review feature, instead of overwriting "OldTech",
    // the system should queue the changes and present a "Review Changes" button.
    // Let's wait for the sync queue banner to appear.
    const reviewBtn = await findByText("Review Changes", {}, { timeout: 8000 });
    expect(reviewBtn).toBeInTheDocument();

    // The state updates might still be executing async inside the queue component/fetch
    // before we can immediately click again without race conditions. We'll verify the
    // queue caught the diffs directly by checking the modal.

    // Open the Review Modal
    await act(async () => {
      fireEvent.click(reviewBtn);
    });

    // Verify the diff content is rendered
    expect(await findByText(/Review Sync Changes/i)).toBeInTheDocument();

    // We can just verify the modal has some text related to the diffs since we mocked Apollo
    // to return React and Series A.
    const reactElements = await findAllByText(/"React"/, {}, { timeout: 3000 });
    expect(reactElements.length).toBeGreaterThan(0);

    console.error = originalConsoleError;
  });
});
