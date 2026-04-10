#!/usr/bin/env npx tsx

/**
 * AST-Driven Pre-Commit Drift Healer
 *
 * An ML-powered pre-commit script that analyzes AST diffs to automatically
 * heal documentation drift and surface strategic insights (Tech Debt / Scope Creep).
 */

import { promises as fs } from "fs";
import { execSync } from "child_process";
import * as dotenv from "dotenv";
import * as path from "path";
import { z } from "zod";
import { getStagedASTDiff, formatDiffForLLM } from "./ast-scanner";

dotenv.config({ quiet: true });

const TIMEOUT_MS = 3000;

/**
 *
 */
export async function runDriftHealing(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Skipping drift healing: GEMINI_API_KEY is not set.");
    return;
  }

  const diffs = getStagedASTDiff();
  if (!diffs || diffs.length === 0) {
    // No structural AST changes detected in the staged files. Fast-path exit.
    return;
  }

  const astDiffSummary = formatDiffForLLM(diffs);
  if (!astDiffSummary) {
    return;
  }

  console.log(
    "Analyzing structural AST changes for auto-healing documentation...",
  );

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const healSchema = z.object({
    requiresUpdate: z
      .boolean()
      .describe(
        "Whether this structural change warrants documentation updates.",
      ),
    reason: z.string().describe("Explanation of the structural changes."),
    techDebtTask: z
      .string()
      .optional()
      .describe(
        "If this change feels like an undocumented workaround or scope creep, define a sprint task to refactor or formalize it.",
      ),
  });

  try {
    const prompt = `You are a Staff Software Engineer analyzing structural AST changes for documentation healing.
    
A git commit is in progress. The following structural changes (components, endpoints, hooks) have been detected in the staged files:

<ast_diff>
${astDiffSummary}
</ast_diff>

Analyze these changes. If they introduce new semantic signatures, new APIs, or structural additions, flag requiresUpdate: true.
If the changes appear to be hacky workarounds, undocumented scope creep, or technical debt, provide a concise action item in 'techDebtTask' (e.g., "- [ ] Refactor: ...").

Keep it extremely concise.`;

    // We implement a Promise.race to ensure we fail open if the LLM takes too long (> 3s).
    // The developer's commit should not be blocked indefinitely.
    /**
     *
     */
    const resultPromise = async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash", // Use a faster model for pre-commit
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              requiresUpdate: { type: "boolean" },
              reason: { type: "string" },
              techDebtTask: { type: "string" },
            },
            required: ["requiresUpdate", "reason"],
          },
        },
      });
      return JSON.parse(response.text || "{}");
    };

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("LLM Timeout")), TIMEOUT_MS),
    );

    let result: any;
    try {
      result = await Promise.race([resultPromise(), timeoutPromise]);
    } catch (timeoutErr) {
      console.warn(
        "⚠️ Structural drift detected, but LLM timed out. Proceeding with commit.",
      );
      return;
    }

    if (result.requiresUpdate) {
      console.log(`\nAuto-healing documentation triggered: ${result.reason}`);

      const filesToAdd: string[] = [];

      // If a tech debt task is generated, append it to a global tech-debt doc.
      // In the future, this can be routed to a specific spec's tasks.md via context mapping.
      if (result.techDebtTask) {
        const techDebtPath = path.resolve("openspec/brainstorms/tech-debt.md");

        let existingContent = "";
        try {
          existingContent = await fs.readFile(techDebtPath, "utf-8");
        } catch {
          existingContent = "# Harvested Tech Debt & Scope Creep\n\n";
          // Ensure directory exists
          await fs.mkdir(path.dirname(techDebtPath), { recursive: true });
        }

        const newContent = `${existingContent}\n${result.techDebtTask}\n`;
        await fs.writeFile(techDebtPath, newContent);
        filesToAdd.push(techDebtPath);

        console.log(`📝 Generated Tech Debt Task: ${result.techDebtTask}`);
      }

      // Automatically stage the generated documentation updates so they are included in the commit.
      if (filesToAdd.length > 0) {
        execSync(`git add ${filesToAdd.join(" ")}`);
        console.log("✅ Healed documentation successfully staged for commit.");
      }
    }
  } catch (e) {
    console.warn("Warning: Failed to perform AST drift auto-healing", e);
  }
}

if (
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].endsWith("drift.ts")
) {
  runDriftHealing().catch((e) => {
    console.error("Fatal error in drift healer:", e);
    process.exitCode = 1;
    return;
  });
}
