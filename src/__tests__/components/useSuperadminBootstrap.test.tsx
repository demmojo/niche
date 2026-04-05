import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSuperadminBootstrap } from "../../components/useSuperadminBootstrap";
import { useAuth } from "../../components/AuthProvider";
import {
  useWorkspaceDispatch,
  useWorkspaceLoading,
} from "../../components/WorkspaceProvider";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../components/WorkspaceProvider", () => ({
  useWorkspaceDispatch: vi.fn(),
  useWorkspaceLoading: vi.fn(),
}));

describe("useSuperadminBootstrap", () => {
  const mockSetWorkspaceId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useWorkspaceDispatch as any).mockReturnValue(mockSetWorkspaceId);
    (useWorkspaceLoading as any).mockReturnValue(false); // Make it not loading so it can bootstrap
  });

  it("sets default kageform workspace when user has superadmin claims", async () => {
    (useAuth as any).mockReturnValue({
      user: {
        uid: "123",
        email: "admin@test.com",
        getIdTokenResult: vi
          .fn()
          .mockResolvedValue({ claims: { superadmin: true } }),
      },
    });

    renderHook(() => useSuperadminBootstrap());

    await waitFor(() => {
      expect(mockSetWorkspaceId).toHaveBeenCalledWith("prod-kageform");
    });
  });

  it("does nothing if user is not superadmin", () => {
    (useAuth as any).mockReturnValue({
      user: {
        uid: "123",
        email: "user@test.com",
        getIdTokenResult: vi
          .fn()
          .mockResolvedValue({ claims: { superadmin: false } }),
      },
    });

    renderHook(() => useSuperadminBootstrap());

    expect(mockSetWorkspaceId).not.toHaveBeenCalled();
  });

  it("does nothing if loading", () => {
    (useAuth as any).mockReturnValue({
      user: {
        uid: "123",
        email: "admin@test.com",
        getIdTokenResult: vi
          .fn()
          .mockResolvedValue({ claims: { superadmin: true } }),
      },
    });
    (useWorkspaceLoading as any).mockReturnValue(true);

    renderHook(() => useSuperadminBootstrap());

    expect(mockSetWorkspaceId).not.toHaveBeenCalled();
  });
});
