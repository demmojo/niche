import * as fs from "fs";
import * as path from "path";
import { ParsedSpec } from "./utils.js";
import * as dotenv from "dotenv";

dotenv.config();

/**
 *
 */
function getSpecContent(spec: ParsedSpec): string {
  try {
    const proposal = fs.readFileSync(
      path.join(spec.dirPath, "proposal.md"),
      "utf-8",
    );
    const design = fs.readFileSync(
      path.join(spec.dirPath, "design.md"),
      "utf-8",
    );
    const tasks = fs.readFileSync(path.join(spec.dirPath, "tasks.md"), "utf-8");
    return `Proposal:\n${proposal}\n\nDesign:\n${design}\n\nTasks:\n${tasks}`;
  } catch {
    return "Missing one or more spec markdown files.";
  }
}

/**
 *
 */
export async function runEval(specs: ParsedSpec[]) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Skipping eval: GEMINI_API_KEY is not set.");
    return;
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const { generateWithSelfHealing, hashString } = await import("./utils.js");
  const { saveEval, getLastFailedEval } = await import("./db.js");
  const { z } = await import("zod");

  const evalZodSchema = z.object({
    implementationAmbiguity: z
      .object({
        score: z.number().min(1).max(5),
        feedback: z.string(),
      })
      .describe("Score out of 5 and feedback for implementation ambiguity"),
    architectureConstraints: z
      .object({
        score: z.number().min(1).max(5),
        feedback: z.string(),
      })
      .describe("Score out of 5 and feedback for architecture constraints"),
    backwardCompatibility: z
      .object({
        score: z.number().min(1).max(5),
        feedback: z.string(),
      })
      .describe("Score out of 5 and feedback for backward compatibility"),
    pass: z.boolean(),
    overallFeedback: z.string(),
  });

  console.log("Running Semantic Pass (LLM-as-a-Judge Eval) on recent specs...");

  // Let's test the most recently modified or draft specs
  const draftSpecs = specs.filter(
    (s) => s.data.status === "draft" || s.data.status === "proposed",
  );

  if (draftSpecs.length === 0) {
    console.log("No specs in 'draft' or 'proposed' state to evaluate.");
    return;
  }

  let failedSpecs = 0;

  for (const spec of draftSpecs) {
    console.log(`\nEvaluating OpenSpec: ${spec.id} ...`);

    try {
      const content = getSpecContent(spec);
      const contentHash = hashString(content);
      const lastFailedFeedback = getLastFailedEval(spec.id);

      let prompt = `Please evaluate the following specification:\n\n<specification>\n${content}\n</specification>\n\n<example_good_response>\n{\n  "implementationAmbiguity": { "score": 5, "feedback": "Tasks are extremely clear with exact file paths and code snippets provided." },\n  "architectureConstraints": { "score": 4, "feedback": "Trade-offs between local vs remote execution are well-documented." },\n  "backwardCompatibility": { "score": 5, "feedback": "No existing systems are modified, purely additive feature." },\n  "pass": true,\n  "overallFeedback": "Excellent spec, ready for implementation."\n}\n</example_good_response>\n\n<example_bad_response>\n{\n  "implementationAmbiguity": { "score": 2, "feedback": "Tasks just say 'implement the UI' without mentioning which components or state management to use." },\n  "architectureConstraints": { "score": 1, "feedback": "Does not address how the new database tables will perform under load." },\n  "backwardCompatibility": { "score": 3, "feedback": "Mentions updating the API but doesn't specify if v1 endpoints will break." },\n  "pass": false,\n  "overallFeedback": "Spec is too ambiguous and risky. Needs more detail on database performance and exact task breakdown."\n}\n</example_bad_response>`;

      if (lastFailedFeedback) {
        prompt += `\n\n<previous_feedback>\n${JSON.stringify(lastFailedFeedback, null, 2)}\n</previous_feedback>\n\nNOTE: This spec previously failed evaluation for the reasons listed above. Ensure these issues have been addressed.`;
      }

      const evalResult = await generateWithSelfHealing(
        ai,
        "gemini-3.1-pro-preview",
        prompt,
        evalZodSchema,
        `You are an elite Staff Software Engineer reviewing a product specification. 
Your goal is to evaluate the specification based on three dimensions:
1. Implementation Ambiguity: Are the tasks clear enough for an engineer or AI agent to execute without guessing? (5 = very clear, 1 = very ambiguous)
2. Architecture Constraints: Does the design explicitly address trade-offs and risks? (5 = comprehensive, 1 = missing or poor)
3. Backward Compatibility: Does the spec address potential regressions or impacts on existing systems? (5 = safely addressed, 1 = high risk of breaking changes)

To pass, all dimensions must score at least 3 out of 5.`,
      );

      console.log(
        `- Ambiguity Score: ${evalResult.implementationAmbiguity.score}/5`,
      );
      console.log(
        `- Architecture Score: ${evalResult.architectureConstraints.score}/5`,
      );
      console.log(
        `- Compatibility Score: ${evalResult.backwardCompatibility.score}/5`,
      );
      console.log(`\nFeedback: ${evalResult.overallFeedback}`);

      saveEval(
        Date.now().toString(),
        spec.id,
        contentHash,
        evalResult.pass,
        evalResult,
      );

      if (!evalResult.pass) {
        console.error(`❌ ${spec.id} FAILED the semantic pass.`);
        failedSpecs++;
      } else {
        console.log(`✅ ${spec.id} PASSED the semantic pass.`);
      }
    } catch (error) {
      console.error(`Error evaluating ${spec.id}:`, error);
    }
  }

  if (failedSpecs > 0) {
    console.error(
      `\n${failedSpecs} specs failed evaluation. Fix them before merging.`,
    );
    throw new Error(`${failedSpecs} specs failed evaluation.`);
  } else {
    console.log("\nAll specs passed semantic evaluation.");
  }
}
