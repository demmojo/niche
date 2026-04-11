/**
 *
 */
export function zodToGeminiSchema(schema: any): any {
  if (!schema || !schema._def) return {};

  // For z.optional(), Zod 4 uses type: 'optional', with innerType in _def.innerType
  if (schema._def.type === "optional") {
    // Gemini schemas don't have "optional" type directly. We handle required properties in the parent object.
    // For the node itself, we just return the inner schema.
    return zodToGeminiSchema(schema._def.innerType);
  }

  const type = schema._def.type;

  if (type === "string") {
    return { type: "STRING", description: schema.description || undefined };
  } else if (type === "number") {
    return { type: "NUMBER", description: schema.description || undefined };
  } else if (type === "boolean") {
    return { type: "BOOLEAN", description: schema.description || undefined };
  } else if (type === "array") {
    return {
      type: "ARRAY",
      description: schema.description || undefined,
      items: zodToGeminiSchema(
        schema._def.type === "array" ? schema._def.element : schema.element,
      ),
    };
  } else if (type === "object") {
    const shape =
      typeof schema._def.shape === "function"
        ? schema._def.shape()
        : schema._def.shape;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToGeminiSchema(value);
      if ((value as any)._def?.type !== "optional") {
        required.push(key);
      }
    }

    return {
      type: "OBJECT",
      description: schema.description || undefined,
      properties,
      required: required.length > 0 ? required : undefined,
    };
  } else if (type === "enum") {
    return {
      type: "STRING",
      description: schema.description || undefined,
      enum: schema._def.values,
    };
  }

  // fallback
  return {};
}
