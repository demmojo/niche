import React, { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FounderProvider,
  useFounderProducts,
  useFounderActiveProductId,
  useFounderActiveProductDispatch,
} from "../../components/FounderProvider";
import { useAuth } from "../../components/AuthProvider";
import { useWorkspace } from "../../components/WorkspaceProvider";
import {
  onSnapshot,
  getDoc,
  doc,
  collection,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../components/WorkspaceProvider", () => ({
  useWorkspace: vi.fn(),
}));

vi.mock("firebase/firestore", () => {
  const mockBatch = {
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  return {
    collection: vi.fn(() => "mock-collection-ref"),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
    getDoc: vi.fn(),
    doc: vi.fn((db, path, id) => (id ? `mock-doc-${id}` : "mock-new-doc-ref")),
    writeBatch: vi.fn(() => mockBatch),
    serverTimestamp: vi.fn(() => "mock-timestamp"),
  };
});

vi.mock("../../firebase", () => ({
  db: {},
}));

const TestComponent = () => {
  const { products, isInitialized } = useFounderProducts();
  const activeId = useFounderActiveProductId();
  const setActiveId = useFounderActiveProductDispatch();

  if (!isInitialized) return <div>Loading products...</div>;
  return (
    <div>
      <div data-testid="products-length">{products.length}</div>
      <div data-testid="active-id">{activeId}</div>
      <button onClick={() => setActiveId("new-id")}>Set Active</button>
      {products.map((p) => (
        <div key={p.id} data-testid="product-item">
          {p.name}
        </div>
      ))}
    </div>
  );
};

describe("FounderProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { uid: "user-123", isAnonymous: false },
    });
    (useWorkspace as any).mockReturnValue({ id: "ws-123" });

    // Default mock for onSnapshot to return empty
    (onSnapshot as any).mockImplementation((query: any, callback: any) => {
      // Simulate an empty snapshot after a short delay
      setTimeout(() => {
        callback({
          forEach: vi.fn(), // empty
        });
      }, 0);
      return vi.fn(); // unsubscribe function
    });

    (getDoc as any).mockResolvedValue({ exists: () => false });
  });

  it("initializes with empty products when no legacy data exists", async () => {
    render(
      <FounderProvider>
        <TestComponent />
      </FounderProvider>,
    );

    expect(screen.getByText("Loading products...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("products-length")).toHaveTextContent("0");
    });
  });

  it("migrates legacy data if products are empty and legacy data exists using writeBatch", async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ value: { name: "Legacy Startup" } }),
    });

    const mockBatch = writeBatch({} as any);

    render(
      <FounderProvider>
        <TestComponent />
      </FounderProvider>,
    );

    await waitFor(() => {
      expect(getDoc).toHaveBeenCalled();
      expect(writeBatch).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalledTimes(3); // create product, update appData, clear legacy
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  it("exposes active product id and dispatch correctly", async () => {
    render(
      <FounderProvider>
        <TestComponent />
      </FounderProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-id")).toHaveTextContent("");
    });

    screen.getByText("Set Active").click();

    await waitFor(() => {
      expect(screen.getByTestId("active-id")).toHaveTextContent("new-id");
    });
  });
});
