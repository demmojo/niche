import { z } from "zod";

export const TelemetryEventSchemaV1 = z.object({
  schemaVersion: z.literal("v1"),
  eventId: z.string().uuid(),
  eventType: z.enum([
    "activation",
    "core_action",
    "retention_proxy",
    "revenue_signal",
  ]),
  actorType: z.enum(["human", "agent", "system"]),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  payload: z.record(z.string(), z.any()).optional(),
  clientTimestamp: z.number(),
});

export const TelemetryEventSchema = z.discriminatedUnion("schemaVersion", [
  TelemetryEventSchemaV1,
]);

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type TelemetryEventV1 = z.infer<typeof TelemetryEventSchemaV1>;
