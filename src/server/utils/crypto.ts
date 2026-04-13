import crypto from "crypto";

export function hashApiKey(apiKey: string): string {
  const pepper =
    process.env.API_KEY_PEPPER || "default-system-wide-nicheai-pepper";
  return crypto.createHmac("sha256", pepper).update(apiKey).digest("hex");
}
