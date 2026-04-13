import { logger } from "./logger";
import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";
import * as fs from "fs";
import * as path from "path";
import { OAuth2Client } from "google-auth-library";

// Reuse a single client instance to cache Google's public keys efficiently
const oAuth2Client = new OAuth2Client();

// Initialize Firebase Admin
if (!admin.apps?.length) {
  try {
    const base64Credentials = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    let projectId = process.env.FIREBASE_PROJECT_ID;

    // Fallback to environment variable or mock project ID if missing credentials
    if (
      !base64Credentials &&
      !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
      !process.env.FIREBASE_CONFIG &&
      !projectId
    ) {
      projectId = "demo-nicheai";
      process.env.FIRESTORE_EMULATOR_HOST =
        process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
      process.env.FIREBASE_AUTH_EMULATOR_HOST =
        process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
    }

    if (base64Credentials) {
      const serviceAccount = JSON.parse(
        Buffer.from(base64Credentials, "base64").toString("utf-8"),
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      admin.initializeApp(projectId ? { projectId } : undefined);
    }
  } catch (e) {
    logger.warn("Firebase Admin Initialization Warning:", e);
  }
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

/**
 *
 */
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Actively sanitize the request by explicitly deleting any auth cookie if Bearer is present
    if (req.cookies && req.cookies.auth) {
      delete req.cookies.auth;
    }
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header.",
    });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    // PASS `true`: Forces a backend check to ensure the user's session
    // hasn't been revoked since the token was issued.
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);

    // Attach the decoded user claims to the request object for downstream use
    req.user = decodedToken;
    next();
  } catch (error: any) {
    logger.error("Firebase Auth Error:", error.code || error.message);

    // Robust Error Handling based on specific Admin SDK error codes
    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has been revoked. Please reauthenticate.",
      });
    }

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired.",
      });
    }

    // Catch-all for invalid signatures, malformed tokens, etc.
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid authentication token.",
    });
  }
};

export const requireAppCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.VITEST ||
    process.env.ENFORCE_APP_CHECK !== "true"
  ) {
    return next();
  }

  const appCheckToken = req.headers["x-firebase-appcheck"];

  if (!appCheckToken || typeof appCheckToken !== "string") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid App Check token.",
    });
  }

  try {
    await admin.appCheck().verifyToken(appCheckToken);
    return next();
  } catch (err: any) {
    logger.error("App Check failed:", err);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid App Check token.",
    });
  }
};

export const requireCloudTaskOIDC = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.ENFORCE_OIDC !== "true"
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token signature, expiry, issuer, and audience
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.CLOUD_RUN_WORKER_AUDIENCE,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token payload.",
      });
    }

    // Verify the Exact Service Account
    const expectedEmail = process.env.CLOUD_TASKS_INVOKER_SA_EMAIL;
    if (expectedEmail && payload.email !== expectedEmail) {
      logger.warn(
        `[Security] Unauthorized Cloud Tasks attempt. Expected ${expectedEmail}, got ${payload.email}`,
      );
      return res.status(403).json({
        error: "Forbidden",
        message: "Unauthorized service account.",
      });
    }

    // Verify the email identity is asserted by Google
    if (!payload.email_verified) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Service account email not verified.",
      });
    }

    // Attach the verified payload
    (req as any).cloudTasksPayload = payload;

    next();
  } catch (error) {
    logger.error("[Security] OIDC token verification failed:", error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired OIDC token.",
    });
  }
};
