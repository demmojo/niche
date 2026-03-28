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

    // Mock getDoc resolving with { exists: () => false }
    vi.mocked(firestore.getDoc).mockResolvedValue({
      /**
       *
       */
      exists: () => false,
    } as any);

    // Mock onSnapshot doing nothing immediately
    vi.mocked(firestore.onSnapshot).mockImplementation(() => {
      return vi.fn(); // return an unsubscribe function
    });

    const { result } = renderHook(() => useActionCredits());

    // Should initially be 0, then immediately update to 50 when getDoc resolves
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
    vi.mocked(firestore.onSnapshot).mockImplementation((docRef, cb: any) => {
      snapshotCallback = cb;
      return vi.fn(); // unsubscribe
    });

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

  it("ignores snapshot update if document does not exist or missing field", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "test-uid" } } as any);
    vi.mocked(firestore.getDoc).mockResolvedValue({
      /**
       *
       */
      exists: () => true,
    } as any);

    let snapshotCallback: Function;
    vi.mocked(firestore.onSnapshot).mockImplementation((docRef, cb: any) => {
      snapshotCallback = cb;
      return vi.fn();
    });

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

    // Should still be 42
    expect(result.current).toBe(42);

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

    // Should still be 42
    expect(result.current).toBe(42);
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
});
