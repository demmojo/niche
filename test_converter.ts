import { z } from "zod";
import { Type } from "@google/genai";

export function zodToGeminiSchema(schema: any): any {
  if (!schema || !schema._def) return {};

  const type = schema._def.type;

  // Zod 4 structure
  if (type === "optional") {
    // For optional, we extract innerType
    const inner = schema._def.innerType;
    const res = zodToGeminiSchema(inner);
    if (schema.description) res.description = schema.description;
    return res;
  }

  const desc = schema.description || undefined;

  if (type === "string") {
    return { type: Type.STRING, description: desc };
  } else if (type === "number") {
    return { type: Type.NUMBER, description: desc };
  } else if (type === "boolean") {
    return { type: Type.BOOLEAN, description: desc };
  } else if (type === "array") {
    return {
      type: Type.ARRAY,
      description: desc,
      items: zodToGeminiSchema(schema.element || schema._def.type?.element), // element is accessible on schema in Zod4? Let's verify
    };
  } else if (type === "object") {
    const shape =
      typeof schema.shape === "function" ? schema.shape() : schema.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape as Record<string, any>)) {
      properties[key] = zodToGeminiSchema(value);
      if (value._def?.type !== "optional") {
        required.push(key);
      }
    }

    return {
      type: Type.OBJECT,
      description: desc,
      properties,
      required: required.length > 0 ? required : undefined,
    };
  } else if (type === "enum") {
    return {
      type: Type.STRING,
      description: desc,
      enum: schema.options, // In Zod 4 it's options or .values
    };
  }

  return {};
}

const IngestSchema = z.object({
  featureName: z
    .string()
    .describe("Kebab-case short name for the feature directory"),
  proposal: z
    .string()
    .describe(
      "Markdown content for proposal.md (Why, What Changes, Capabilities, Impact)",
    ),
  depends_on: z
    .array(z.string())
    .optional()
    .describe("List of feature-names this depends on"),
});

console.log(JSON.stringify(zodToGeminiSchema(IngestSchema), null, 2));
