import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { authRouter } from "../../server/authRoutes";
import * as admin from "firebase-admin";

vi.mock("firebase-admin", () => {
  const batchMock = {
    update: vi.fn(),
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
  };

  const authMock = {
    verifyIdToken: vi.fn(),
    getUser: vi.fn(),
    deleteUser: vi.fn(),
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

describe("authRoutes merge-anonymous-data", () => {
  const app = express();
  app.use(express.json());
  app.use(authRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges data successfully and chunks iteratively when documents exist", async () => {
    const adminInstance = (admin as any).default;

    adminInstance
      .auth()
      .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" }) // Permanent
      .mockResolvedValueOnce({ uid: "anon-123", iat: 1234 }); // Anonymous

    adminInstance.auth().getUser.mockResolvedValue({
      providerData: [], // Mocking isAnonymous true
    });

    const mockDoc = {
      ref: "mock-ref",
      data: () => ({ members: ["anon-123", "other-user"] }),
    };

    // Override the mock to return documents on first pass, then empty on second pass (to end the while loops)
    adminInstance.firestore().get = vi
      .fn()
      .mockResolvedValueOnce({ empty: false, size: 1, docs: [mockDoc] }) // campaign_jobs 1st
      .mockResolvedValueOnce({ empty: true, size: 0, docs: [] }) // campaign_jobs 2nd
      .mockResolvedValueOnce({ empty: false, size: 1, docs: [mockDoc] }) // workspaces 1st
      .mockResolvedValueOnce({ empty: true, size: 0, docs: [] }); // workspaces 2nd

    const res = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .set("Authorization", "Bearer valid-perm-token")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "anon-123",
      });

    expect(res.status).toBe(200);
    expect(adminInstance.firestore().batch).toHaveBeenCalled();
    expect(adminInstance.firestore().collection).toHaveBeenCalledWith(
      "merged_accounts",
    );
    expect(adminInstance.auth().deleteUser).toHaveBeenCalledWith("anon-123");
  });

  it("handles identical accounts or non-anonymous source accounts", async () => {
    const adminInstance = (admin as any).default;

    adminInstance
      .auth()
      .verifyIdToken.mockResolvedValueOnce({ uid: "same-123" }) // Permanent
      .mockResolvedValueOnce({ uid: "same-123", iat: 1234 }); // Anonymous

    const res = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .set("Authorization", "Bearer valid-perm-token")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "same-123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Cannot merge identical accounts");

    // Next case
    adminInstance.auth().verifyIdToken.mockReset();
    adminInstance
      .auth()
      .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" }) // Permanent
      .mockResolvedValueOnce({ uid: "anon-123", iat: 1234 }); // Anonymous

    adminInstance.auth().getUser.mockResolvedValue({
      providerData: [{ providerId: "google.com" }], // Mocking isAnonymous false
    });

    const res2 = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .set("Authorization", "Bearer valid-perm-token")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "anon-123",
      });

    expect(res2.status).toBe(400);
    expect(res2.body.error).toBe("Source account is not anonymous");
  });

  it("handles identical accounts or non-anonymous source accounts (part 2: spaces)", async () => {
    const adminInstance = (admin as any).default;

    adminInstance
      .auth()
      .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" }) // Permanent
      .mockResolvedValueOnce({ uid: "anon-123", iat: 1234 }); // Anonymous

    adminInstance.auth().getUser.mockResolvedValue({
      providerData: [{ providerId: "google.com" }], // Mocking isAnonymous false
    });

    const mockDoc = {
      ref: "mock-ref",
      data: () => ({ members: ["other-user"] }), // missing anon-123 to cover that branch map
    };

    adminInstance.firestore().get = vi
      .fn()
      .mockResolvedValueOnce({ empty: true, size: 0, docs: [] })
      .mockResolvedValueOnce({ empty: false, size: 1, docs: [mockDoc] }) // workspaces 1st
      .mockResolvedValueOnce({ empty: true, size: 0, docs: [] }); // workspaces 2nd

    const res = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .set("Authorization", "Bearer valid-perm-token")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "anon-123",
      });

    expect(res.status).toBe(400); // failed earlier since provider is not anon
  });

  it("covers workspace members array fallback", async () => {
    const adminInstance = (admin as any).default;

    adminInstance
      .auth()
      .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" }) // Permanent
      .mockResolvedValueOnce({ uid: "anon-123", iat: 1234 }); // Anonymous

    adminInstance.auth().getUser.mockResolvedValue({
      providerData: [], // Mocking isAnonymous true
    });

    const mockDoc = {
      ref: "mock-ref",
      data: () => ({}), // missing members array to cover that branch
    };

    adminInstance.firestore().get = vi
      .fn()
      .mockResolvedValueOnce({ empty: true, size: 0, docs: [] }) // no jobs
      .mockResolvedValueOnce({ empty: false, size: 1, docs: [mockDoc] }) // workspaces 1st
      .mockResolvedValueOnce({ empty: true, size: 0, docs: [] }); // workspaces 2nd

    const res = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .set("Authorization", "Bearer valid-perm-token")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "anon-123",
      });

    expect(res.status).toBe(200);
  });

  it("handles mismatched anonymous token uid", async () => {
    const adminInstance = (admin as any).default;

    adminInstance
      .auth()
      .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" }) // Permanent
      .mockResolvedValueOnce({ uid: "different-uid", iat: 1234 }); // Anonymous

    const res = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .set("Authorization", "Bearer valid-perm-token")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "anon-123",
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Anonymous token does not match oldUid");
  });

  it("handles server errors gracefully", async () => {
    const adminInstance = (admin as any).default;

    adminInstance
      .auth()
      .verifyIdToken.mockRejectedValueOnce(new Error("Auth service down"));

    const res = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .set("Authorization", "Bearer valid-perm-token")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "anon-123",
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Auth service down");
  });

  it("handles deleteUser errors gracefully without failing the request", async () => {
    const adminInstance = (admin as any).default;

    adminInstance
      .auth()
      .verifyIdToken.mockResolvedValueOnce({ uid: "perm-456" }) // Permanent
      .mockResolvedValueOnce({ uid: "anon-123", iat: 1234 }); // Anonymous

    adminInstance.auth().getUser.mockResolvedValue({
      providerData: [], // Mocking isAnonymous true
    });

    adminInstance
      .auth()
      .deleteUser.mockRejectedValueOnce(new Error("Delete failed"));

    adminInstance.firestore().get = vi
      .fn()
      .mockResolvedValue({ empty: true, size: 0, docs: [] });

    const res = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .set("Authorization", "Bearer valid-perm-token")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "anon-123",
      });

    expect(res.status).toBe(200); // Should still succeed
  });

  it("handles missing inputs or headers", async () => {
    const res1 = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .send({ oldUid: "anon-123" }); // missing anonToken

    expect(res1.status).toBe(400);
    expect(res1.body.error).toBe("Missing anonToken or oldUid");

    const res2 = await request(app)
      .post("/merge-anonymous-data")
      .set("x-firebase-appcheck", "valid")
      .send({
        anonToken: "valid-anon-token",
        oldUid: "anon-123",
      }); // missing authHeader

    expect(res2.status).toBe(401);
    expect(res2.body.error).toBe("Missing Permanent JWT");
  });
});
