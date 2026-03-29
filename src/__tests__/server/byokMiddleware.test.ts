import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  encryptKey,
  decryptKey,
  saveByokKey,
  injectByokKey,
} from "../../server/byokMiddleware";
import { Request, Response } from "express";

// Mock firebase-admin
vi.mock("firebase-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase-admin")>();
  const dbMock = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue(undefined),
  };
  const firestoreMock = Object.assign(
    vi.fn(() => dbMock),
    {
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
      },
    },
  );
  return {
    ...actual,
    default: {
      ...actual,
      firestore: firestoreMock,
    },
    firestore: firestoreMock,
  };
});
import * as admin from "firebase-admin";

describe("byokMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Encryption & Decryption", () => {
    it("encrypts and decrypts a key successfully", () => {
      const originalText = "my-secret-api-key";
      const encrypted = encryptKey(originalText);

      expect(encrypted).not.toBe(originalText);
      expect(encrypted.split(":")).toHaveLength(3); // iv, authTag, encryptedText

      const decrypted = decryptKey(encrypted);
      expect(decrypted).toBe(originalText);
    });
  });

  describe("saveByokKey", () => {
    it("returns 400 if provider or apiKey are missing", async () => {
      const req = { body: {} } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      await saveByokKey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "provider and apiKey are required.",
      });
    });

    it("saves key, sets cookie and logs telemetry successfully", async () => {
      const req = {
        body: { provider: "llm", apiKey: "test-key" },
        user: { uid: "user123", email: "test@nicheai.com" },
      } as any;

      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      await saveByokKey(req, res);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Set-Cookie",
        expect.stringContaining("niche_llm_byok"),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "llm API Key secured.",
      });

      // Verify telemetry
      const db = admin.firestore();
      expect(db.collection).toHaveBeenCalledWith("telemetry_events");
      expect((db as any).doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "revenue_signal",
          payload: expect.objectContaining({
            upgradeType: "byok_enabled",
            provider: "llm",
            userId: "user123",
            isTestAccount: true,
          }),
        }),
        { merge: true },
      );
    });

    it("catches and suppresses telemetry errors", async () => {
      const req = {
        body: { provider: "llm", apiKey: "test-key" },
        user: { uid: "user123" },
      } as any;

      const res = {
        setHeader: vi.fn(),
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const db = admin.firestore();
      ((db as any).doc().set as any).mockRejectedValueOnce(
        new Error("DB Error"),
      );

      await saveByokKey(req, res);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to log telemetry for BYOK:",
        expect.any(Error),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("injectByokKey", () => {
    it("injects keys into request if cookies are present", () => {
      const encryptedLlm = encryptKey("llm-key-123");
      const encryptedApollo = encryptKey("apollo-key-123");

      const req = {
        headers: {
          cookie: `niche_llm_byok=${encryptedLlm}; niche_apollo_byok=${encryptedApollo}`,
        },
      } as any;
      const res = {} as Response;
      const next = vi.fn();

      injectByokKey(req, res, next);

      expect(req.llmApiKey).toBe("llm-key-123");
      expect(req.apolloApiKey).toBe("apollo-key-123");
      expect(next).toHaveBeenCalled();
    });

    it("ignores malformed cookies gracefully", () => {
      const req = {
        headers: {
          cookie: `niche_llm_byok=malformed-key; niche_apollo_byok=malformed-key`,
        },
      } as any;
      const res = {} as Response;
      const next = vi.fn();

      injectByokKey(req, res, next);

      expect(req.llmApiKey).toBeUndefined();
      expect(req.apolloApiKey).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
