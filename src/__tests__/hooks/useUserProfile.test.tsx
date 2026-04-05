import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useAuth } from "../../components/AuthProvider";
import { onSnapshot } from "firebase/firestore";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock("../../firebase", () => ({
  db: {},
}));

describe("useUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null profile and loading false if no user", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useUserProfile());

    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("should fetch profile if user exists", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user1" } } as any);

    // Mock onSnapshot to immediately call the success callback
    vi.mocked(onSnapshot).mockImplementation((docRef, onNext: any) => {
      setTimeout(() => {
        onNext({
          exists: () => true,
          data: () => ({ persona: "solo_founder" }),
        });
      }, 10);
      return vi.fn(); // return unsubscribe
    });

    const { result } = renderHook(() => useUserProfile());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual({ persona: "solo_founder" });
  });

  it("should return null if doc does not exist", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user1" } } as any);

    vi.mocked(onSnapshot).mockImplementation((docRef, onNext: any) => {
      setTimeout(() => {
        onNext({
          exists: () => false,
        });
      }, 10);
      return vi.fn();
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
  });

  it("should handle error in onSnapshot gracefully", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user1" } } as any);

    vi.mocked(onSnapshot).mockImplementation(
      (docRef, onNext: any, onError: any) => {
        setTimeout(() => {
          onError(new Error("Firestore error"));
        }, 10);
        return vi.fn();
      },
    );

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // profile remains null, loading false
    expect(result.current.profile).toBeNull();
  });

  it("should abort if unmounted before fetch completes", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: "user1" } } as any);

    let triggerSuccess: any;
    vi.mocked(onSnapshot).mockImplementation((docRef, onNext: any) => {
      triggerSuccess = onNext;
      return vi.fn(); // unsubscribe
    });

    const { result, unmount } = renderHook(() => useUserProfile());

    // Unmount before snapshot resolves
    unmount();

    // Trigger success
    triggerSuccess({
      exists: () => true,
      data: () => ({ persona: "solo_founder" }),
    });

    // state shouldn't update because controller aborted
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(true);
  });
});
