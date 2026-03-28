import * as admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin Initialization Warning:", e);
  }
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

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

  try {
    // PASS `true`: Forces a backend check to ensure the user's session
    // hasn't been revoked since the token was issued.
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);

    // Attach the decoded user claims to the request object for downstream use
    req.user = decodedToken;
    next();
  } catch (error: any) {
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
