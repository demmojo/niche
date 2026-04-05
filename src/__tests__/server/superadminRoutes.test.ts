import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { superadminRouter } from "../../../src/server/superadminRoutes";
import admin from "firebase-admin";
import { requireAuth } from "../../../src/server/authMiddleware";

// Mock auth middleware to easily simulate authenticated users
vi.mock("../../../src/server/authMiddleware", () => ({
  requireAuth: vi.fn((req, res, next) => {
    // If a mock user is attached to the request, let it pass
    if (req.user) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  }),
}));

vi.mock("firebase-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase-admin")>();

  const dbMock = {
    collection: vi.fn().mockReturnValue({
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn(),
      add: vi.fn().mockResolvedValue(undefined),
    }),
  };

  const firestoreMock = Object.assign(
    vi.fn(() => dbMock),
    {
      FieldValue: {
        serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
      },
    },
  );

  const authMock = {
    getUser: vi.fn(),
    createCustomToken: vi.fn(),
  };

  const adminMock = {
    ...actual,
    firestore: firestoreMock,
    auth: vi.fn(() => authMock),
  };

  return {
    ...actual,
    default: adminMock,
    firestore: firestoreMock,
    auth: vi.fn(() => authMock),
  };
});

describe("Superadmin Routes", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPERADMIN_EMAILS = "admin@example.com,super@admin.com";

    app = express();
    app.use(express.json());

    // Test helper middleware to inject mock user
    app.use((req: any, res, next) => {
      if (req.headers["x-mock-user-id"]) {
        req.user = { uid: req.headers["x-mock-user-id"] };
      }
      next();
    });

    app.use("/api/superadmin", superadminRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SUPERADMIN_EMAILS;
  });

  describe("Middleware: requireSuperadmin", () => {
    it("returns 401 if user is not authenticated", async () => {
      const res = await request(app).get("/api/superadmin/users");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("returns 403 if user is not a superadmin", async () => {
      const auth = admin.auth();
      (auth.getUser as any).mockResolvedValueOnce({
        email: "user@example.com",
        customClaims: {},
      });

      const res = await request(app)
        .get("/api/superadmin/users")
        .set("x-mock-user-id", "regular-user-id");

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Forbidden: Superadmin access required");
    });

    it("allows access if user has superadmin custom claim", async () => {
      const auth = admin.auth();
      (auth.getUser as any).mockResolvedValueOnce({
        email: "user@example.com",
        customClaims: { superadmin: true },
      });

      const db = admin.firestore();
      const mockQuery = {
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          forEach: vi.fn(),
        }),
      };
      (db.collection as any).mockReturnValue(mockQuery);

      const res = await request(app)
        .get("/api/superadmin/users")
        .set("x-mock-user-id", "admin-id");

      expect(res.status).toBe(200);
    });

    it("allows access if user email is in SUPERADMIN_EMAILS", async () => {
      const auth = admin.auth();
      (auth.getUser as any).mockResolvedValueOnce({
        email: "admin@example.com",
        customClaims: {},
      });

      const db = admin.firestore();
      const mockQuery = {
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          forEach: vi.fn(),
        }),
      };
      (db.collection as any).mockReturnValue(mockQuery);

      const res = await request(app)
        .get("/api/superadmin/users")
        .set("x-mock-user-id", "admin-id");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /users", () => {
    beforeEach(() => {
      const auth = admin.auth();
      (auth.getUser as any).mockResolvedValue({
        email: "admin@example.com",
        customClaims: { superadmin: true },
      });
    });

    it("fetches recent active users and limits to 10 unique users", async () => {
      const db = admin.firestore();

      // Mock data with duplicates and more than 10 to test unique/slice logic
      const mockDocs = Array.from({ length: 15 }).map((_, i) => ({
        id: `project-${i}`,
        data: () => ({
          userId: `user-${i % 8}`, // Creates duplicates since we mod by 8
          name: `Project ${i}`,
        }),
      }));

      const mockQuery = {
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          forEach: (cb: any) => mockDocs.forEach(cb),
        }),
      };
      (db.collection as any).mockReturnValue(mockQuery);

      const res = await request(app)
        .get("/api/superadmin/users")
        .set("x-mock-user-id", "admin-id");

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(10);

      // Verify uniqueness
      const uids = res.body.users.map((u: any) => u.uid);
      const uniqueUids = new Set(uids);
      expect(uids.length).toBe(uniqueUids.size);
    });

    it("handles errors during fetching", async () => {
      const db = admin.firestore();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const mockQuery = {
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockRejectedValue(new Error("DB Error")),
      };
      (db.collection as any).mockReturnValue(mockQuery);

      const res = await request(app)
        .get("/api/superadmin/users")
        .set("x-mock-user-id", "admin-id");

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to fetch users");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("POST /impersonate", () => {
    beforeEach(() => {
      const auth = admin.auth();
      (auth.getUser as any).mockImplementation((uid: string) => {
        if (uid === "admin-id") {
          return Promise.resolve({
            email: "admin@example.com",
            customClaims: { superadmin: true },
          });
        }
        return Promise.resolve({
          email: "target@example.com",
          customClaims: {},
        });
      });
    });

    it("returns 400 if targetUid is missing", async () => {
      const res = await request(app)
        .post("/api/superadmin/impersonate")
        .set("x-mock-user-id", "admin-id")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Missing targetUid or adminUid");
    });

    it("returns 404 if target user is not found", async () => {
      const auth = admin.auth();
      (auth.getUser as any).mockImplementation((uid: string) => {
        if (uid === "admin-id")
          return Promise.resolve({ customClaims: { superadmin: true } });
        return Promise.reject(new Error("User not found"));
      });

      const res = await request(app)
        .post("/api/superadmin/impersonate")
        .set("x-mock-user-id", "admin-id")
        .send({ targetUid: "missing-user" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Target user not found");
    });

    it("returns 403 if trying to impersonate another admin", async () => {
      const auth = admin.auth();
      (auth.getUser as any).mockImplementation((uid: string) => {
        return Promise.resolve({ customClaims: { superadmin: true } });
      });

      const res = await request(app)
        .post("/api/superadmin/impersonate")
        .set("x-mock-user-id", "admin-id")
        .send({ targetUid: "other-admin-id" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Cannot impersonate another admin.");
    });

    it("generates custom token and logs audit event on success", async () => {
      const auth = admin.auth();
      (auth.createCustomToken as any).mockResolvedValueOnce(
        "mock-custom-token",
      );

      const db = admin.firestore();

      const mockQuery = {
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(),
        add: vi.fn().mockResolvedValue(undefined),
      };
      (db.collection as any).mockReturnValue(mockQuery);

      // Monkey patch admin to use mock-timestamp since module mocking order might be causing issues
      (admin as any).firestore.FieldValue = {
        serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
      };

      const res = await request(app)
        .post("/api/superadmin/impersonate")
        .set("x-mock-user-id", "admin-id")
        .send({ targetUid: "target-user-id" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe("mock-custom-token");

      // Verify audit log
      expect(mockQuery.add).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "IMPERSONATION_STARTED",
          adminUid: "admin-id",
          targetUid: "target-user-id",
          timestamp: "mock-timestamp",
        }),
      );

      // Verify token generation
      expect(auth.createCustomToken).toHaveBeenCalledWith("target-user-id", {
        isImpersonated: true,
        impersonatorUid: "admin-id",
      });
    });

    it("handles errors during token generation", async () => {
      const auth = admin.auth();
      (auth.createCustomToken as any).mockRejectedValueOnce(
        new Error("Token Error"),
      );

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const res = await request(app)
        .post("/api/superadmin/impersonate")
        .set("x-mock-user-id", "admin-id")
        .send({ targetUid: "target-user-id" });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Failed to generate token");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
