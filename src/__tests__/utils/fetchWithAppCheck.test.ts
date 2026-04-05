// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("fetchWithAppCheck", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.doMock("../../firebase", () => ({
      auth: {
        currentUser: null,
      },
    }));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe("initAppCheck", () => {
    it("catches and logs errors during initialization", async () => {
      vi.resetModules();
      vi.doMock("firebase/app", () => ({
        getApp: vi.fn().mockImplementation(() => {
          throw new Error("No app");
        }),
      }));
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: vi.fn(),
        ReCaptchaV3Provider: vi.fn(),
        getToken: vi.fn(),
      }));

      const { initAppCheck } = await import("../../utils/fetchWithAppCheck");
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      initAppCheck();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "AppCheck initialization failed:",
        expect.any(Error),
      );
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });

    it("initializes AppCheck if site key is present", async () => {
      vi.resetModules();
      const getAppMock = vi.fn().mockReturnValue({});
      vi.doMock("firebase/app", () => ({ getApp: getAppMock }));
      const initAppCheckMock = vi.fn().mockReturnValue({ dummy: "instance" });
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: initAppCheckMock,
        ReCaptchaV3Provider: vi.fn(),
        getToken: vi.fn(),
      }));

      const { initAppCheck } = await import("../../utils/fetchWithAppCheck");
      vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");

      const instance = initAppCheck();

      expect(getAppMock).toHaveBeenCalled();
      expect(initAppCheckMock).toHaveBeenCalled();
      expect(instance).toBeDefined();
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });
  });

  describe("getAppCheckToken", () => {
    it("returns null if appCheck fails to initialize", async () => {
      vi.resetModules();
      vi.doMock("firebase/app", () => ({
        getApp: vi.fn().mockImplementation(() => {
          throw new Error("No app");
        }),
      }));
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: vi.fn(),
        ReCaptchaV3Provider: vi.fn(),
        getToken: vi.fn(),
      }));

      const { getAppCheckToken } =
        await import("../../utils/fetchWithAppCheck");
      const token = await getAppCheckToken();
      expect(token).toBeNull();
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });

    it("fetches and returns a token", async () => {
      vi.resetModules();
      vi.doMock("firebase/app", () => ({
        getApp: vi.fn().mockReturnValue({}),
      }));
      const getTokenMock = vi.fn().mockResolvedValue({ token: "test-token" });
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: vi.fn().mockReturnValue({ dummy: "instance" }),
        ReCaptchaV3Provider: vi.fn(),
        getToken: getTokenMock,
      }));

      const { getAppCheckToken } =
        await import("../../utils/fetchWithAppCheck");
      vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");

      const token = await getAppCheckToken();
      expect(getTokenMock).toHaveBeenCalled();
      expect(token).toBe("test-token");
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });
  });

  describe("fetchWithAppCheck", () => {
    it("skips AppCheck in test environment", async () => {
      vi.resetModules();
      const { fetchWithAppCheck } =
        await import("../../utils/fetchWithAppCheck");
      process.env.NODE_ENV = "test";
      const fetchMock = vi.fn().mockResolvedValue(new Response());
      vi.stubGlobal("fetch", fetchMock);

      await fetchWithAppCheck("https://example.com");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://example.com",
        expect.objectContaining({
          headers: expect.any(Headers),
        }),
      );
      const callArgs = (fetchMock as any).mock.calls[0][1];
      expect(callArgs.headers.has("X-Firebase-AppCheck")).toBe(false);
    });

    it("adds AppCheck token in non-test environment", async () => {
      vi.resetModules();
      vi.doMock("firebase/app", () => ({
        getApp: vi.fn().mockReturnValue({}),
      }));
      const getTokenMock = vi.fn().mockResolvedValue({ token: "prod-token" });
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: vi.fn().mockReturnValue({ dummy: "instance" }),
        ReCaptchaV3Provider: vi.fn(),
        getToken: getTokenMock,
      }));

      const { fetchWithAppCheck } =
        await import("../../utils/fetchWithAppCheck");
      process.env.NODE_ENV = "production";
      vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");

      const fetchMock = vi.fn().mockResolvedValue(new Response());
      vi.stubGlobal("fetch", fetchMock);

      await fetchWithAppCheck("https://example.com");

      expect(fetchMock).toHaveBeenCalled();
      const callArgs = (fetchMock as any).mock.calls[0][1];
      expect(callArgs.headers.get("X-Firebase-AppCheck")).toBe("prod-token");
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });

    it("retries getIdToken on network error with exponential backoff", async () => {
      vi.resetModules();
      process.env.NODE_ENV = "production";

      const networkError = new Error("Network Error");
      (networkError as any).code = "auth/network-request-failed";

      const getIdTokenMock = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce("success-token");

      vi.doMock("../../firebase", () => ({
        auth: {
          currentUser: {
            getIdToken: getIdTokenMock,
          },
        },
      }));

      vi.doMock("firebase/app", () => ({
        getApp: vi.fn().mockReturnValue({}),
      }));
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: vi.fn(),
        ReCaptchaV3Provider: vi.fn(),
        getToken: vi.fn().mockResolvedValue({ token: "prod-token" }),
      }));

      const { fetchWithAppCheck } =
        await import("../../utils/fetchWithAppCheck");

      const fetchMock = vi.fn().mockResolvedValue(new Response());
      vi.stubGlobal("fetch", fetchMock);

      await fetchWithAppCheck("https://example.com");

      expect(getIdTokenMock).toHaveBeenCalledTimes(3);
      expect(fetchMock).toHaveBeenCalled();
      const callArgs = (fetchMock as any).mock.calls[0][1];
      expect(callArgs.headers.get("Authorization")).toBe(
        "Bearer success-token",
      );

      vi.doUnmock("../../firebase");
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });

    it("bubbles up error if getIdToken persistently fails (circuit breaker trips)", async () => {
      vi.resetModules();
      process.env.NODE_ENV = "production";

      const networkError = new Error("Persistent Network Error");
      (networkError as any).code = "auth/network-request-failed";

      const getIdTokenMock = vi.fn().mockRejectedValue(networkError);

      vi.doMock("../../firebase", () => ({
        auth: {
          currentUser: {
            getIdToken: getIdTokenMock,
          },
        },
      }));

      vi.doMock("firebase/app", () => ({
        getApp: vi.fn().mockReturnValue({}),
      }));
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: vi.fn(),
        ReCaptchaV3Provider: vi.fn(),
        getToken: vi.fn().mockResolvedValue({ token: "prod-token" }),
      }));

      const { fetchWithAppCheck } =
        await import("../../utils/fetchWithAppCheck");

      const fetchMock = vi.fn().mockResolvedValue(new Response());
      vi.stubGlobal("fetch", fetchMock);

      await expect(fetchWithAppCheck("https://example.com")).rejects.toThrow(
        "Persistent Network Error",
      );

      expect(getIdTokenMock).toHaveBeenCalledTimes(3);
      expect(fetchMock).not.toHaveBeenCalled();

      vi.doUnmock("../../firebase");
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });

    it("does not retry and immediately throws on hard auth errors", async () => {
      vi.resetModules();
      process.env.NODE_ENV = "production";

      const hardError = new Error("Token Expired");
      (hardError as any).code = "auth/user-token-expired";

      const getIdTokenMock = vi.fn().mockRejectedValue(hardError);

      vi.doMock("../../firebase", () => ({
        auth: {
          currentUser: {
            getIdToken: getIdTokenMock,
          },
        },
      }));

      vi.doMock("firebase/app", () => ({
        getApp: vi.fn().mockReturnValue({}),
      }));
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: vi.fn(),
        ReCaptchaV3Provider: vi.fn(),
        getToken: vi.fn().mockResolvedValue({ token: "prod-token" }),
      }));

      const { fetchWithAppCheck } =
        await import("../../utils/fetchWithAppCheck");

      const fetchMock = vi.fn().mockResolvedValue(new Response());
      vi.stubGlobal("fetch", fetchMock);

      await expect(fetchWithAppCheck("https://example.com")).rejects.toThrow(
        "Token Expired",
      );

      expect(getIdTokenMock).toHaveBeenCalledTimes(1); // Should only be called once
      expect(fetchMock).not.toHaveBeenCalled();

      vi.doUnmock("../../firebase");
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });

    it("aborts retry loop immediately if AbortSignal is aborted", async () => {
      vi.resetModules();
      process.env.NODE_ENV = "production";

      const networkError = new Error("Network Error");
      (networkError as any).code = "auth/network-request-failed";

      const getIdTokenMock = vi.fn().mockRejectedValue(networkError);

      vi.doMock("../../firebase", () => ({
        auth: {
          currentUser: {
            getIdToken: getIdTokenMock,
          },
        },
      }));

      vi.doMock("firebase/app", () => ({
        getApp: vi.fn().mockReturnValue({}),
      }));
      vi.doMock("firebase/app-check", () => ({
        initializeAppCheck: vi.fn(),
        ReCaptchaV3Provider: vi.fn(),
        getToken: vi.fn().mockResolvedValue({ token: "prod-token" }),
      }));

      const { fetchWithAppCheck } =
        await import("../../utils/fetchWithAppCheck");

      const fetchMock = vi.fn().mockResolvedValue(new Response());
      vi.stubGlobal("fetch", fetchMock);

      const controller = new AbortController();

      // Abort after a short delay (during the first backoff sleep)
      setTimeout(() => controller.abort(), 100);

      await expect(
        fetchWithAppCheck("https://example.com", { signal: controller.signal }),
      ).rejects.toThrow("Aborted");

      expect(getIdTokenMock).toHaveBeenCalledTimes(1); // Should only be called once before abortion
      expect(fetchMock).not.toHaveBeenCalled();

      vi.doUnmock("../../firebase");
      vi.doUnmock("firebase/app");
      vi.doUnmock("firebase/app-check");
    });
  });
});
