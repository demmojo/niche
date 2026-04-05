import { createHash } from "crypto";
import type { Request } from "express";

export function generateAnonymousFingerprint(req: Request): string {
  const ip = req.ip || "unknown-ip";
  const userAgent = req.headers["user-agent"] || "unknown-ua";
  const acceptLanguage = req.headers["accept-language"] || "unknown-lang";

  // Format daily date string (YYYY-MM-DD in UTC)
  const now = new Date();
  const dateString = now.toISOString().split("T")[0];

  const secret = process.env.FINGERPRINT_SECRET || "default-insecure-secret";

  const payload = `${ip}|${userAgent}|${acceptLanguage}|${dateString}|${secret}`;

  return createHash("sha256").update(payload).digest("hex");
}
