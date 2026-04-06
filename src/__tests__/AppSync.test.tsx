import React from "react";
import { render, screen, act, fireEvent, waitFor } from "../test-utils/render";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "../test-utils/server";
import { http, HttpResponse } from "msw";
import App from "../App";
import * as firestore from "firebase/firestore";

import { useUserProfile } from "../hooks/useUserProfile";

// Mock dependencies
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ actionCredits: 50 }),
  }),
  setDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn((_doc, cb) => {
    if (typeof cb !== "function") return () => {};
    setTimeout(() => {
      cb({
        exists: () => true,
        data: () => ({
          status: "completed",
          progress: 100,
          total: 100,
          results: [
            {
              id: "mock-comp-result",
              name: "Competitor",
              trueCompetitorScore: 0.1,
              website: "comp.com",
              techStack: ["Tech"],
              fundingHistory: "Unknown",
              coreFeatures: ["Feature A", "Feature B"],
              targetAudience: ["Audience"],
              marketSegments: ["Segment"],
              vulnerabilities: [],
              contentStrategy: [],
            },
          ],
        }),
        metadata: { hasPendingWrites: false },
        docs: [],
      });
    }, 10);
    return () => {};
  }),
  getFirestore: vi.fn(),
  query: vi.fn(),
  collection: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  addDoc: vi.fn(),
}));

vi.mock("../firebase", () => ({
  db: {},
  safeDisableNetwork: vi.fn(),
  auth: {
    currentUser: { uid: "test-user-id", email: "mo.hassaniv@gmail.com" },
    onAuthStateChanged: vi.fn(),
  },
}));

vi.mock("../hooks/useUserProfile", () => ({
  useUserProfile: vi.fn(() => ({
    profile: { persona: "solo_founder" },
    loading: false,
  })),
}));

vi.mock("../components/AuthProvider", () => ({
  useAuth: vi.fn(() => ({
    user: {
      uid: "test-user-id",
      email: "mo.hassaniv@gmail.com",
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
      getIdToken: vi.fn().mockResolvedValue("test-token"),
    },
    loading: false,
    logout: vi.fn(),
  })),
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

vi.mock("../components/WorkspaceProvider", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("../components/WorkspaceProvider")>();
  return {
    ...mod,
    useWorkspace: () => "prod-kageform",
    useWorkspaceLoading: () => false,
    useWorkspaceDispatch: () => vi.fn(),
  };
});

const mockProducts = [
  {
    id: "prod-kageform",
    name: "KageForm",
    description: "BaaS",
    targetRegions: [],
    features: [],
    strategy: [],
  },
];

vi.mock("../components/FounderProvider", () => {
  return {
    FounderProvider: ({ children }: any) => <>{children}</>,
    useFounderProducts: () => ({ products: mockProducts, isInitialized: true }),
    useFounderActiveProductId: () => "prod-kageform",
    useFounderActiveProductDispatch: () => vi.fn(),
  };
});

describe("App System/Integration Tests", () => {
  beforeEach(() => {
    (useUserProfile as any).mockReturnValue({
      profile: { persona: "solo_founder" },
      loading: false,
    });
    window.localStorage.clear();
    delete (window as any).location;
    window.location = new URL("http://localhost/?w=test-workspace") as any;

    const originalGetItem = window.localStorage.getItem.bind(
      window.localStorage,
    );
    vi.spyOn(window.localStorage, "getItem").mockImplementation((key) => {
      if (key.includes("my_product_data")) {
        return JSON.stringify({
          name: "Test Product",
          description: "Test Description",
          targetRegions: [],
          features: [{ name: "Test Feature 1" }],
          strategy: [],
        });
      }
      if (key.includes("competitors")) {
        return JSON.stringify([
          {
            id: "mock-comp-1",
            name: "Mock Competitor",
            website: "mockcomp.com",
            techStack: ["OldTech"],
            fundingHistory: "Unknown",
            coreFeatures: ["Feature 1"],
            targetAudience: ["Audience 1"],
          },
        ]);
      }
      if (key.includes("active_product_id")) {
        return '"prod-kageform"';
      }
      if (key.includes("user_products")) {
        return JSON.stringify([{ id: "prod-kageform", name: "KageForm" }]);
      }
      return originalGetItem(key);
    });

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
          coreFeatures: ["Feature 1"],
          targetAudience: ["Audience 1"],
        },
      ]),
    );

    window.localStorage.setItem(
      "test-workspace_active_product_id_test-user-id",
      '"prod-kageform"',
    );

    vi.clearAllMocks();

    server.use(
      http.post("http://localhost/api/campaign/start", async ({ request }) => {
        const body = (await request.json()) as any;
        if (
          body.baseIdea.targetRegions ||
          body.baseIdea.features ||
          body.baseIdea.strategy
        ) {
          return HttpResponse.json(
            { error: "Payload contains extraneous myProductData fields!" },
            { status: 400 },
          );
        }
        return HttpResponse.json({ jobId: "mock-job-123" }, { status: 202 });
      }),
      http.post("/api/campaign/start", async ({ request }) => {
        const body = (await request.json()) as any;
        if (
          body.baseIdea.targetRegions ||
          body.baseIdea.features ||
          body.baseIdea.strategy
        ) {
          return HttpResponse.json(
            { error: "Payload contains extraneous myProductData fields!" },
            { status: 400 },
          );
        }
        return HttpResponse.json({ jobId: "mock-job-123" }, { status: 202 });
      }),
      http.post("/api/apollo/search", () => {
        return HttpResponse.json({});
      }),
    );
  });

  it("can trigger Sync Now and handle Apollo mock responses", async () => {
    // Suppress console warnings about recharts
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (/ResizeObserver/.test(args[0])) return;
      originalConsoleError(...args);
    };

    // Setup fetch mock for our endpoints
    server.use(
      http.post("/api/campaign/start", async ({ request }) => {
        const body = (await request.json()) as any;
        if (
          body.baseIdea.targetRegions ||
          body.baseIdea.features ||
          body.baseIdea.strategy
        ) {
          return HttpResponse.json(
            { error: "Payload contains extraneous myProductData fields!" },
            { status: 400 },
          );
        }
        return HttpResponse.json({ jobId: "mock-job-123" }, { status: 202 });
      }),
      http.post("/api/apollo/search", async () => {
        return HttpResponse.json({
          organizations: [{ website_url: "https://newcomp.com" }],
        });
      }),
      http.post("/api/apollo/enrich", async () => {
        return HttpResponse.json({
          organizations: [
            {
              website_url: "https://newcomp.com",
              name: "New Competitor",
              short_description: "A description",
              seo_description: "SEO description",
              technologies: [{ name: "React" }],
              funding_events: [{ round_name: "Series A" }],
              estimated_num_employees: 10,
              snippet: "Search snippet",
            },
          ],
        });
      }),
    );

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

    // Wait for it to render
    await screen.findByRole("heading", { name: "Dashboard", level: 1 });

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
    // Verify completion
    await waitFor(() => {
      expect(getByText(/Validation campaign started/i)).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(getByText(/Validation successful/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    console.error = originalConsoleError;
  });
});
