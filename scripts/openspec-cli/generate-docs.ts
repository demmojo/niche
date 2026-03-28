import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { getAllSpecs } from "./utils.js";
import * as dotenv from "dotenv";

dotenv.config();

export async function generateDocs() {
  const templatePath = path.join(
    process.cwd(),
    "docs",
    "templates",
    "README.template.md",
  );
  const readmePath = path.join(process.cwd(), "README.md");

  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found at ${templatePath}`);
    throw new Error(`Template not found at ${templatePath}`);
  }

  const templateContent = fs.readFileSync(templatePath, "utf-8");

  // 1. Get all OpenSpecs and format raw data
  const specs = getAllSpecs();
  let rawSpecData = "";
  for (const spec of specs) {
    const proposalPath = path.join(spec.dirPath, "proposal.md");
    let summary = "No proposal found.";
    if (fs.existsSync(proposalPath)) {
      const proposalContent = fs.readFileSync(proposalPath, "utf-8");
      // Grab first paragraph after "What Changes" or just first 200 chars
      const whatChangesMatch = proposalContent.match(
        /## What Changes\n+([\s\S]*?)(?=\n##|$)/,
      );
      if (whatChangesMatch && whatChangesMatch[1]) {
        summary = whatChangesMatch[1].trim().slice(0, 150) + "...";
      } else {
        summary = proposalContent.slice(0, 150).replace(/\n/g, " ") + "...";
      }
    }
    const relativeLink = `openspec/changes/${spec.id}`;
    rawSpecData += `- Feature: ${spec.id}\n  Status: ${spec.data.status}\n  Summary: ${summary}\n  Link: ${relativeLink}\n\n`;
  }

  // 2. Get Git History
  let gitHistory = "";
  try {
    gitHistory = execSync(
      'git log -n 15 --pretty=format:"* %s (%h) - %ad" --date=short',
    ).toString();
  } catch (err) {
    console.warn("Could not fetch git history. Defaulting to empty.");
  }

  console.log("Compiling live project documentation...");

  let gitSummaryText = gitHistory;
  let specTableText = `| Feature | Summary | Status | Link |\n|---------|---------|--------|------|\n`;
  let techDebtText = "No tech debt recorded.";
  for (const spec of specs) {
    const relativeLink = `[${spec.id}](openspec/changes/${spec.id})`;
    specTableText += `| ${spec.id} | Derived from proposal | ${spec.data.status} | ${relativeLink} |\n`;
  }

  // 3. Use Machine Learning to ensure documentation is up-to-date and accurate
  if (process.env.GEMINI_API_KEY) {
    console.log(
      "Applying ML best practices for semantic validation and aggregation...",
    );
    const { GoogleGenAI } = await import("@google/genai");
    const { z } = await import("zod");
    const { generateWithSelfHealing } = await import("./utils.js");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const docsSummaryZodSchema = z.object({
      gitSummary: z.string(),
      specTable: z.string(),
      techDebtSummary: z
        .string()
        .describe(
          "Markdown list of harvested tech debt and scope creep items from tech-debt.md. If empty, return a generic 'No tech debt recorded' message.",
        ),
    });

    let techDebtData = "No tech debt recorded.";
    const techDebtPath = path.join(
      process.cwd(),
      "docs",
      "brainstorms",
      "tech-debt.md",
    );
    if (fs.existsSync(techDebtPath)) {
      techDebtData = fs.readFileSync(techDebtPath, "utf-8");
    }

    try {
      const result = await generateWithSelfHealing(
        ai,
        "gemini-3.1-pro-preview",
        `RAW GIT HISTORY:\n<git_history>\n${gitHistory}\n</git_history>\n\nRAW OPENSPEC DATA:\n<openspec_data>\n${rawSpecData}\n</openspec_data>\n\nRAW TECH DEBT DATA:\n<tech_debt>\n${techDebtData}\n</tech_debt>`,
        docsSummaryZodSchema,
        `You are a Technical Lead and Documentation Specialist. 
Your task is to take raw project data and format it perfectly for a README file to keep it live and self-healing.
1. Filter the Git History to highlight actual momentum (features, fixes, specs). Ignore trivial chores or messy auto-commits. Output a clean markdown bulleted list.
2. Format the OpenSpecs data into a perfect Markdown table: | Feature | Summary | Status | Link |. Make the summaries concise (1 sentence max). Ensure the links are formatted as markdown links.
3. Clean up the Tech Debt data into a readable bulleted list of actionable sprint tasks. If there are no tasks, just output "No outstanding technical debt or scope creep."`,
      );

      gitSummaryText = result.gitSummary;
      specTableText = result.specTable;
      techDebtText = result.techDebtSummary;
    } catch (error) {
      console.warn(
        "ML aggregation failed, falling back to raw formatting.",
        error,
      );
    }
  } else {
    console.warn(
      "No GEMINI_API_KEY found. Skipping ML aggregation step, using raw formats.",
    );
  }

  // 4. Inject into Template
  let finalReadme = templateContent;

  const specTableRegex =
    /<!-- OPENSPEC_TABLE_START -->[\s\S]*?<!-- OPENSPEC_TABLE_END -->/;
  finalReadme = finalReadme.replace(
    specTableRegex,
    `<!-- OPENSPEC_TABLE_START -->\n${specTableText}\n<!-- OPENSPEC_TABLE_END -->`,
  );

  const gitHistoryRegex =
    /<!-- GIT_HISTORY_START -->[\s\S]*?<!-- GIT_HISTORY_END -->/;
  finalReadme = finalReadme.replace(
    gitHistoryRegex,
    `<!-- GIT_HISTORY_START -->\n${gitSummaryText}\n<!-- GIT_HISTORY_END -->`,
  );

  const techDebtRegex =
    /<!-- TECH_DEBT_START -->[\s\S]*?<!-- TECH_DEBT_END -->/;
  if (finalReadme.match(techDebtRegex)) {
    finalReadme = finalReadme.replace(
      techDebtRegex,
      `<!-- TECH_DEBT_START -->\n${techDebtText}\n<!-- TECH_DEBT_END -->`,
    );
  }

  // 5. Write final README
  fs.writeFileSync(readmePath, finalReadme);
  console.log(`✅ Successfully updated ${readmePath}`);

  // Try to stage it so a pre-push hook captures it easily
  try {
    execSync("git add README.md");
    console.log(`✅ Staged README.md`);
  } catch (e) {
    // ignore
  }
}
