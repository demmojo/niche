import { renderHook, act, waitFor } from "../../test-utils/render";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    vi.useFakeTimers();
    vi.resetAllMocks();
    mockOnSnapshotCallback = undefined;
    mockOnSnapshotErrorCallback = undefined;

    vi.mocked(doc).mockReturnValue("mock-doc-ref" as any);

    vi.mocked(onSnapshot).mockImplementation(
      (_docRef: any, optionsOrCb: any, cbOrErr: any, onError?: any) => {
        if (typeof optionsOrCb === "function") {
          mockOnSnapshotCallback = optionsOrCb;
          mockOnSnapshotErrorCallback = cbOrErr;
        } else {
          mockOnSnapshotCallback = cbOrErr;
          mockOnSnapshotErrorCallback = onError;
        }
        return vi.fn(); // unsubscribe function
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
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
      mockOnSnapshotCallback({
        exists: () => false,
        metadata: { hasPendingWrites: false },
      });
    });

    // Should no longer call setDoc on initialization
    expect(setDoc).not.toHaveBeenCalled();
    expect(result.current[0]).toBe("initial");
  });

  it("updates state when snapshot contains data", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    const { result } = renderHook(() => useFirebaseSync("test-key", "initial"));

    act(() => {
      mockOnSnapshotCallback({
        exists: () => true,
        data: () => ({ value: "remote-value" }),
        metadata: { hasPendingWrites: false },
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

    act(() => {
      vi.runAllTimers();
    });

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
        metadata: { hasPendingWrites: false },
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

    act(() => {
      vi.runAllTimers();
    });

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
      mockOnSnapshotCallback({
        exists: () => false,
        metadata: { hasPendingWrites: false },
      });
    });

    // Should not call setDoc on init
    expect(setDoc).not.toHaveBeenCalled();

    act(() => {
      result.current[1](undefined);
    });

    act(() => {
      vi.runAllTimers();
    });

    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { value: null },
      { merge: true },
    );
  });

  it("handles network errors by disabling network safely", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    // Mock setDoc to throw resource-exhausted
    vi.mocked(setDoc).mockRejectedValueOnce({ code: "resource-exhausted" });

    const { result } = renderHook(() => useFirebaseSync("test-key", "initial"));

    // Mock setDoc failure for manual update
    vi.mocked(setDoc).mockRejectedValueOnce({ code: "resource-exhausted" });

    await act(async () => {
      result.current[1]("fail-value");
      await vi.runAllTimersAsync();
    });

    expect(safeDisableNetwork).toHaveBeenCalledTimes(1);
  });

  it("handles snapshot errors gracefully", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    renderHook(() => useFirebaseSync("test-key", "initial"));

    // Ensure mockOnSnapshotCallback is set by onSnapshot
    expect(mockOnSnapshotErrorCallback).toBeDefined();

    act(() => {
      mockOnSnapshotErrorCallback({
        code: "resource-exhausted",
        message: "Quota exceeded",
      });
    });

    expect(safeDisableNetwork).toHaveBeenCalled();
  });

  it("returns early when docSnap.metadata.hasPendingWrites is true (lines 54-55)", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);
    const { result } = renderHook(() =>
      useFirebaseSync<string>("testKey", "initial"),
    );

    act(() => {
      mockOnSnapshotCallback({
        exists: () => true,
        data: () => ({ value: "ignored-value" }),
        metadata: { hasPendingWrites: true },
      });
    });

    // Should not have updated state because it was ignored
    expect(result.current[0]).toBe("initial");
  });

  it("clears syncTimeoutRef.current on sequential setValue calls (lines 105-106)", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);
    const { result } = renderHook(() =>
      useFirebaseSync<string>("testKey", "initial"),
    );

    act(() => {
      // simulate snapshot init so setDoc isn't called for initialization
      mockOnSnapshotCallback({
        exists: () => true,
        data: () => ({ value: "initial" }),
        metadata: { hasPendingWrites: false },
      });
    });

    // Clear initial mock calls
    vi.mocked(setDoc).mockClear();

    act(() => {
      result.current[1]("first-update");
    });

    act(() => {
      result.current[1]("second-update");
    });

    // Advance by 2 seconds to trigger the final timeout
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    // setDoc should have only been called once for the second update, not the first
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { value: "second-update" },
      { merge: true },
    );
  });

  it("handles undefined newValue (line 111)", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);
    const { result } = renderHook(() =>
      useFirebaseSync<string | undefined>("testKey", "initial"),
    );

    act(() => {
      mockOnSnapshotCallback({
        exists: () => true,
        data: () => ({ value: "initial" }),
        metadata: { hasPendingWrites: false },
      });
    });

    vi.mocked(setDoc).mockClear();

    act(() => {
      result.current[1](undefined);
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(setDoc).toHaveBeenCalledWith(
      "mock-doc-ref",
      { value: null },
      { merge: true },
    );
  });

  it("ignores snapshot and error after unmount", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user123" } } as any);

    const { unmount, result } = renderHook(() =>
      useFirebaseSync("test-key", "initial"),
    );

    unmount();

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    act(() => {
      mockOnSnapshotCallback({
        exists: () => true,
        data: () => ({ value: "ignored-value" }),
        metadata: { hasPendingWrites: false },
      });
      mockOnSnapshotErrorCallback(new Error("Test Error"));
    });

    expect(result.current[0]).toBe("initial"); // State was not updated
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
