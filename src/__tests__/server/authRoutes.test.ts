import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { authRouter } from "../../server/authRoutes";
import admin from "firebase-admin";

vi.mock("firebase-admin", () => {
  const batchMock = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    commit: vi.fn().mockResolvedValue(true),
  };

  const dbMock = {
    batch: vi.fn(() => batchMock),
    collection: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ empty: true, size: 0, docs: [] }),
    set: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
    runTransaction: vi.fn(async (callback) => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: false }),
        set: vi.fn(),
      };
      return callback(mockTransaction);
    }),
  };

  const authMock = {
    verifyIdToken: vi.fn(),
    getUser: vi.fn(),
    deleteUser: vi.fn().mockResolvedValue(true),
  };

  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      app: vi.fn(() => ({ options: { projectId: "test" } })),
      firestore: Object.assign(() => dbMock, {
        FieldValue: {
          serverTimestamp: vi.fn(),
        },
      }),
      auth: () => authMock,
      appCheck: () => ({ verifyToken: vi.fn().mockResolvedValue({}) }),
    },
  };
});

describe("authRoutes merge protocol", () => {
  const app = express();
  app.use(express.json());
  app.use(authRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /generate-merge-grant", () => {
    it("generates a claim ticket for an anonymous user", async () => {
      const adminInstance = admin as any;
      adminInstance
        .auth()
        .verifyIdToken.mockResolvedValueOnce({ uid: "anon-123" });
      adminInstance.auth().getUser.mockResolvedValue({
        providerData: [], // isAnonymous = true
      });

      const res = await request(app)
        .post("/generate-merge-grant")
        .set("Authorization", "Bearer valid-anon-token")
        .set("x-firebase-appcheck", "valid");

      expect(res.status).toBe(200);
      expect(res.body.claimTicket).toBeDefined();
      expect(adminInstance.firestore().doc).toHaveBeenCalledWith("anon-123"); // because .collection("merge_grants").doc("anon-123")
      expect(adminInstance.firestore().set).toHaveBeenCalled();
    });

    it("rejects non-anonymous users", async () => {
      const adminInstance = admin as any;
      adminInstance
        .auth()
        .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" });
      adminInstance.auth().getUser.mockResolvedValue({
        providerData: [{ providerId: "google.com" }], // isAnonymous = false
      });

      const res = await request(app)
        .post("/generate-merge-grant")
        .set("Authorization", "Bearer valid-perm-token")
        .set("x-firebase-appcheck", "valid");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        "Only anonymous accounts can generate merge grants",
      );
    });
  });

  describe("POST /execute-merge", () => {
    it("executes merge with a valid claim ticket", async () => {
      const adminInstance = admin as any;
      adminInstance
        .auth()
        .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" });

      // Mock merge grant doc
      const mockGrantDoc = {
        exists: true,
        data: () => ({
          token: "valid-claim-ticket",
          expiresAt: Date.now() + 60000,
        }),
      };

      adminInstance.firestore().get = vi
        .fn()
        .mockResolvedValueOnce(mockGrantDoc) // merge_grant check
        .mockResolvedValueOnce({
          empty: false,
          size: 1,
          docs: [{ ref: "mock-ref", data: () => ({}) }],
        }) // jobs
        .mockResolvedValueOnce({ empty: true, size: 0, docs: [] }) // jobs loop exit
        .mockResolvedValueOnce({ empty: true, size: 0, docs: [] }) // workspaces
        .mockResolvedValueOnce({ empty: true, size: 0, docs: [] }); // RoastMyNiche jobs

      const res = await request(app)
        .post("/execute-merge")
        .set("Authorization", "Bearer valid-perm-token")
        .set("x-firebase-appcheck", "valid")
        .send({ anonUid: "anon-123", claimTicket: "valid-claim-ticket" });

      expect(res.status).toBe(200);
      expect(adminInstance.firestore().batch).toHaveBeenCalled();
    });

    it("rejects missing inputs", async () => {
      const adminInstance = admin as any;
      adminInstance
        .auth()
        .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" });

      const res = await request(app)
        .post("/execute-merge")
        .set("Authorization", "Bearer valid-perm-token")
        .set("x-firebase-appcheck", "valid")
        .send({ anonUid: "anon-123" }); // missing claimTicket

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Missing anonUid or claimTicket");
    });

    it("rejects invalid claim tickets", async () => {
      const adminInstance = admin as any;
      adminInstance
        .auth()
        .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" });

      const mockGrantDoc = {
        exists: true,
        data: () => ({
          token: "valid-claim-ticket",
          expiresAt: Date.now() + 60000,
        }),
      };

      adminInstance.firestore().get = vi
        .fn()
        .mockResolvedValueOnce(mockGrantDoc);

      const res = await request(app)
        .post("/execute-merge")
        .set("Authorization", "Bearer valid-perm-token")
        .set("x-firebase-appcheck", "valid")
        .send({ anonUid: "anon-123", claimTicket: "invalid-ticket" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Invalid or expired claim ticket");
    });

    it("rejects expired claim tickets", async () => {
      const adminInstance = admin as any;
      adminInstance
        .auth()
        .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" });

      const mockGrantDoc = {
        exists: true,
        data: () => ({
          token: "valid-claim-ticket",
          expiresAt: Date.now() - 60000, // expired
        }),
      };

      adminInstance.firestore().get = vi
        .fn()
        .mockResolvedValueOnce(mockGrantDoc);

      const res = await request(app)
        .post("/execute-merge")
        .set("Authorization", "Bearer valid-perm-token")
        .set("x-firebase-appcheck", "valid")
        .send({ anonUid: "anon-123", claimTicket: "valid-claim-ticket" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Invalid or expired claim ticket");
    });
  });
});
