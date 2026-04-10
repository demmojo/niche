import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { requireInternalOidc } from "../../server/internalAuthMiddleware";
import { OAuth2Client } from "google-auth-library";

const { mockVerifyIdToken } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
}));

vi.mock("google-auth-library", () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

describe("internalAuthMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should allow request with MOCK_INTERNAL_TOKEN when SIMULATE_CLOUD_TASKS is true and not production", async () => {
    process.env.NODE_ENV = "development";
    process.env.SIMULATE_CLOUD_TASKS = "true";
    req.headers = { authorization: "Bearer MOCK_INTERNAL_TOKEN" };

    await requireInternalOidc(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("should reject request without authorization header", async () => {
    process.env.NODE_ENV = "production";
    process.env.SIMULATE_CLOUD_TASKS = "false";

    await requireInternalOidc(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "Missing OIDC token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject request if authorization header does not start with Bearer", async () => {
    process.env.NODE_ENV = "production";
    req.headers = { authorization: "Basic SOME_TOKEN" };

    await requireInternalOidc(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "Missing OIDC token",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should verify token and call next if service account is valid", async () => {
    process.env.NODE_ENV = "production";
    process.env.CLOUD_RUN_URL = "https://my-service.run.app";
    process.env.CLOUD_RUN_SA_EMAIL = "valid-sa@project.iam.gserviceaccount.com";

    req.headers = { authorization: "Bearer VALID_OIDC_TOKEN" };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "valid-sa@project.iam.gserviceaccount.com",
        email_verified: true,
      }),
    });

    await requireInternalOidc(req as Request, res as Response, next);

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "VALID_OIDC_TOKEN",
      audience: "https://my-service.run.app",
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should reject request if email is not verified", async () => {
    process.env.NODE_ENV = "production";
    process.env.CLOUD_RUN_URL = "https://my-service.run.app";
    process.env.CLOUD_RUN_SA_EMAIL = "valid-sa@project.iam.gserviceaccount.com";

    req.headers = { authorization: "Bearer VALID_OIDC_TOKEN" };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "valid-sa@project.iam.gserviceaccount.com",
        email_verified: false,
      }),
    });

    await requireInternalOidc(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Service account email not verified",
    });
  });

  it("should verify token with fallback audience if CLOUD_RUN_URL is not set", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.CLOUD_RUN_URL;
    process.env.GOOGLE_CLOUD_PROJECT = "my-gcp-project";
    process.env.CLOUD_RUN_SA_EMAIL = "valid-sa@project.iam.gserviceaccount.com";

    req.headers = { authorization: "Bearer VALID_OIDC_TOKEN" };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: "valid-sa@project.iam.gserviceaccount.com" }),
    });

    await requireInternalOidc(req as Request, res as Response, next);

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "VALID_OIDC_TOKEN",
      audience: "https://my-gcp-project.run.app",
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should reject request if service account email does not match", async () => {
    process.env.NODE_ENV = "production";
    process.env.CLOUD_RUN_URL = "https://my-service.run.app";
    process.env.CLOUD_RUN_SA_EMAIL = "valid-sa@project.iam.gserviceaccount.com";

    req.headers = { authorization: "Bearer VALID_OIDC_TOKEN" };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ email: "wrong-sa@project.iam.gserviceaccount.com" }),
    });

    await requireInternalOidc(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Invalid service account",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject request if payload has no email", async () => {
    process.env.NODE_ENV = "production";
    process.env.CLOUD_RUN_URL = "https://my-service.run.app";
    process.env.CLOUD_RUN_SA_EMAIL = "valid-sa@project.iam.gserviceaccount.com";

    req.headers = { authorization: "Bearer VALID_OIDC_TOKEN" };

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({}), // Missing email
    });

    await requireInternalOidc(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Forbidden",
      message: "Invalid service account",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject request if verifyIdToken throws", async () => {
    process.env.NODE_ENV = "production";
    process.env.CLOUD_RUN_URL = "https://my-service.run.app";

    req.headers = { authorization: "Bearer INVALID_OIDC_TOKEN" };

    mockVerifyIdToken.mockRejectedValue(new Error("Token expired or invalid"));

    await requireInternalOidc(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Unauthorized",
      message: "Invalid OIDC token",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
