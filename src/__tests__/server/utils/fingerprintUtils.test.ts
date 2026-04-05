import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateAnonymousFingerprint } from "../../../server/utils/fingerprintUtils";

describe("generateAnonymousFingerprint", () => {
  const mockReq = {
    ip: "192.168.1.1",
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "accept-language": "en-US,en;q=0.9",
    },
  } as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T12:00:00Z"));
    process.env.FINGERPRINT_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.FINGERPRINT_SECRET;
  });

  it("should generate a consistent hash for the same inputs on the same day", () => {
    const hash1 = generateAnonymousFingerprint(mockReq);
    const hash2 = generateAnonymousFingerprint(mockReq);
    expect(hash1).toBeDefined();
    expect(hash1).toBeTypeOf("string");
    expect(hash1).toEqual(hash2);
  });

  it("should generate a different hash for a different IP", () => {
    const hash1 = generateAnonymousFingerprint(mockReq);
    const hash2 = generateAnonymousFingerprint({ ...mockReq, ip: "10.0.0.1" });
    expect(hash1).not.toEqual(hash2);
  });

  it("should generate a different hash for a different User-Agent", () => {
    const hash1 = generateAnonymousFingerprint(mockReq);
    const hash2 = generateAnonymousFingerprint({
      ...mockReq,
      headers: { ...mockReq.headers, "user-agent": "Different UA" },
    });
    expect(hash1).not.toEqual(hash2);
  });

  it("should generate a different hash for a different Accept-Language", () => {
    const hash1 = generateAnonymousFingerprint(mockReq);
    const hash2 = generateAnonymousFingerprint({
      ...mockReq,
      headers: { ...mockReq.headers, "accept-language": "fr-FR" },
    });
    expect(hash1).not.toEqual(hash2);
  });

  it("should rotate the salt daily", () => {
    const hashDay1 = generateAnonymousFingerprint(mockReq);

    // Advance to the next day
    vi.setSystemTime(new Date("2026-03-31T12:00:00Z"));
    const hashDay2 = generateAnonymousFingerprint(mockReq);

    expect(hashDay1).not.toEqual(hashDay2);
  });

  it("should handle missing headers gracefully", () => {
    const reqMissingHeaders = {
      ip: "192.168.1.1",
      headers: {},
    } as any;

    const hash = generateAnonymousFingerprint(reqMissingHeaders);
    expect(hash).toBeDefined();
    expect(hash).toBeTypeOf("string");
  });

  it("should handle undefined IP gracefully", () => {
    const reqMissingIp = {
      headers: mockReq.headers,
    } as any;

    const hash = generateAnonymousFingerprint(reqMissingIp);
    expect(hash).toBeDefined();
    expect(hash).toBeTypeOf("string");
  });
});
