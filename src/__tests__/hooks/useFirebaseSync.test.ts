import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFirebaseSync } from "../../hooks/useFirebaseSync";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { safeDisableNetwork } from "../../firebase";
import { useAuth } from "../../components/AuthProvider";

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("../../firebase", () => ({
  db: {},
  safeDisableNetwork: vi.fn(),
}));

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("useFirebaseSync", () => {
  let mockOnSnapshotCallback: any;
  let mockOnSnapshotErrorCallback: any;

  beforeEach(() => {
    vi.resetAllMocks();
    mockOnSnapshotCallback = undefined;
    mockOnSnapshotErrorCallback = undefined;

    vi.mocked(doc).mockReturnValue("mock-doc-ref" as any);

    vi.mocked(onSnapshot).mockImplementation(
      (_docRef: any, onNext: any, onError: any) => {
        mockOnSnapshotCallback = onNext;
        mockOnSnapshotErrorCallback = onError;
        return vi.fn(); // unsubscribe function
      },
    );
  });

  it("returns initial value when no user is authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useFirebaseSync("test-key", "initial"));

    expect(result.current[0]).toBe("initial");
    expect(onSnapshot).not.toHaveBeenCalled();
  });

  it("sets up listener when user is authenticated", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);
    vi.mocked(doc).mockReturnValue("mock-doc-ref" as any);

    const { result } = renderHook(() => useFirebaseSync("test-key", "initial"));

    expect(onSnapshot).toHaveBeenCalled();
    expect(doc).toHaveBeenCalledWith(
      {},
      "users",
      "user123",
      "appData",
      "test-key",
    );

    // Simulate snapshot where doc does not exist
    act(() => {
      mockOnSnapshotCallback({ exists: () => false });
    });

    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { value: "initial" },
      { merge: true },
    );
    expect(result.current[0]).toBe("initial");
  });

  it("updates state when snapshot contains data", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    const { result } = renderHook(() => useFirebaseSync("test-key", "initial"));

    act(() => {
      mockOnSnapshotCallback({
        exists: () => true,
        data: () => ({ value: "remote-value" }),
      });
    });

    expect(result.current[0]).toBe("remote-value");
  });

  it("updates value locally and syncs to firebase", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    const { result } = renderHook(() => useFirebaseSync("test-key", "initial"));

    act(() => {
      result.current[1]("new-value");
    });

    expect(result.current[0]).toBe("new-value");
    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { value: "new-value" },
      { merge: true },
    );

    // Simulate snapshot coming back from our own write (should be ignored due to isLocalUpdate)
    act(() => {
      mockOnSnapshotCallback({
        exists: () => true,
        data: () => ({ value: "new-value" }),
      });
    });

    // State remains unchanged
    expect(result.current[0]).toBe("new-value");
  });

  it("handles functional state updates", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    const { result } = renderHook(() => useFirebaseSync<number>("test-key", 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { value: 1 },
      { merge: true },
    );
  });

  it("handles undefined values by saving them as null", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    const { result } = renderHook(() =>
      useFirebaseSync<string | undefined>("test-key", undefined),
    );

    act(() => {
      mockOnSnapshotCallback({ exists: () => false });
    });

    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { value: null },
      { merge: true },
    );

    act(() => {
      result.current[1](undefined);
    });

    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { value: null },
      { merge: true },
    );
  });

  it("handles network errors by disabling network safely", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock setDoc to throw resource-exhausted
    vi.mocked(setDoc).mockRejectedValueOnce({ code: "resource-exhausted" });

    const { result } = renderHook(() => useFirebaseSync("test-key", "initial"));

    // Trigger setDoc failure in snapshot initialization
    await act(async () => {
      mockOnSnapshotCallback({ exists: () => false });
      await new Promise((resolve) => setTimeout(resolve, 0)); // wait for promise rejection
    });

    expect(safeDisableNetwork).toHaveBeenCalled();

    // Mock setDoc failure for manual update
    vi.mocked(setDoc).mockRejectedValueOnce({ code: "resource-exhausted" });

    await act(async () => {
      result.current[1]("fail-value");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(safeDisableNetwork).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });

  it("handles snapshot errors gracefully", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() => useFirebaseSync("test-key", "initial"));

    act(() => {
      mockOnSnapshotErrorCallback({
        code: "resource-exhausted",
        message: "Quota exceeded",
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error syncing test-key from Firebase:",
      expect.any(Object),
    );
    expect(safeDisableNetwork).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
