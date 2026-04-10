import { GoogleGenAI, Type, Schema } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Schema for the Strategy Update
const StrategyUpdateSchema = z.object({
  warrantsUpdate: z
    .boolean()
    .describe(
      "Whether the archived spec warrants a strategy update. True if it fundamentally alters product vision, audience, or core value prop.",
    ),
  strategyContent: z
    .string()
    .describe(
      "Max 500 words. Synthesize changes, goal, customer value, and business impact. Use markdown. Replaces existing strategy.",
    ),
  readmeSummary: z
    .string()
    .describe("A 2-sentence high-level summary to inject into the README."),
});

// Schema for Map Step (Extracting Claims)
const ClaimsSchema = z.object({
  claims: z.array(
    z.object({
      domain: z
        .string()
        .describe(
          "The domain or area of the claim, e.g., 'auth', 'database', 'ui'",
        ),
      claim: z
        .string()
        .describe(
          "A specific, testable architectural, product, or state claim from the documentation.",
        ),
    }),
  ),
});

// Schema for Reduce Step (Drift Report)
const DriftReportSchema = z.object({
  status: z.enum(["PASS", "DRIFT_DETECTED"]),
  drifts: z.array(
    z.object({
      type: z.enum([
        "MISSING_IMPLEMENTATION",
        "CONTRADICTION",
        "UNPLANNED_FEATURE",
      ]),
      file: z.string(),
      description: z.string(),
      severity: z.number().min(1).max(5),
    }),
  ),
});

async function getActiveOpenSpecs(): Promise<string> {
  const specsDir = path.join(process.cwd(), "openspec", "changes");
  if (!fs.existsSync(specsDir)) return "";
  let content = "";
  const entries = fs.readdirSync(specsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const yamlPath = path.join(specsDir, entry.name, ".openspec.yaml");
      if (fs.existsSync(yamlPath)) {
        const yamlContent = fs.readFileSync(yamlPath, "utf8");
        if (
          !yamlContent.includes("status: archived") &&
          !yamlContent.includes("status: superseded")
        ) {
          const specPath = path.join(specsDir, entry.name, "spec.md");
          if (fs.existsSync(specPath)) {
            content += `\n--- Spec: ${entry.name} ---\n${fs.readFileSync(specPath, "utf8")}`;
          }
        }
      }
    }
  }
  return content;
}

async function getArchivedSpecsLast24h(): Promise<
  { name: string; content: string }[]
> {
  const archiveDir = path.join(process.cwd(), "openspec", "archive");
  if (!fs.existsSync(archiveDir)) return [];
  const results = [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const findFiles = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findFiles(fullPath);
      } else if (fullPath.endsWith(".md")) {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs > oneDayAgo) {
          results.push({
            name: entry.name,
            content: fs.readFileSync(fullPath, "utf8"),
          });
        }
      }
    }
  };
  findFiles(archiveDir);
  return results;
}

function getModifiedFiles(sha: string): string[] {
  try {
    const output = execSync(
      `git show --name-only --format="" ${sha}`,
    ).toString();
    return output.split("\n").filter(Boolean);
  } catch (e) {
    console.error("Failed to get modified files for sha", sha);
    return [];
  }
}

