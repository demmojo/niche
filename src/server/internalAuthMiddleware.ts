import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

export const requireInternalOidc = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Allow local mock execution during tests
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.SIMULATE_CLOUD_TASKS
  ) {
    const token = req.headers.authorization?.split(" ")[1];
    if (token === "MOCK_INTERNAL_TOKEN") {
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Missing OIDC token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const audience =
      process.env.CLOUD_RUN_URL ||
      `https://${process.env.GOOGLE_CLOUD_PROJECT}.run.app`;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: audience, // Check that the token was intended for this service
    });

    const payload = ticket.getPayload();

    // Verify it's signed by Google and from your specific Service Account
    const allowedServiceAccount = process.env.CLOUD_RUN_SA_EMAIL;
    if (payload?.email !== allowedServiceAccount) {
      return res
        .status(403)
        .json({ error: "Forbidden", message: "Invalid service account" });
    }

    // Pass
    next();
  } catch (error) {
    console.error("OIDC Verification failed:", error);
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Invalid OIDC token" });
  }
};
