const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const IngestSchema = z.object({
  featureName: z.string(),
  proposal: z.string(),
});

const jsonSchema = zodToJsonSchema(IngestSchema, { target: "openApi3" });
const schemaDef = jsonSchema.components?.schemas
  ? Object.values(jsonSchema.components.schemas)[0]
  : jsonSchema;

console.log(JSON.stringify(jsonSchema, null, 2));
console.log("SCHEMA DEF:", JSON.stringify(schemaDef, null, 2));
