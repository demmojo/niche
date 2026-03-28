import { z } from "zod";

export const BrandIdentitySchemaV2 = z.object({
  schemaVersion: z.literal(2),
  isActive: z.boolean(),
  validFrom: z.any(), // Firestore timestamp
  validTo: z.any().nullable(),
  selected_identity: z.object({
    positioning: z.object({
      personality: z.string(),
      tone: z.array(z.string()),
      target_audience_niche: z.string(),
    }),
    visual_identity: z.object({
      primary_color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
      typography_pair: z.string(),
    }),
  }),
});

// For future proofing/rollback support
export const BrandIdentitySchemaV1 = z.object({
  schemaVersion: z.literal(1).optional(),
  selected_identity: z.object({
    positioning: z.object({
      personality: z.string(),
      tone: z.array(z.string()),
      target_audience_niche: z.string(),
    }),
    visual_identity: z.object({
      primary_color: z.string(),
      typography_pair: z.string(),
    }),
  }),
});

export const BrandIdentitySchema = z.discriminatedUnion("schemaVersion", [
  BrandIdentitySchemaV2,
  BrandIdentitySchemaV1.extend({ schemaVersion: z.literal(1) }),
]);

export type BrandIdentityV2 = z.infer<typeof BrandIdentitySchemaV2>;
