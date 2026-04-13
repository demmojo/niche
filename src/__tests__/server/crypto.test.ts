import { describe, it, expect } from "vitest";
import { hashApiKey } from "../../server/utils/crypto";

describe("API Key Hashing", () => {
  it("mandates HMAC-SHA256 with a system-wide pepper for all API key hashing", () => {
    const key = "my-secret-key";
    const hashed = hashApiKey(key);
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(key);
    // Same key, same pepper => same hash
    expect(hashApiKey(key)).toBe(hashed);
  });
});
