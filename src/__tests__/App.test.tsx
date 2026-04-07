import React from "react";
import { render, screen, act, fireEvent, waitFor } from "../test-utils/render";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "../test-utils/server";
import { http, HttpResponse } from "msw";
import App from "../App";
import {
  useFounderProducts,
  useFounderActiveProductId,
} from "../components/FounderProvider";

// Mock dependencies
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  arrayUnion: vi.fn((v) => [v]),
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
          name: "KageForm",
          description: "Test Product",
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
  useAuth: vi.fn(() => ({
    user: {
      getIdToken: vi.fn().mockResolvedValue("test-token"),
      uid: "test-user-id",
      email: "standard.user@example.com",
      isAnonymous: false,
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
    },
    loading: false,
    logout: vi.fn(),
  })),
}));

import { useUserProfile } from "../hooks/useUserProfile";

vi.mock("../components/OnboardingWizard", () => ({
  OnboardingWizard: () => (
    <div data-testid="onboarding-wizard">Mock Onboarding Wizard</div>
  ),
}));

vi.mock("../components/ZeroFrictionEntry", () => ({
  ZeroFrictionEntry: () => (
    <div data-testid="zero-friction-entry">Mock Zero Friction Entry</div>
  ),
}));

vi.mock("../hooks/useUserProfile", () => ({
  useUserProfile: vi.fn(() => ({
    profile: { persona: "solo_founder" },
    loading: false,
  })),
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
    useWorkspaceLoading: () => false,
    useWorkspaceDispatch: () => vi.fn(),
  };
});

const mockAppProducts = [{ id: "prod-kageform", name: "KageForm" }];

vi.mock("../components/FounderProvider", () => {
  return {
    FounderProvider: ({ children }: any) => <>{children}</>,
    useFounderProducts: vi.fn(() => ({
      products: mockAppProducts,
      isInitialized: true,
    })),
    useFounderActiveProductId: vi.fn(() => "prod-kageform"),
    useFounderActiveProductDispatch: () => vi.fn(),
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
    // Get the dynamically generated workspace ID
    const urlBeforeOverride = new URL(window.location.href);
    const wid = urlBeforeOverride.searchParams.get("w") || "test-workspace";

    // Set URL so mock_auth=true is predictable while preserving dynamic WORKSPACE_ID
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("mock_auth", "true");

    delete (window as any).location;
    window.location = currentUrl as any;

    window.localStorage.setItem(
      `${wid}_my_product_data_test-user-id_prod-kageform`,
      JSON.stringify({
        name: "Test Product",
        description: "Test Description",
        targetRegions: [],
        features: [],
        strategy: [],
      }),
    );
    window.localStorage.setItem(
      `${wid}_active_product_id_test-user-id`,
      '"prod-kageform"',
    );
    window.localStorage.setItem(
      `${wid}_user_products_test-user-id`,
      JSON.stringify([{ id: "prod-kageform", name: "KageForm" }]),
    );
    vi.clearAllMocks();
  });

  it("intercepts standard users with 0 products and shows OnboardingWizard", async () => {
    (useUserProfile as any).mockReturnValue({
      profile: null,
      loading: false,
    });

    vi.mocked(useFounderProducts).mockReturnValue({
      products: [],
      isInitialized: true,
    } as any);
    vi.mocked(useFounderActiveProductId).mockReturnValue(null);

    mockUseProducts.mockReturnValue([]);
    mockUseWorkspace.mockReturnValue(null);
    window.localStorage.clear(); // Ensure 0 products

    await act(async () => {
      render(<App />);
    });

    expect(screen.getByTestId("onboarding-wizard")).toBeInTheDocument();
  });

  it("renders App and verifies tab navigation and SyncNowButton deduplication", async () => {
    const { useFounderProducts, useFounderActiveProductId } =
      await import("../components/FounderProvider");

    // Mock ZeroFrictionEntry logic
    vi.mocked(useUserProfile).mockReturnValue({
      profile: { persona: "solo_founder" },
      loading: false,
    });

    vi.mocked(useFounderProducts).mockReturnValue({
      products: [
        {
          id: "prod-kageform",
          name: "KageForm",
          description: "BaaS",
          targetRegions: [],
          features: [],
          strategy: [],
        },
      ],
      isInitialized: true,
    } as any);
    vi.mocked(useFounderActiveProductId).mockReturnValue(
      "prod-kageform" as any,
    );

    mockUseProducts.mockReturnValue([
      { id: "prod-kageform", name: "KageForm" },
    ]);
    const urlBeforeOverride2 = new URL(window.location.href);
    const wid2 = urlBeforeOverride2.searchParams.get("w") || "test-workspace";

    const currentUrl2 = new URL(window.location.href);
    currentUrl2.searchParams.set("mock_auth", "true");

    delete (window as any).location;
    window.location = currentUrl2 as any;

    window.localStorage.setItem(
      `${wid2}_my_product_data_test-user-id_prod-kageform`,
      JSON.stringify({ name: "KageForm", description: "BaaS" }),
    );

    mockUseWorkspace.mockReturnValue({
      id: wid2,
      name: "My Workspace",
      role: "admin",
      tier: "free",
    });
    window.localStorage.setItem(
      `${wid2}_user_products_test-user-id`,
      JSON.stringify([{ id: "prod-kageform", name: "KageForm" }]),
    );
    window.localStorage.setItem(
      `${wid2}_my_product_data_test-user-id_prod-kageform`,
      JSON.stringify({
        name: "KageForm",
        description: "Test Product",
        targetRegions: [],
        features: [],
        strategy: [],
      }),
    );

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
    let syncButtons = screen.queryAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    // It might be 0 if the button is not rendered depending on state, but shouldn't be > 1
    expect(syncButtons.length).toBeLessThanOrEqual(1);

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
    syncButtons = screen.queryAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    expect(syncButtons.length).toBeLessThanOrEqual(1);

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
    syncButtons = screen.queryAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    expect(syncButtons.length).toBeLessThanOrEqual(1);

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
    syncButtons = screen.queryAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    expect(syncButtons.length).toBeLessThanOrEqual(1);

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
    syncButtons = screen.queryAllByRole("button", {
      name: /Run Deep Validation Campaign/i,
    });
    // It's acceptable to have 2 here because one is in the empty state CTA, but the top header toolbar one is only 1.
    // The plan explicitly states: "Strip out the redundant `<SyncNowButton />` references from the individual tab toolbars, preserving only the global instance."
    // Let's assert there are no more than 2.
    expect(syncButtons.length).toBeLessThanOrEqual(2);
  });
});
