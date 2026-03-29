// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTaxonomySync } from "../../../src/hooks/useTaxonomySync";
import { onSnapshot, runTransaction } from "firebase/firestore";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  runTransaction: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock("../../../src/firebase", () => ({
  db: {},
}));

function TestComponent() {
  const { displayTaxonomy, evaluationStatus, mergeFeatures } =
    useTaxonomySync();

  return (
    <div>
      <div data-testid="status">{evaluationStatus}</div>
      <div data-testid="taxonomy-count">{displayTaxonomy.length}</div>
      <ul>
        {displayTaxonomy.map((tax) => (
          <li key={tax.id} data-testid={`tax-${tax.id}`}>
            {tax.id}: {tax.originalFeatures.join(", ")}
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          mergeFeatures(["Feature A", "Feature B"], "Merged Feature")
        }
      >
        Merge
      </button>
    </div>
  );
}

describe("useTaxonomySync Hook", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()));

    // Mock window.location for demo mode test
    delete (window as any).location;
    window.location = { ...originalLocation, search: "" } as any;
  });

  afterEach(() => {
    window.location = originalLocation as any;
    vi.restoreAllMocks();
  });

  it("skips subscription in demo mode", () => {
    window.location.search = "?demo_data=true";
    render(<TestComponent />);

    expect(onSnapshot).not.toHaveBeenCalled();
    expect(screen.getByTestId("taxonomy-count")).toHaveTextContent("0");
  });

  it("loads approved taxonomy normally", async () => {
    let snapshotCb: any;
    (onSnapshot as any).mockImplementation((_ref: any, cb: any) => {
      snapshotCb = cb;
      return vi.fn();
    });

    render(<TestComponent />);

    await waitFor(() => {
      snapshotCb({
        exists: () => true,
        data: () => ({
          approvedTaxonomy: [{ id: "Tax 1", originalFeatures: ["F1"] }],
          evaluationStatus: "idle",
        }),
      });
    });

    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("taxonomy-count")).toHaveTextContent("1");
    expect(screen.getByTestId("tax-Tax 1")).toBeInTheDocument();
  });

  it("displays shadow taxonomy when evaluating", async () => {
    let snapshotCb: any;
    (onSnapshot as any).mockImplementation((_ref: any, cb: any) => {
      snapshotCb = cb;
      return vi.fn();
    });

    render(<TestComponent />);

    await waitFor(() => {
      snapshotCb({
        exists: () => true,
        data: () => ({
          approvedTaxonomy: [{ id: "Tax 1", originalFeatures: ["F1"] }],
          shadowTaxonomy: [
            { id: "Tax 1", originalFeatures: ["F1"] },
            { id: "Tax 2", originalFeatures: ["F2"] },
          ],
          evaluationStatus: "evaluating",
        }),
      });
    });

    expect(screen.getByTestId("status")).toHaveTextContent("evaluating");
    expect(screen.getByTestId("taxonomy-count")).toHaveTextContent("2");
  });

  it("handles merge features optimistically and runs transaction", async () => {
    const user = userEvent.setup();
    let snapshotCb: any;
    (onSnapshot as any).mockImplementation((_ref: any, cb: any) => {
      snapshotCb = cb;
      return vi.fn();
    });

    render(<TestComponent />);

    // Initial state
    await waitFor(() => {
      snapshotCb({
        exists: () => true,
        data: () => ({
          approvedTaxonomy: [{ id: "Existing", originalFeatures: ["F1"] }],
          evaluationStatus: "idle",
        }),
      });
    });

    expect(screen.getByTestId("taxonomy-count")).toHaveTextContent("1");

    // We want the transaction to be pending so we can observe the optimistic state
    let resolveTransaction: any;
    const transactionPromise = new Promise((resolve) => {
      resolveTransaction = resolve;
    });

    (runTransaction as any).mockReturnValue(transactionPromise);

    // Click merge
    const mergeBtn = screen.getByRole("button", { name: "Merge" });
    await act(async () => {
      user.click(mergeBtn); // don't await so we can check during transition
    });

    await waitFor(() => {
      expect(screen.getByTestId("taxonomy-count")).toHaveTextContent("2");
      expect(screen.getByTestId("tax-Merged Feature")).toBeInTheDocument();
    });

    // Now resolve the transaction
    await act(async () => {
      resolveTransaction();
    });

    // Verify transaction
    expect(runTransaction).toHaveBeenCalled();
    const transactionFn = (runTransaction as any).mock.calls[0][1];

    const mockTransaction = {
      get: vi.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({
          approvedTaxonomy: [{ id: "Existing", originalFeatures: ["F1"] }],
        }),
      }),
      set: vi.fn(),
    };

    await transactionFn(mockTransaction);

    expect(mockTransaction.set).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        evaluationStatus: "evaluating",
        shadowTaxonomy: [
          { id: "Existing", originalFeatures: ["F1"] },
          {
            id: "Merged Feature",
            originalFeatures: ["Feature A", "Feature B"],
          },
        ],
      }),
    );

    // Verify API call
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/campaign/evaluate-taxonomy",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
