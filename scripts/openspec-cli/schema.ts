import { z } from "zod";

export const CliOptionsSchema = z.object({
  nonInteractive: z.boolean().default(false),
  json: z.boolean().default(false),
  force: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  stdin: z.boolean().default(false),
  // Additional flags that specific commands might use:
  autoFix: z.boolean().optional(),
  clearState: z.boolean().optional(),
  onCollision: z.string().optional(),
  threshold: z.string().optional(),
});

export type CliOptions = z.infer<typeof CliOptionsSchema>;

export const OpenSpecSchema = z.object({
  schema: z.literal("spec-driven").optional(),
  status: z
    .enum([
      "draft",
      "proposed",
      "active",
      "in_progress",
      "implemented",
      "completed",
      "superseded",
      "blocked",
      "archived",
    ])
    .optional()
    .default("draft"),
  created: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
      z.date().transform((d) => d.toISOString().split("T")[0]),
    ])
    .optional(),
  superseded_by: z.union([z.string(), z.array(z.string())]).optional(),
  depends_on: z.array(z.string()).optional(),
  blocks: z.array(z.string()).optional(),
  name: z.string().optional(),
  learnings_extracted: z.boolean().optional(),
});

export type OpenSpec = z.infer<typeof OpenSpecSchema>;
