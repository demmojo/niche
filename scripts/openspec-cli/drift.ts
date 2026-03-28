#!/usr/bin/env npx tsx

/**
 * Documentation Drift Detector
 *
 * An ML-powered pre-push script that analyzes git diffs to automatically validate
 * whether recent code changes render existing documentation stale or inaccurate.
 *
 * It runs semantic validation using an LLM to distinguish between true documentation
 * drift and mere noise like refactors or formatting changes.
 */

import { promises as fs } from "fs";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

async function runDriftDetection(): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Skipping drift detection: GEMINI_API_KEY is not set.");
    return;
  }

  // Get the diff that is about to be pushed.
  let diffContent = "";
  try {
    const remoteBranch = execSync(
      "git rev-parse --abbrev-ref --symbolic-full-name @{u}",
      { stdio: ["pipe", "pipe", "ignore"] },
    )
      .toString()
      .trim();
    diffContent = execSync(`git diff ${remoteBranch}...HEAD`).toString();
  } catch (e) {
    try {
      diffContent = execSync("git diff HEAD~1..HEAD").toString();
    } catch (e2) {
      // Might be first commit
      diffContent = "";
    }
  }

  if (!diffContent || diffContent.trim().length === 0) {
    console.log(
      "No substantive code changes found to check for documentation drift.",
    );
    return;
  }

  console.log("Analyzing code changes for potential documentation drift...");

  let changedFiles: string[] = [];
  try {
    changedFiles = execSync("git diff --name-only HEAD~1..HEAD")
      .toString()
      .trim()
      .split("\n");
  } catch (e) {}

  const mdFilesChanged = changedFiles.some(
    (f) => f.endsWith(".md") || f.endsWith(".mdc") || f.endsWith(".yaml"),
  );

  if (mdFilesChanged) {
    console.log(
      "Documentation files were modified in this push. Assuming drift is handled. Proceeding.",
    );
    return;
  }

  const ai = new GoogleGenAI({});

  try {
    const prompt = `You are an expert Staff Software Engineer and Technical Writer. 
Your goal is to perform a semantic drift check on a git diff.
A git push is occurring that changes code, but NO documentation files were modified.

Analyze the git diff and determine if these code changes render the existing documentation inaccurate or incomplete.
Ignore noise such as:
- Variable or method renames
- Code formatting and stylistic changes
- Minor bug fixes or internal refactoring that does not change API contracts or system behavior

Focus on:
- API changes (new endpoints, altered request/response schemas)
- Architectural shifts or new system dependencies
- Changes to user-facing UI or workflows
- Database schema changes

If you detect substantive changes that require documentation updates, flag it as 'hasDrift: true' and explain why in 'reason'. Provide a suggested markdown patch if possible.

Git Diff:
${diffContent.substring(0, 10000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            hasDrift: {
              type: "boolean",
              description:
                "Whether the documentation has drifted from the code changes.",
            },
            reason: {
              type: "string",
              description:
                "Explanation of why the documentation is stale or why it is still accurate.",
            },
            suggestedPatch: {
              type: "string",
              description:
                "A suggested markdown patch to fix the documentation drift, if any.",
            },
          },
          required: ["hasDrift", "reason"],
        },
      },
    });

    const content = response.text;
    if (content) {
      const result = JSON.parse(content);
      if (result.hasDrift) {
        console.error("\n❌ Documentation Drift Detected!");
        console.error(`\nReason: ${result.reason}\n`);
        if (result.suggestedPatch) {
          console.error(`Suggested Update:\n${result.suggestedPatch}\n`);
        }
        console.error(
          "Please update the relevant documentation (e.g., OpenSpec, README) and commit before pushing.",
        );
        process.exit(1);
      } else {
        console.log("✅ No documentation drift detected. Push approved.");
      }
    }
  } catch (e) {
    console.error("Warning: Failed to perform ML drift detection", e);
  }
}

runDriftDetection().catch((e) => {
  console.error("Fatal error in drift detector:", e);
  process.exit(1);
});
