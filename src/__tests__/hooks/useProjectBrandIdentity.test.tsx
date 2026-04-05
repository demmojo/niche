import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useProjectBrandIdentity } from "../../hooks/useProjectBrandIdentity";
import { SWRConfig } from "swr";
import React from "react";
import { getDocs, getDoc } from "firebase/firestore";

vi.mock("firebase/firestore", () => {
  return {
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
  };
});

vi.mock("../../firebase", () => ({
  db: {},
}));

describe("useProjectBrandIdentity", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return idle state when no projectId is provided", () => {
    const { result } = renderHook(() => useProjectBrandIdentity(null), {
      wrapper,
    });
    expect(result.current.status).toBe("idle");
  });

  it("should fetch and parse active version successfully", async () => {
    const activeData = {
      selected_identity: {
        visual_identity: {
          primary_color: "#112233",
          typography_pair: "Roboto",
        },
        positioning: { personality: "Bold" },
      },
    };

    vi.mocked(getDocs).mockResolvedValueOnce({
      empty: false,
      docs: [{ id: "doc1", data: () => activeData }],
    } as any);

    const { result } = renderHook(() => useProjectBrandIdentity("proj1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    if (result.current.status === "success") {
      expect(result.current.data.primary_color).toBe("#112233");
      expect(result.current.data.primary_fg).toBe("#FFFFFF");
      expect(result.current.data.tone).toBe("Bold");
      expect(result.current.data.typography).toBe("Roboto");
    }
  });

  it("should fallback to legacy schema if active version not found", async () => {
    const legacyData = {
      selected_identity: {
        visual_identity: { primary_color: "#FFFFFF", typography_pair: "Inter" },
        positioning: { personality: "Calm" },
      },
    };

    vi.mocked(getDocs).mockResolvedValueOnce({ empty: true } as any);
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => legacyData,
      id: "proj1",
    } as any);

    const { result } = renderHook(() => useProjectBrandIdentity("proj1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    if (result.current.status === "success") {
      expect(result.current.data.primary_color).toBe("#FFFFFF");
      expect(result.current.data.primary_fg).toBe("#000000"); // Contrast for white
    }
  });

  it("should return idle if no brand identity found at all", async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ empty: true } as any);
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
    } as any);

    const { result } = renderHook(() => useProjectBrandIdentity("proj1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });
  });

  it("should handle error during fetch", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Network fail"));

    const { result } = renderHook(() => useProjectBrandIdentity("proj1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });

  it("should fallback to default blue if hex is invalid", async () => {
    const activeData = {
      selected_identity: {
        visual_identity: {
          primary_color: "invalid-color",
          typography_pair: "Roboto",
        },
      },
    };

    vi.mocked(getDocs).mockResolvedValueOnce({
      empty: false,
      docs: [{ id: "doc1", data: () => activeData }],
    } as any);

    const { result } = renderHook(() => useProjectBrandIdentity("proj1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    if (result.current.status === "success") {
      expect(result.current.data.primary_color).toBe("#3B82F6"); // Default blue
    }
  });
});
