import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { requireAuth } from "../../server/authMiddleware";

const { mockVerifyIdToken } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
}));
vi.mock("firebase-admin", () => {
  return {
    default: {
      auth: vi.fn().mockReturnValue({
        verifyIdToken: mockVerifyIdToken,
      }),
      apps: [{ name: "[DEFAULT]" }],
      app: vi.fn().mockReturnValue({ options: { projectId: "test" } }),
      initializeApp: vi.fn(),
    },
    auth: vi.fn().mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    }),
    apps: [{ name: "[DEFAULT]" }],
    app: vi.fn().mockReturnValue({ options: { projectId: "test" } }),
    initializeApp: vi.fn(),
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
      email: "mo@nicheai.com",
    });
  });

  it("succeeds with dev mode token", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const payload = Buffer.from(
      JSON.stringify({ user_id: "dev-user", email: "dev@example.com" }),
    ).toString("base64");
    const fakeToken = `header.${payload}.signature`;

    const res = await request(app)
      .get("/test")
      .set("Authorization", `Bearer ${fakeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      uid: "dev-user",
      email: "dev@example.com",
    });

    process.env.NODE_ENV = originalEnv;
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
