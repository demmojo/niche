import { z } from "zod";

const BaseProductSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),

  // Lineage fields
  parentId: z.string().nullable(),
  rootId: z.string(),
  ancestors: z.array(z.string()).max(30),
  forkReason: z.string().max(200).nullable(),

  distributionChannel: z.string().max(100).nullable(), // e.g. "Cold Email", "LinkedIn Ads"

  status: z.enum([
    "draft",
    "deployed_fake_door",
    "archived",
    "winner",
    "superseded",
  ]),

  // Validation Hypothesis
  targetAudience: z.string().max(200).optional(),
  jobToBeDone: z.string().max(200).optional(),

  metricsSnapshot: z
    .object({
      views: z.number().int().min(0).default(0),
      ctaClicks: z.number().int().min(0).default(0),
      emails: z.number().int().min(0).default(0),
    })
    .default({ views: 0, ctaClicks: 0, emails: 0 }),

  createdAt: z.string(), // ISO string
  updatedAt: z.string(), // ISO string
  deletedAt: z.string().nullable().default(null), // Soft delete
});

export const ProductV1Schema = BaseProductSchema.extend({
  schemaVersion: z.literal("v1"),
});

export const ProductV2Schema = BaseProductSchema.extend({
  schemaVersion: z.literal("v2"),
  // Add future v2 specific fields here
});

export const ProductSchema = z.discriminatedUnion("schemaVersion", [
  ProductV1Schema,
  ProductV2Schema,
]);

export type Product = z.infer<typeof ProductSchema>;

// Input for creating a product
export const CreateProductInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetAudience: z.string().max(200).optional(),
  jobToBeDone: z.string().max(200).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

// Input for forking a product
export const ForkProductInputSchema = z.object({
  parentId: z.string(),
  name: z.string().min(1).max(100),
  forkReason: z.string().min(1).max(200),
  targetAudience: z.string().max(200).optional(),
  jobToBeDone: z.string().max(200).optional(),
});

export type ForkProductInput = z.infer<typeof ForkProductInputSchema>;

// Input for Fake Door Signal
export const FakeDoorSignalInputSchema = z.object({
  productId: z.string().min(1).max(100),
  eventType: z.enum(["view", "cta_click", "email_submit"]),
  website_url: z.string().optional(), // Honeypot (silently drop if filled)
  cf_turnstile_response: z.string().optional(), // Cloudflare turnstile token
});

export type FakeDoorSignalInput = z.infer<typeof FakeDoorSignalInputSchema>;
