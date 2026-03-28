import { Request, Response, NextFunction } from "express";
import cookie from "cookie";
import crypto from "crypto";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Use a strong, rotated server-side secret for cookie encryption
const COOKIE_ENCRYPTION_KEY =
  process.env.COOKIE_ENCRYPTION_KEY ||
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const ENCRYPTION_KEY = Buffer.from(COOKIE_ENCRYPTION_KEY.slice(0, 64), "hex"); // 32 bytes
const IV_LENGTH = 16;

// AES-256-GCM Encryption Utility
/**
 *
 */
export function encryptKey(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

// AES-256-GCM Decryption Utility
/**
 *
 */
export function decryptKey(text: string) {
  const [ivHex, authTagHex, encryptedHex] = text.split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export interface ByokRequest extends Request {
  llmApiKey?: string;
  apolloApiKey?: string;
  user?: { uid: string; email?: string; admin?: boolean };
}

/**
 * 1. Endpoint: Save the BYOK Key
 * Route: POST /api/settings/byok
 */
export const saveByokKey = async (req: Request, res: Response) => {
  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ error: "provider and apiKey are required." });
  }

  // Encrypt the API key before placing it in the cookie
  const encryptedKey = encryptKey(apiKey);

  const cookieName = `niche_${provider}_byok`;

  res.setHeader(
    "Set-Cookie",
    cookie.serialize(cookieName, encryptedKey, {
      httpOnly: true, // XSS protection (JS cannot read)
      secure: process.env.NODE_ENV === "production", // HTTPS only
      sameSite: "strict", // CSRF protection
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/api/", // Strict scoping
    }),
  );

  // Telemetry Event 4: Revenue Signal - Compute Upgrade
  try {
    const userReq = req as any;
    const userId = userReq.user?.uid;
    const isTestAccount =
      userReq.user?.email?.endsWith("@nicheai.com") ||
      userReq.user?.email?.includes("+test@");

    if (userId) {
      const db = admin.firestore();
      const eventId = uuidv4();

      await db
        .collection("telemetry_events")
        .doc(eventId)
        .set(
          {
            eventId,
            schemaVersion: "v1",
            eventName: "compute_upgrade",
            actorType: "human", // assuming initiated by human via UI
            projectId: req.body.projectId || "unknown_project",
            upgradeType: "byok_enabled",
            provider: provider,
            context: {
              userId,
              environment: process.env.NODE_ENV || "development",
              isTestAccount: !!isTestAccount,
              clientIp: req.ip,
              userAgent: req.get("user-agent") || "unknown",
              serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            },
          },
          { merge: true },
        );
    }
  } catch (e) {
    console.error("Failed to log telemetry for BYOK:", e);
  }

  res
    .status(200)
    .json({ success: true, message: `${provider} API Key secured.` });
};

/**
 * 2. Middleware: Inject the BYOK Key for Proxying
 */
export const injectByokKey = (
  req: ByokRequest,
  res: Response,
  next: NextFunction,
) => {
  const cookies = cookie.parse(req.headers.cookie || "");

  if (cookies.niche_llm_byok) {
    try {
      req.llmApiKey = decryptKey(cookies.niche_llm_byok);
    } catch (err) {}
  }

  if (cookies.niche_apollo_byok) {
    try {
      req.apolloApiKey = decryptKey(cookies.niche_apollo_byok);
    } catch (err) {}
  }

  next();
};