async function runStrategyCommittee() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey });

  const archivedSpecs = await getArchivedSpecsLast24h();
  if (archivedSpecs.length === 0) {
    console.log("No recently archived specs found. Exiting.");
    return;
  }

  const specContents = archivedSpecs
    .map((s) => `=== ${s.name} ===\n${s.content}`)
    .join("\n\n");

  // 1. Generate Strategy Update
  const prompt = `
You are the Strategy Review Committee, comprising:
- Product Strategist: Demands lean value and business impact.
- GFS Accelerator Mentor: Enforces metric minimalism.
- Adversarial Reviewer: Prevents hallucinations.

Analyze the following archived OpenSpecs and determine if they warrant an update to the high-level product strategy.
Do NOT mention internal agent names ("Martyna", "Committee") or your AI nature in the output.
Replace and synthesize the strategy; do not just append.

<archived_specs>
${specContents}
</archived_specs>
`;

  console.log("Generating strategy update...");
  const updateRes = await ai.models.generateContent({
    model: "gemini-3.1-pro",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(StrategyUpdateSchema) as Schema,
    },
  });

  const strategyUpdate = JSON.parse(updateRes.text);

  if (strategyUpdate.warrantsUpdate) {
    // Update STRATEGY.md
    if (fs.existsSync("STRATEGY.md")) {
      let strategyFile = fs.readFileSync("STRATEGY.md", "utf8");
      strategyFile = strategyFile.replace(
        /<!-- STRATEGY_COMMITTEE_START -->[\s\S]*<!-- STRATEGY_COMMITTEE_END -->/,
        `<!-- STRATEGY_COMMITTEE_START -->\n${strategyUpdate.strategyContent}\n<!-- STRATEGY_COMMITTEE_END -->`,
      );
      fs.writeFileSync("STRATEGY.md", strategyFile);
    }

    // Update README.md
    if (fs.existsSync("README.md")) {
      let readmeFile = fs.readFileSync("README.md", "utf8");
      readmeFile = readmeFile.replace(
        /<!-- STRATEGY_COMMITTEE_START -->[\s\S]*<!-- STRATEGY_COMMITTEE_END -->/,
        `<!-- STRATEGY_COMMITTEE_START -->\n${strategyUpdate.readmeSummary}\n<!-- STRATEGY_COMMITTEE_END -->`,
      );
      fs.writeFileSync("README.md", readmeFile);
    }
    console.log("Strategy updated successfully.");
  } else {
    console.log("Strategy update not warranted based on the specs.");
  }

  // 2. Coherence Drift Check (Map-Reduce)
  console.log("Running Coherence Drift Check...");
  const readmeContent = fs.existsSync("README.md")
    ? fs.readFileSync("README.md", "utf8")
    : "";
  const activeSpecs = await getActiveOpenSpecs();

  const mapPrompt = `
Extract atomic, testable claims from the following documentation.
<readme>
${readmeContent}
</readme>
<active_specs>
${activeSpecs}
</active_specs>
`;

  const mapRes = await ai.models.generateContent({
    model: "gemini-3.1-pro",
    contents: mapPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(ClaimsSchema) as Schema,
    },
  });

  const mappedClaims = JSON.parse(mapRes.text).claims;

  // Scope: Get explicitly modified files
  const currentSha = process.env.GITHUB_SHA || "HEAD";
  const modifiedFiles = getModifiedFiles(currentSha).filter(
    (f) =>
      f.startsWith("src/") ||
      f.startsWith("server.ts") ||
      f.endsWith(".ts") ||
      f.endsWith(".tsx"),
  );

  if (modifiedFiles.length === 0) {
    console.log(
      "No codebase files modified in this commit. Skipping drift check reduce phase.",
    );
  } else {
    let codebaseSnapshot = "";
    for (const f of modifiedFiles) {
      if (fs.existsSync(f)) {
        codebaseSnapshot += `<file path="${f}">\n${fs.readFileSync(f, "utf8")}\n</file>\n`;
      }
    }

    // Reduce
    const reducePrompt = `
You are the architecture-strategist. Verify if the following code explicitly contradicts any of the claims.
A generalization in the documentation is NOT a contradiction to a specific implementation in the code.
Ignore omissions and // TODO comments. Only flag strict contradictions.

<claims>
${JSON.stringify(mappedClaims, null, 2)}
</claims>

<codebase_snapshot>
${codebaseSnapshot}
</codebase_snapshot>
`;

    const reduceRes = await ai.models.generateContent({
      model: "gemini-3.1-pro",
      contents: reducePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: zodToJsonSchema(DriftReportSchema) as Schema,
      },
    });

    const driftReport = JSON.parse(reduceRes.text);
    if (driftReport.status === "DRIFT_DETECTED") {
      const hasCriticalDrift = driftReport.drifts.some(
        (d: any) => d.severity >= 4,
      );
      console.error("DRIFT DETECTED:");
      console.error(JSON.stringify(driftReport, null, 2));
      if (hasCriticalDrift) {
        process.exit(1);
      }
    } else {
      console.log("Coherence check PASSED.");
    }
  }

  // 3. Auto-Commit Phase
  try {
    const status = execSync("git status --porcelain").toString();
    if (status.includes("STRATEGY.md") || status.includes("README.md")) {
      execSync('git config user.name "github-actions[bot]"');
      execSync(
        'git config user.email "github-actions[bot]@users.noreply.github.com"',
      );
      execSync("git add STRATEGY.md README.md");
      execSync(
        'git commit -m "docs: sync strategy with archived OpenSpec [skip ci]"',
      );
      execSync("git pull --rebase origin main");
      execSync("git push origin main");
      console.log("Successfully committed and pushed strategy updates.");
    } else {
      console.log("No changes to commit.");
    }
  } catch (e) {
    console.error("Failed during git operations:", e);
    process.exit(1);
  }
}

runStrategyCommittee().catch(console.error);
