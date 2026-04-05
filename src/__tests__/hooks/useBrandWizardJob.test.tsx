import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useBrandWizardJob } from "../../hooks/useBrandWizardJob";
import { onSnapshot, doc } from "firebase/firestore";

vi.mock("firebase/firestore", () => {
  return {
    doc: vi.fn(),
    onSnapshot: vi.fn(),
    getFirestore: vi.fn(() => ({})),
    initializeFirestore: vi.fn(() => ({})),
    memoryLocalCache: vi.fn(),
    setLogLevel: vi.fn(),
  };
});

describe("useBrandWizardJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return null job and error if no jobId is provided", () => {
    const { result } = renderHook(() => useBrandWizardJob(null));
    expect(result.current.job).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should set job state when snapshot returns existing document", async () => {
    const unsubscribeMock = vi.fn();
    let snapshotCallback: Function;

    vi.mocked(onSnapshot).mockImplementation(
      (ref, options, onNext, onError) => {
        snapshotCallback = onNext as Function;
        return unsubscribeMock;
      },
    );

    const { result } = renderHook(() => useBrandWizardJob("job123"));

    const mockSnapshot = {
      exists: () => true,
      id: "job123",
      data: () => ({
        status: "completed",
        projectId: "proj1",
      }),
      metadata: { hasPendingWrites: false },
    };

    await act(async () => {
      snapshotCallback(mockSnapshot);
    });

    await waitFor(() => {
      expect(result.current.job).toEqual({
        id: "job123",
        status: "completed",
        projectId: "proj1",
      });
      expect(result.current.error).toBeNull();
    });
  });

  it("should set job to null and return error when snapshot document does not exist", async () => {
    const unsubscribeMock = vi.fn();
    let snapshotCallback: Function;

    vi.mocked(onSnapshot).mockImplementation(
      (ref, options, onNext, onError) => {
        snapshotCallback = onNext as Function;
        return unsubscribeMock;
      },
    );

    const { result } = renderHook(() => useBrandWizardJob("job123"));

    const mockSnapshot = {
      exists: () => false,
      metadata: { hasPendingWrites: false },
    };

    await act(async () => {
      snapshotCallback(mockSnapshot);
    });

    await waitFor(() => {
      expect(result.current.job).toBeNull();
      expect(result.current.error).toBe("Job not found.");
    });
  });

  it("should set error when snapshot throws an error", async () => {
    const unsubscribeMock = vi.fn();
    let errorCallback: Function;

    vi.mocked(onSnapshot).mockImplementation(
      (ref, options, onNext, onError) => {
        errorCallback = onError as Function;
        return unsubscribeMock;
      },
    );

    const { result } = renderHook(() => useBrandWizardJob("job123"));

    await act(async () => {
      errorCallback(new Error("Firebase permission denied"));
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Firebase permission denied");
    });
  });

  it("should ignore callbacks if component unmounts (AbortController)", async () => {
    const unsubscribeMock = vi.fn();
    let snapshotCallback: Function;
    let errorCallback: Function;

    vi.mocked(onSnapshot).mockImplementation(
      (ref, options, onNext, onError) => {
        snapshotCallback = onNext as Function;
        errorCallback = onError as Function;
        return unsubscribeMock;
      },
    );

    const { result, unmount } = renderHook(() => useBrandWizardJob("job123"));

    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();

    await act(async () => {
      snapshotCallback({
        exists: () => true,
        id: "job123",
        data: () => ({ status: "completed" }),
        metadata: { hasPendingWrites: false },
      });
      errorCallback(new Error("test error"));
    });

    // Should remain initial state since callbacks returned early
    expect(result.current.job).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
