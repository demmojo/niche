import { describe, it, expect, vi, beforeEach } from "vitest";
import admin from "firebase-admin";

vi.mock("firebase-admin", () => {
  return {
    default: {
      remoteConfig: vi.fn(() => ({
        getTemplate: vi.fn(),
      })),
    },
  };
});

describe("remoteConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should fetch model from remote config", async () => {
    const mockGetTemplate = vi.fn().mockResolvedValue({
      parameters: {
        gemini_model_name: {
          defaultValue: {
            value: "gemini-3.1-pro-preview",
          },
        },
      },
    });

    vi.mocked(admin.remoteConfig).mockReturnValue({
      getTemplate: mockGetTemplate,
    } as any);

    const { getResolvedModel } =
      await import("../../../server/utils/remoteConfig");
    const model = await getResolvedModel();

    expect(model).toBe("gemini-3.1-pro-preview");
    expect(mockGetTemplate).toHaveBeenCalledTimes(1);
  });

  it("should return fallback if remote config fetch fails", async () => {
    const mockGetTemplate = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    vi.mocked(admin.remoteConfig).mockReturnValue({
      getTemplate: mockGetTemplate,
    } as any);

    const { getResolvedModel } =
      await import("../../../server/utils/remoteConfig");
    const model = await getResolvedModel("fallback-model-123");

    expect(model).toBe("fallback-model-123");
    expect(mockGetTemplate).toHaveBeenCalledTimes(1);
  });

  it("should return fallback if remote config fetch fails and cachedModel already exists", async () => {
    // first set cache
    const mockGetTemplateSuccess = vi.fn().mockResolvedValue({
      parameters: {
        gemini_model_name: {
          defaultValue: { value: "cached-model" },
        },
      },
    });

    vi.mocked(admin.remoteConfig).mockReturnValue({
      getTemplate: mockGetTemplateSuccess,
    } as any);

    const { getResolvedModel } =
      await import("../../../server/utils/remoteConfig");
    await getResolvedModel();

    // Fast-forward time
    vi.useFakeTimers();
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

    // mock failure
    const mockGetTemplateFail = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));
    vi.mocked(admin.remoteConfig).mockReturnValue({
      getTemplate: mockGetTemplateFail,
    } as any);

    // It should return the cached model despite failure
    const model = await getResolvedModel("fallback");
    expect(model).toBe("cached-model");

    vi.useRealTimers();
  });

  it("should return fallback if parameter is missing", async () => {
    const mockGetTemplate = vi.fn().mockResolvedValue({
      parameters: {},
    });

    vi.mocked(admin.remoteConfig).mockReturnValue({
      getTemplate: mockGetTemplate,
    } as any);

    const { getResolvedModel } =
      await import("../../../server/utils/remoteConfig");
    const model = await getResolvedModel("fallback-model-123");

    expect(model).toBe("fallback-model-123");
    expect(mockGetTemplate).toHaveBeenCalledTimes(1);
  });

  it("should return fallback if parameter value is empty string", async () => {
    const mockGetTemplate = vi.fn().mockResolvedValue({
      parameters: {
        gemini_model_name: {
          defaultValue: { value: "" },
        },
      },
    });

    vi.mocked(admin.remoteConfig).mockReturnValue({
      getTemplate: mockGetTemplate,
    } as any);

    const { getResolvedModel } =
      await import("../../../server/utils/remoteConfig");
    const model = await getResolvedModel("fallback-model-123");

    expect(model).toBe("fallback-model-123");
    expect(mockGetTemplate).toHaveBeenCalledTimes(1);
  });

  it("should use cached value if within TTL", async () => {
    const mockGetTemplate = vi.fn().mockResolvedValue({
      parameters: {
        gemini_model_name: {
          defaultValue: { value: "gemini-model-1" },
        },
      },
    });

    vi.mocked(admin.remoteConfig).mockReturnValue({
      getTemplate: mockGetTemplate,
    } as any);

    const { getResolvedModel } =
      await import("../../../server/utils/remoteConfig");

    const model1 = await getResolvedModel();
    expect(model1).toBe("gemini-model-1");
    expect(mockGetTemplate).toHaveBeenCalledTimes(1);

    // Call again, should not fetch
    const model2 = await getResolvedModel();
    expect(model2).toBe("gemini-model-1");
    expect(mockGetTemplate).toHaveBeenCalledTimes(1); // Still 1
  });

  it("should refetch if TTL expired", async () => {
    vi.useFakeTimers();

    const mockGetTemplate = vi
      .fn()
      .mockResolvedValueOnce({
        parameters: {
          gemini_model_name: { defaultValue: { value: "model-1" } },
        },
      })
      .mockResolvedValueOnce({
        parameters: {
          gemini_model_name: { defaultValue: { value: "model-2" } },
        },
      });

    vi.mocked(admin.remoteConfig).mockReturnValue({
      getTemplate: mockGetTemplate,
    } as any);

    const { getResolvedModel } =
      await import("../../../server/utils/remoteConfig");

    const model1 = await getResolvedModel();
    expect(model1).toBe("model-1");
    expect(mockGetTemplate).toHaveBeenCalledTimes(1);

    // Advance time beyond CACHE_TTL (5 minutes)
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

    const model2 = await getResolvedModel();
    expect(model2).toBe("model-2");
    expect(mockGetTemplate).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
