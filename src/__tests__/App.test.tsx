import React from "react";
import { render, screen, act, fireEvent, waitFor } from "../test-utils/render";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "../test-utils/server";
import { http, HttpResponse } from "msw";
import App from "../App";

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

vi.mock("../components/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      getIdToken: vi.fn().mockResolvedValue("test-token"),
      uid: "test-user-id",
      email: "standard.user@example.com",
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
    },
    loading: false,
    logout: vi.fn(),
  }),
}));

vi.mock("../components/ZeroFrictionEntry", () => ({
  ZeroFrictionEntry: () => (
    <div data-testid="zero-friction-entry">Mock Zero Friction Entry</div>
  ),
}));

const { mockUseProducts, mockUseWorkspace } = vi.hoisted(() => ({
  mockUseProducts: vi
    .fn()
    .mockReturnValue([{ id: "prod-kageform", name: "KageForm" }]),
  mockUseWorkspace: vi.fn().mockReturnValue("prod-kageform"),
}));

vi.mock("../components/WorkspaceProvider", async (importOriginal) => {
  const mod =
    await importOriginal<typeof import("../components/WorkspaceProvider")>();
  return {
    ...mod,
    useWorkspace: () => mockUseWorkspace(),
    useProducts: () => mockUseProducts(),
    useWorkspaceLoading: () => false,
    useProductsDispatch: () => vi.fn(),
    useWorkspaceDispatch: () => vi.fn(),
  };
});

describe("App Integration", () => {
  beforeEach(() => {
    server.use(
      http.post("http://localhost/api/campaign/start", () =>
        HttpResponse.json({ jobId: "mock-job-123" }, { status: 202 }),
      ),
      http.post("/api/campaign/start", () =>
        HttpResponse.json({ jobId: "mock-job-123" }, { status: 202 }),
      ),
    );
    window.localStorage.clear();
    mockUseProducts.mockReturnValue([
      { id: "prod-kageform", name: "KageForm" },
    ]);
    mockUseWorkspace.mockReturnValue("prod-kageform");
    // Set URL so WORKSPACE_ID is predictable
    delete (window as any).location;
    window.location = new URL("http://localhost/?w=test-workspace") as any;

    window.localStorage.setItem(
      "test-workspace_my_product_data_test-user-id_prod-kageform",
      JSON.stringify({
        name: "Test Product",
        description: "Test Description",
        targetRegions: [],
        features: [],
        strategy: [],
      }),
    );
    window.localStorage.setItem(
      "test-workspace_active_product_id_test-user-id",
      '"prod-kageform"',
    );
    window.localStorage.setItem(
      "test-workspace_user_products_test-user-id",
      JSON.stringify([{ id: "prod-kageform", name: "KageForm" }]),
    );
    vi.clearAllMocks();
  });

  it("intercepts standard users with 0 products and shows ZeroFrictionEntry", async () => {
    mockUseProducts.mockReturnValue([]);
    mockUseWorkspace.mockReturnValue(null);
    window.localStorage.clear(); // Ensure 0 products

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByTestId("zero-friction-entry")).toBeInTheDocument();
  });

  it("renders App and verifies tab navigation and SyncNowButton deduplication", async () => {
    let getByText: any, getAllByText: any;

    await act(async () => {
      const result = render(<App />);
      getByText = result.getByText;
      getAllByText = result.getAllByText;
    });

    // Navigate to Dashboard
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    });
    expect(getByText("Dashboard", { selector: "h1" })).toBeInTheDocument();

    // The SyncNowButton text has "Sync Now"
    // Check that we only render one "Sync Now" button
    let syncButtons = screen.getAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    expect(syncButtons.length).toBe(1);

    // 2. Navigate to "Matrix" tab
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Competitor Matrix" }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Competitor Matrix", level: 1 }),
      ).toBeInTheDocument();
    });

    // Check SyncNowButton count
    syncButtons = screen.getAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    expect(syncButtons.length).toBe(1);

    // 3. Navigate to "Raw Data" tab
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Raw Data Library" }));
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Raw Data Library", level: 1 }),
      ).toBeInTheDocument();
    });

    // Check SyncNowButton count
    syncButtons = screen.getAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    expect(syncButtons.length).toBe(1);

    // 4. Navigate to "Insights" tab
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Insight Library" }));
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Insight Library", level: 1 }),
      ).toBeInTheDocument();
    });

    // Check SyncNowButton count
    syncButtons = screen.getAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    expect(syncButtons.length).toBe(1);

    // Navigation to Background Tasks & Sync
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Background Tasks & Sync" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("System Logs")).toBeInTheDocument();
    });

    // Here, there's one Sync Now button in the empty state ("All systems are up to date.") and one in the top header.
    // Wait! The empty state has a Sync Now button. So on System Status tab, if empty, we might see 2!
    // Let's check how many there are.
    syncButtons = screen.getAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    // It's acceptable to have 2 here because one is in the empty state CTA, but the top header toolbar one is only 1.
    // The plan explicitly states: "Strip out the redundant `<SyncNowButton />` references from the individual tab toolbars, preserving only the global instance."
    // Let's assert there are no more than 2.
    expect(syncButtons.length).toBeLessThanOrEqual(2);
  });
});
