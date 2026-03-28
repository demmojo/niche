import { z } from "zod";

const CompetitorSchema = z
  .object({
    name: z.string().max(200).optional(),
  })
  .passthrough();

const CampaignRequestSchema = z
  .object({
    competitors: z.array(CompetitorSchema).optional().default([]),
    baseIdea: z.string().max(10000).optional().or(z.object({}).passthrough()),
  })
  .refine(
    (data) => {
      if (data.competitors.length === 0) {
        if (
          typeof data.baseIdea !== "object" ||
          !data.baseIdea ||
          !("name" in data.baseIdea)
        ) {
          return false;
        }
      }
      return true;
    },
    { message: "Fail" },
  );

console.log(CampaignRequestSchema.safeParse({ baseIdea: {} }).success);
console.log(
  CampaignRequestSchema.safeParse({ competitors: [], baseIdea: {} }).success,
);
