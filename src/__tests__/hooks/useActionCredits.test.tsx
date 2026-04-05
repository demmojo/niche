import { renderHook, waitFor, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useActionCredits } from "../../hooks/useActionCredits";
import { useAuth } from "../../components/AuthProvider";
import * as firestore from "firebase/firestore";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock("../../firebase", () => ({
  db: {},
}));

describe("useActionCredits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 and does not fetch if user is not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useActionCredits());

    expect(result.current).toBe(0);
    expect(firestore.getDoc).not.toHaveBeenCalled();
    expect(firestore.onSnapshot).not.toHaveBeenCalled();
  });

  it("sets credits to 50 if document does not exist initially", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "test-uid" } } as any);

    let snapshotCallback: Function;
    vi.mocked(firestore.onSnapshot).mockImplementation(
      (docRef, optionsOrCb: any, cbOrErr?: any) => {
        if (typeof optionsOrCb === "function") {
          snapshotCallback = optionsOrCb;
        } else {
          snapshotCallback = cbOrErr;
        }
        return vi.fn(); // unsubscribe
      },
    );

    const { result } = renderHook(() => useActionCredits());

    act(() => {
      snapshotCallback!({
        exists: () => false,
      });
    });

    await waitFor(() => {
      expect(result.current).toBe(50);
    });
  });

  it("updates credits when onSnapshot triggers with new data", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "test-uid" } } as any);

    vi.mocked(firestore.getDoc).mockResolvedValue({
      /**
       *
       */
      exists: () => true, // doc exists, so fallback is ignored
    } as any);

    let snapshotCallback: Function;
    vi.mocked(firestore.onSnapshot).mockImplementation(
      (docRef, optionsOrCb: any, cbOrErr?: any) => {
        if (typeof optionsOrCb === "function") {
          snapshotCallback = optionsOrCb;
        } else {
          snapshotCallback = cbOrErr;
        }
        return vi.fn(); // unsubscribe
      },
    );

    const { result } = renderHook(() => useActionCredits());

    // Trigger snapshot update
    act(() => {
      snapshotCallback!({
        /**
         *
         */
        exists: () => true,
        /**
         *
         */
        data: () => ({ actionCredits: 35 }),
      });
    });

    expect(result.current).toBe(35);

    // Trigger another update
    act(() => {
      snapshotCallback!({
        /**
         *
         */
        exists: () => true,
        /**
         *
         */
        data: () => ({ actionCredits: 30 }),
      });
    });

    expect(result.current).toBe(30);
  });

  it("sets credits to 50 if document does not exist, and ignores update if missing field", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "test-uid" } } as any);
    vi.mocked(firestore.getDoc).mockResolvedValue({
      /**
       *
       */
      exists: () => true,
    } as any);

    let snapshotCallback: Function;
    vi.mocked(firestore.onSnapshot).mockImplementation(
      (docRef, optionsOrCb: any, cbOrErr?: any) => {
        if (typeof optionsOrCb === "function") {
          snapshotCallback = optionsOrCb;
        } else {
          snapshotCallback = cbOrErr;
        }
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useActionCredits());

    // Set some valid data first
    act(() => {
      snapshotCallback!({
        /**
         *
         */
        exists: () => true,
        /**
         *
         */
        data: () => ({ actionCredits: 42 }),
      });
    });
    expect(result.current).toBe(42);

    // Provide invalid snapshot (does not exist)
    act(() => {
      snapshotCallback!({
        /**
         *
         */
        exists: () => false,
        /**
         *
         */
        data: () => ({}),
      });
    });

    // Should be 50 now
    expect(result.current).toBe(50);

    // Provide snapshot without actionCredits field
    act(() => {
      snapshotCallback!({
        /**
         *
         */
        exists: () => true,
        /**
         *
         */
        data: () => ({ otherField: "foo" }),
      });
    });

    // Should still be 50
    expect(result.current).toBe(50);
  });

  it("cleans up onSnapshot listener on unmount", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "test-uid" } } as any);
    vi.mocked(firestore.getDoc).mockResolvedValue({
      /**
       *
       */
      exists: () => true,
    } as any);

    const unsubscribeMock = vi.fn();
    vi.mocked(firestore.onSnapshot).mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useActionCredits());

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it("handles snapshot error", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "test-uid" } } as any);

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    let errorCallback: Function;
    vi.mocked(firestore.onSnapshot).mockImplementation(
      (docRef, optionsOrCb: any, cbOrErr?: any, errCb?: any) => {
        if (typeof optionsOrCb === "function") {
          errorCallback = cbOrErr;
        } else {
          errorCallback = errCb;
        }
        return vi.fn();
      },
    );

    renderHook(() => useActionCredits());

    errorCallback!(new Error("Test Error"));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Snapshot error:",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("ignores snapshot and error after unmount", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "test-uid" } } as any);

    let snapshotCallback: Function;
    let errorCallback: Function;
    vi.mocked(firestore.onSnapshot).mockImplementation(
      (docRef, optionsOrCb: any, cbOrErr?: any, errCb?: any) => {
        if (typeof optionsOrCb === "function") {
          snapshotCallback = optionsOrCb;
          errorCallback = cbOrErr;
        } else {
          snapshotCallback = cbOrErr;
          errorCallback = errCb;
        }
        return vi.fn();
      },
    );

    const { unmount, result } = renderHook(() => useActionCredits());
    unmount();

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    act(() => {
      snapshotCallback!({ exists: () => false });
      errorCallback!(new Error("Test Error"));
    });

    expect(result.current).toBe(0); // Never updated to 50
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
