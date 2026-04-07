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

  it("throws when hooks are used outside of FounderProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const HookTestProducts = () => {
      useFounderProducts();
      return null;
    };
    const HookTestActiveId = () => {
      useFounderActiveProductId();
      return null;
    };
    const HookTestActiveDispatch = () => {
      useFounderActiveProductDispatch();
      return null;
    };

    expect(() => render(<HookTestProducts />)).toThrow(
      "useFounderProducts must be used within FounderProvider",
    );
    expect(() => render(<HookTestActiveId />)).toThrow(
      "useFounderActiveProductId must be used within FounderProvider",
    );
    expect(() => render(<HookTestActiveDispatch />)).toThrow(
      "useFounderActiveProductDispatch must be used within FounderProvider",
    );

    consoleSpy.mockRestore();
  });

  it("logs error if migration fails", async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ value: { name: "Legacy Startup" } }),
    });
    const mockBatch = writeBatch({} as any);
    (mockBatch.commit as any).mockRejectedValueOnce(new Error("Commit failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <FounderProvider>
        <TestComponent />
      </FounderProvider>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Migration failed",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("returns early if user is not available", async () => {
    (useAuth as any).mockReturnValue({
      user: null,
    });

    render(
      <FounderProvider>
        <TestComponent />
      </FounderProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("products-length")).toHaveTextContent("0");
    });
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("handles error in onSnapshot", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (onSnapshot as any).mockImplementation(
      (query: any, callback: any, errorCb: any) => {
        setTimeout(() => {
          errorCb(new Error("Firestore snapshot failed"));
        }, 0);
        return vi.fn();
      },
    );

    render(
      <FounderProvider>
        <TestComponent />
      </FounderProvider>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching founder products:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("sorts fetched products correctly including those without createdAt", async () => {
    (onSnapshot as any).mockImplementation((query: any, callback: any) => {
      setTimeout(() => {
        callback({
          forEach: (cb: any) => {
            cb({ id: "p1", data: () => ({ name: "No Date 1" }) });
            cb({
              id: "p2",
              data: () => ({ name: "Date Old", createdAt: "2023-01-01" }),
            });
            cb({ id: "p3", data: () => ({ name: "No Date 2" }) });
            cb({
              id: "p4",
              data: () => ({ name: "Date New", createdAt: "2023-12-31" }),
            });
          },
        });
      }, 0);
      return vi.fn();
    });

    render(
      <FounderProvider>
        <TestComponent />
      </FounderProvider>,
    );

    await waitFor(() => {
      const items = screen.getAllByTestId("product-item");
      expect(items.map((i) => i.textContent)).toEqual([
        "Date New",
        "Date Old",
        "No Date 1",
        "No Date 2",
      ]);
    });
  });
});
