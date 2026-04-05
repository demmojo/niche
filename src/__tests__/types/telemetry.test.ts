import { describe, it, expect } from "vitest";
import { TelemetryEventSchema } from "../../types/telemetry";

describe("TelemetryEventSchema", () => {
  it("should validate a valid V1 telemetry event", () => {
    const validData = {
      schemaVersion: "v1" as const,
      eventId: "123e4567-e89b-12d3-a456-426614174000",
      eventType: "core_action" as const,
      actorType: "human" as const,
      clientTimestamp: 1234567890,
      userId: "u1",
      payload: { key: "value" },
    };

    const result = TelemetryEventSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail for invalid eventType", () => {
    const invalidData = {
      schemaVersion: "v1" as const,
      eventId: "123e4567-e89b-12d3-a456-426614174000",
      eventType: "unknown_event",
      actorType: "human" as const,
      clientTimestamp: 1234567890,
    };

    const result = TelemetryEventSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
