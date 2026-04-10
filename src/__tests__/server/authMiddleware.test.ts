import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import {
  requireAuth,
  requireAppCheck,
  requireCloudTaskOIDC,
} from "../../server/authMiddleware";

const { mockVerifyIdToken, mockVerifyAppCheckToken, mockVerifyIdTokenOauth } =
  vi.hoisted(() => ({
    mockVerifyIdToken: vi.fn(),
    mockVerifyAppCheckToken: vi.fn(),
    mockVerifyIdTokenOauth: vi.fn(),
  }));
vi.mock("firebase-admin", () => {
  return {
    default: {
      auth: vi.fn().mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      }),
      appCheck: vi.fn().mockReturnValue({
        verifyToken: mockVerifyAppCheckToken,
      }),
      apps: [{ name: "[DEFAULT]" }],
      app: vi.fn().mockReturnValue({ options: { projectId: "test" } }),
      initializeApp: vi.fn(),
    },
    auth: vi.fn().mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    }),
    appCheck: vi.fn().mockReturnValue({
      verifyToken: mockVerifyAppCheckToken,
    }),
    apps: [{ name: "[DEFAULT]" }],
    app: vi.fn().mockReturnValue({ options: { projectId: "test" } }),
    initializeApp: vi.fn(),
  };
});

vi.mock("google-auth-library", () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdTokenOauth,
    })),
  };
});

describe("authMiddleware", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.get("/test", requireAuth as any, (req, res) => {
      res.status(200).json({ user: (req as any).user });
    });
  });

  it("fails if no auth header", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("fails if invalid token", async () => {
    mockVerifyIdToken.mockRejectedValueOnce({
      code: "auth/argument-error",
      message: "invalid",
    });
    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer invalid");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("fails if token revoked", async () => {
    mockVerifyIdToken.mockRejectedValueOnce({
      code: "auth/id-token-revoked",
      message: "revoked",
    });
    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer revoked-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe(
      "Token has been revoked. Please reauthenticate.",
    );
  });

  it("fails if token expired", async () => {
    mockVerifyIdToken.mockRejectedValueOnce({
      code: "auth/id-token-expired",
      message: "expired",
    });
    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer expired-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token has expired.");
  });

  it("succeeds with Playwright mock token", async () => {
    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer MOCK_TOKEN");

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      uid: "test-user-123",
      email: "mo.hassaniv@gmail.com",
    });
  });

  it("succeeds if verifyIdToken resolves", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: "real-user",
      email: "real@example.com",
    });
    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer real-token");

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      uid: "real-user",
      email: "real@example.com",
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith("real-token", true);
  });
});

describe("requireAppCheck middleware", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.get("/appcheck-test", requireAppCheck as any, (req, res) => {
      res.status(200).json({ success: true });
    });
  });

  it("fails if no app check token is provided", async () => {
    // Enable enforcement for test
    process.env.NODE_ENV = "production";
    process.env.ENFORCE_APP_CHECK = "true";
    delete process.env.VITEST; // temporarily unset to test enforcement logic
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    const res = await request(app).get("/appcheck-test");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing or invalid App Check token.");

    process.env.VITEST = "true";
  });

  it("fails if app check token is invalid", async () => {
    process.env.NODE_ENV = "production";
    process.env.ENFORCE_APP_CHECK = "true";
    delete process.env.VITEST;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    mockVerifyAppCheckToken.mockRejectedValueOnce(new Error("invalid token"));

    const res = await request(app)
      .get("/appcheck-test")
      .set("x-firebase-appcheck", "invalid-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid App Check token.");

    process.env.VITEST = "true";
  });

  it("succeeds if app check token is valid", async () => {
    process.env.NODE_ENV = "production";
    process.env.ENFORCE_APP_CHECK = "true";
    delete process.env.VITEST;
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    mockVerifyAppCheckToken.mockResolvedValueOnce({});

    const res = await request(app)
      .get("/appcheck-test")
      .set("x-firebase-appcheck", "valid-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    process.env.VITEST = "true";
  });

  it("skips check if not in production and not enforced", async () => {
    // Keep VITEST=true or set ENFORCE_APP_CHECK=false
    process.env.ENFORCE_APP_CHECK = "false";
    const res = await request(app).get("/appcheck-test");
    expect(res.status).toBe(200);
  });
});

describe("requireCloudTaskOIDC middleware", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.post("/oidc-test", requireCloudTaskOIDC as any, (req, res) => {
      res.status(200).json({ payload: (req as any).cloudTasksPayload });
    });
  });

  it("skips validation if not enforced in non-prod", async () => {
    process.env.NODE_ENV = "development";
    process.env.ENFORCE_OIDC = "false";
    const res = await request(app).post("/oidc-test");
    expect(res.status).toBe(200);
  });

  it("fails if no auth header", async () => {
    process.env.ENFORCE_OIDC = "true";
    const res = await request(app).post("/oidc-test");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Missing or invalid Authorization header.");
  });

  it("fails if token is invalid", async () => {
    process.env.ENFORCE_OIDC = "true";
    mockVerifyIdTokenOauth.mockRejectedValueOnce(new Error("invalid token"));

    const res = await request(app)
      .post("/oidc-test")
      .set("Authorization", "Bearer bad-token");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired OIDC token.");
  });

  it("fails if service account does not match", async () => {
    process.env.ENFORCE_OIDC = "true";
    process.env.CLOUD_TASKS_INVOKER_SA_EMAIL =
      "worker@project.iam.gserviceaccount.com";

    mockVerifyIdTokenOauth.mockResolvedValueOnce({
      getPayload: () => ({
        email: "wrong@project.iam.gserviceaccount.com",
        email_verified: true,
      }),
    });

    const res = await request(app)
      .post("/oidc-test")
      .set("Authorization", "Bearer good-token-wrong-email");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Unauthorized service account.");
  });

  it("fails if email is not verified", async () => {
    process.env.ENFORCE_OIDC = "true";
    process.env.CLOUD_TASKS_INVOKER_SA_EMAIL =
      "worker@project.iam.gserviceaccount.com";

    mockVerifyIdTokenOauth.mockResolvedValueOnce({
      getPayload: () => ({
        email: "worker@project.iam.gserviceaccount.com",
        email_verified: false,
      }),
    });

    const res = await request(app)
      .post("/oidc-test")
      .set("Authorization", "Bearer good-token-unverified");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Service account email not verified.");
  });

  it("succeeds if token is valid and email matches", async () => {
    process.env.ENFORCE_OIDC = "true";
    process.env.CLOUD_TASKS_INVOKER_SA_EMAIL =
      "worker@project.iam.gserviceaccount.com";

    const validPayload = {
      email: "worker@project.iam.gserviceaccount.com",
      email_verified: true,
    };

    mockVerifyIdTokenOauth.mockResolvedValueOnce({
      getPayload: () => validPayload,
    });

    const res = await request(app)
      .post("/oidc-test")
      .set("Authorization", "Bearer perfect-token");

    expect(res.status).toBe(200);
    expect(res.body.payload).toMatchObject(validPayload);
  });
});
