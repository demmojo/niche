// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useProductsSync } from "../../../src/hooks/useProductsSync";
import { useAuth } from "../../../src/components/AuthProvider";
import { onSnapshot } from "firebase/firestore";

// Mock Firebase dependencies
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock("../../../src/firebase", () => ({
  db: {},
}));

vi.mock("../../../src/components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

// Dummy component to test the hook
function TestComponent() {
  const { products, loading } = useProductsSync();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="products-count">{products.length}</div>
      {products.map((p) => (
        <div key={p.id} data-testid={`product-${p.id}`}>
          {p.name}
        </div>
      ))}
    </div>
  );
}

describe("useProductsSync Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty products and sets loading false if user is not authenticated", () => {
    (useAuth as any).mockReturnValue({ user: null });

    render(<TestComponent />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.getByTestId("products-count")).toHaveTextContent("0");
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("subscribes to products when user is authenticated", async () => {
    const mockUser = { uid: "user-123" };
    (useAuth as any).mockReturnValue({ user: mockUser });

    // Setup onSnapshot mock to simulate data loading
    const unsubscribeMock = vi.fn();
    let snapshotCallback: any;
    (onSnapshot as any).mockImplementation((_q: any, cb: any) => {
      snapshotCallback = cb;
      return unsubscribeMock;
    });

    const { unmount } = render(<TestComponent />);

    // Initial state
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Trigger snapshot
    const mockSnapshot = {
      forEach: (cb: any) => {
        cb({
          data: () => ({
            id: "p1",
            name: "Product 1",
            createdAt: "2026-01-01T00:00:00.000Z",
          }),
        });
        cb({
          data: () => ({
            id: "p2",
            name: "Product 2",
            createdAt: "2026-02-01T00:00:00.000Z",
          }),
        });
      },
    };

    snapshotCallback(mockSnapshot);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("products-count")).toHaveTextContent("2");

    // Sort logic should put newest first (Product 2 then Product 1)
    const products = screen.getAllByTestId(/product-/);
    expect(products[0]).toHaveTextContent("Product 2");
    expect(products[1]).toHaveTextContent("Product 1");

    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it("handles snapshot errors gracefully", async () => {
    const mockUser = { uid: "user-123" };
    (useAuth as any).mockReturnValue({ user: mockUser });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    let errorCallback: any;
    (onSnapshot as any).mockImplementation((_q: any, _cb: any, errCb: any) => {
      errorCallback = errCb;
      return vi.fn();
    });

    render(<TestComponent />);

    errorCallback(new Error("Firestore Error"));

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching products:",
      expect.any(Error),
    );
    expect(screen.getByTestId("products-count")).toHaveTextContent("0");
  });
});
