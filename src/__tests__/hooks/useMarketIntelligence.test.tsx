import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMarketIntelligence } from "../../hooks/useMarketIntelligence";
import { onSnapshot, collection, query } from "firebase/firestore";

vi.mock("firebase/firestore", () => {
  return {
    collection: vi.fn(),
    query: vi.fn(),
    onSnapshot: vi.fn(),
    getFirestore: vi.fn(() => ({})),
    initializeFirestore: vi.fn(() => ({})),
    memoryLocalCache: vi.fn(),
    setLogLevel: vi.fn(),
  };
});

describe("useMarketIntelligence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with loading state", () => {
    const unsubscribeMock = vi.fn();
    vi.mocked(onSnapshot).mockReturnValue(unsubscribeMock);

    const { result } = renderHook(() =>
      useMarketIntelligence("test-collection"),
    );

    expect(result.current.status).toBe("loading");
  });

  it("should update state to success when snapshot returns data", async () => {
    const unsubscribeMock = vi.fn();
    let snapshotCallback: Function;

    vi.mocked(onSnapshot).mockImplementation((q, options, onNext, onError) => {
      snapshotCallback = onNext as Function;
      return unsubscribeMock;
    });

    const { result } = renderHook(() =>
      useMarketIntelligence("test-collection"),
    );

    const mockSnapshot = {
      docs: [
        { id: "doc1", data: () => ({ name: "test item 1" }) },
        { id: "doc2", data: () => ({ name: "test item 2" }) },
      ],
    };

    await act(async () => {
      snapshotCallback(mockSnapshot);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
      if (result.current.status === "success") {
        expect(result.current.data).toEqual([
          { id: "doc1", name: "test item 1" },
          { id: "doc2", name: "test item 2" },
        ]);
      }
    });
  });

  it("should update state to error when snapshot throws an error", async () => {
    const unsubscribeMock = vi.fn();
    let errorCallback: Function;

    vi.mocked(onSnapshot).mockImplementation((q, options, onNext, onError) => {
      errorCallback = onError as Function;
      return unsubscribeMock;
    });

    const { result } = renderHook(() =>
      useMarketIntelligence("test-collection"),
    );

    const mockError = new Error("Firebase error");

    await act(async () => {
      errorCallback(mockError);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      if (result.current.status === "error") {
        expect(result.current.error).toBe(mockError);
      }
    });
  });

  it("should catch synchronous errors during query setup", () => {
    vi.mocked(query).mockImplementation(() => {
      throw new Error("Invalid query constraints");
    });

    const { result } = renderHook(() =>
      useMarketIntelligence("test-collection"),
    );

    expect(result.current.status).toBe("error");
    if (result.current.status === "error") {
      expect(result.current.error.message).toBe("Invalid query constraints");
    }
  });

  it("should safely ignore callbacks if component unmounts (AbortController)", async () => {
    const unsubscribeMock = vi.fn();
    let snapshotCallback: Function;
    let errorCallback: Function;

    vi.mocked(onSnapshot).mockImplementation((q, options, onNext, onError) => {
      snapshotCallback = onNext as Function;
      errorCallback = onError as Function;
      return unsubscribeMock;
    });

    const { result, unmount } = renderHook(() =>
      useMarketIntelligence("test-collection"),
    );

    // Unmount before callbacks fire
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();

    // Callbacks should return early due to controller.signal.aborted
    await act(async () => {
      snapshotCallback({ docs: [] });
      errorCallback(new Error("test"));
    });

    // State should remain loading
    expect(result.current.status).toBe("loading");
  });
});
