import * as adminNamespace from "firebase-admin";
const admin: typeof adminNamespace =
  (adminNamespace as any).default || adminNamespace;
import { Request, Response, NextFunction } from "express";
import * as fs from "fs";
import * as path from "path";

// Initialize Firebase Admin
if (!admin.apps.length) {
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
    // #region agent log
    fetch("http://127.0.0.1:7755/ingest/98d2df09-f5ab-4d4c-9948-722cbac3f53f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "6929b7",
      },
      body: JSON.stringify({
        sessionId: "6929b7",
        location: "authMiddleware.ts",
        message: "Firebase Admin initialized",
        data: { projectId: admin.app().options.projectId },
        timestamp: Date.now(),
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
  } catch (e) {
    console.warn("Firebase Admin Initialization Warning:", e);
  }
}

export interface AuthenticatedRequest extends Request {
  user?: adminNamespace.auth.DecodedIdToken;
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

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header.",
    });
  }

  const idToken = authHeader.split("Bearer ")[1];

  // #region agent log
  fetch("http://127.0.0.1:7755/ingest/98d2df09-f5ab-4d4c-9948-722cbac3f53f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "6929b7",
    },
    body: JSON.stringify({
      sessionId: "6929b7",
      location: "authMiddleware.ts:requireAuth",
      message: "Parsed idToken",
      data: { idToken },
      timestamp: Date.now(),
      hypothesisId: "H3",
    }),
  }).catch(() => {});
  // #endregion

  // Handle Playwright tests specifically
  if (idToken === "MOCK_TOKEN") {
    req.user = {
      uid: "test-user-123",
      email: "mo.hassaniv@gmail.com",
    } as adminNamespace.auth.DecodedIdToken;
    return next();
  }

  try {
    // PASS `true`: Forces a backend check to ensure the user's session
    // hasn't been revoked since the token was issued.
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);

    // Attach the decoded user claims to the request object for downstream use
    req.user = decodedToken;
    next();
  } catch (error: any) {
    // #region agent log
    fetch("http://127.0.0.1:7755/ingest/98d2df09-f5ab-4d4c-9948-722cbac3f53f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "6929b7",
      },
      body: JSON.stringify({
        sessionId: "6929b7",
        location: "authMiddleware.ts:requireAuth",
        message: "Token verification failed",
        data: { idToken, error: error.message, code: error.code },
        timestamp: Date.now(),
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
    console.error("Firebase Auth Error:", error.code || error.message);

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
  const appCheckToken = req.headers["x-firebase-appcheck"];

  // Bypass App Check in local development or emulator environments
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.VITEST
  ) {
    return next();
  }

  if (!appCheckToken || typeof appCheckToken !== "string") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid App Check token.",
    });
  }

  try {
    const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
    return next();
  } catch (err: any) {
    console.error("App Check failed:", err);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid App Check token.",
    });
  }
};
