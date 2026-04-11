import { describe, it, expect } from "vitest";
import { StagedIntentSchema } from "../schema.js";

describe("OpenSpec Schema: Zod Transforms", () => {
  it("should parse V2 tokens correctly", () => {
    const v2Payload = {
      token: "1234-uuid",
      intents: [],
      fileHash: "hash123",
      createdAt: 100000,
      branchName: "openspec-staging-1234-uuid",
    };

    const parsed = StagedIntentSchema.parse(v2Payload);
    expect(parsed.branchName).toBe("openspec-staging-1234-uuid");
  });

  it("should upgrade V1 tokens to V2 in-memory via Zod transform", () => {
    const v1Payload = {
      token: "5678-uuid",
      intents: [],
      fileHash: "hash456",
      createdAt: 200000,
      // Notice: branchName is missing!
    };

    const parsed = StagedIntentSchema.parse(v1Payload);
    expect(parsed.branchName).toBe("openspec-staging-5678-uuid");
  });
});
