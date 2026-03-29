import { renderHook, act } from "@testing-library/react";
import { usePQLUpgrade } from "../../hooks/usePQLUpgrade";
import { AuthProvider, useAuth } from "../../components/AuthProvider";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import * as firebaseAuth from "firebase/auth";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.delete("http://127.0.0.1:*/*", () => {
    return; // Pass through to emulator
  }),
);
server.events.on("request:unhandled", (req) => {
  // bypass silently
});

beforeAll(() => server.listen());
afterAll(() => server.close());

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual("firebase/auth");
  return {
    ...actual,
    onAuthStateChanged: vi.fn(() => vi.fn()),
    signInAnonymously: vi.fn(),
    getAuth: vi.fn(() => ({
      currentUser: {
        isAnonymous: true,
        uid: "anon-123",
        getIdToken: vi.fn().mockResolvedValue("mock-anon-token"),
      },
      updateCurrentUser: vi.fn(),
    })),
    signInWithPopup: vi.fn(),
    linkWithPopup: vi.fn(),
    signInWithCredential: vi.fn(),
    GoogleAuthProvider: class {
      static credentialFromError = vi.fn().mockReturnValue("mock-cred");
    },
  };
});

describe("usePQLUpgrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await vi.runOnlyPendingTimersAsync();
    vi.useRealTimers();
  });

  it("handles the happy path account upgrade directly via linkWithPopup", async () => {
    vi.mocked(firebaseAuth.linkWithPopup).mockResolvedValueOnce({
      user: {
        uid: "perm-456",
        getIdToken: vi.fn().mockResolvedValue("mock-perm-token"),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => usePQLUpgrade(), { wrapper });

    await act(async () => {
      const success = await result.current.upgradeAccount();
      expect(success).toBe(true);
    });

    // We shouldn't fetch merge if linkWithPopup succeeded
    expect(result.current.error).toBeNull();
  });

  it("handles credential-already-in-use conflict with 202 async merge and isMergingRef lock", async () => {
    vi.useFakeTimers();

    // 1. Force linkWithPopup to throw conflict
    const conflictError: any = new Error("Conflict");
    conflictError.code = "auth/credential-already-in-use";
    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce(conflictError);

    // 2. Mock signInWithCredential to succeed
    vi.mocked(firebaseAuth.signInWithCredential).mockResolvedValueOnce({
      user: {
        uid: "perm-456",
        getIdToken: vi.fn().mockResolvedValue("mock-perm-token"),
      },
    } as any);

    let mergeCompleted = false;

    // 3. Setup MSW to return 202 Accepted and resolve in background
    server.use(
      http.post("*/api/auth/merge-anonymous-data", async () => {
        // Floating Promise to simulate background worker
        Promise.resolve().then(async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          mergeCompleted = true; // Background task complete
        });

        // Return 202 immediately
        return HttpResponse.json(
          { status: "processing", jobId: "job-123" },
          { status: 202 },
        );
      }),
    );

    let capturedRef: any = null;

    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <AuthProvider>
          <AuthRefCapture setRef={(r) => (capturedRef = r)}>
            {children}
          </AuthRefCapture>
        </AuthProvider>
      );
    };

    // Helper to capture the context ref
    const AuthRefCapture = ({ children, setRef }: any) => {
      const { isMergingRef } = useAuth();
      setRef(isMergingRef);
      return <>{children}</>;
    };

    const { result } = renderHook(() => usePQLUpgrade(), { wrapper });

    // The upgrade process starts and finishes because it returns 202 accepted immediately
    await act(async () => {
      const success = await result.current.upgradeAccount();
      expect(success).toBe(true);
    });

    // The backend hasn't finished the floating promise, but the merge endpoint returned 202.
    // Trigger the background worker completion
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(mergeCompleted).toBe(true);
    expect(result.current.error).toBeNull();
  });
});
