import { z } from "zod";

export const CliOptionsSchema = z.object({
  nonInteractive: z.boolean().default(false),
  json: z.boolean().default(false),
  force: z.boolean().default(false),
  dryRun: z.boolean().default(false),
  stage: z.boolean().default(false),
  token: z.string().optional(),
  stdin: z.boolean().default(false),
  baseDir: z.string().optional(),
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

export const FsIntentSchema = z
  .object({
    kind: z.string(),
  })
  .passthrough();

export const StagedIntentSchema = z
  .object({
    token: z.string(),
    intents: z.array(FsIntentSchema),
    fileHash: z.string(),
    createdAt: z.number(),
    branchName: z.string().optional(),
  })
  .transform((val) => {
    if (!val.branchName) {
      return {
        ...val,
        branchName: `openspec-staging-${val.token}`,
      };
    }
    return val as {
      token: string;
      intents: any[];
      fileHash: string;
      createdAt: number;
      branchName: string;
    };
  });

export type StagedIntent = z.infer<typeof StagedIntentSchema>;
