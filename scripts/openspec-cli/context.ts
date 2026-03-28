import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI } from "@google/genai";
import { ParsedSpec } from "./utils.js";
import {
  getCache,
  saveCache,
  hashText,
  cosineSimilarity,
} from "./collision.js";

/**
 *
 */
function safeReadFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

/**
 *
 */
function getSpecContent(spec: ParsedSpec): string {
  const proposal = safeReadFile(path.join(spec.dirPath, "proposal.md"));
  const design = safeReadFile(path.join(spec.dirPath, "design.md"));
  const tasks = safeReadFile(path.join(spec.dirPath, "tasks.md"));
  const specMd = safeReadFile(
    path.join(spec.dirPath, "specs", spec.id, "spec.md"),
  );

  let content = `### Spec: ${spec.id} (Status: ${spec.data.status})\n\n`;
  if (proposal) content += `#### Proposal\n${proposal}\n\n`;
  if (design) content += `#### Design\n${design}\n\n`;
  if (specMd) content += `#### Detailed Spec\n${specMd}\n\n`;
  if (tasks) content += `#### Tasks\n${tasks}\n\n`;
  return content;
}

/**
 *
 */
function getSpecSummary(spec: ParsedSpec): string {
  const proposal = safeReadFile(path.join(spec.dirPath, "proposal.md"));
  // Extract first paragraph of proposal or first 200 chars
  const lines = proposal
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"));
  const summary =
    lines.length > 0
      ? lines.slice(0, 3).join(" ")
      : "No description available.";
  return `- **${spec.id}** (${spec.data.status}): ${summary.substring(0, 200)}...\n`;
}

// Helper function for basic BM25-like sparse scoring
/**
 *
 */
function calculateBM25(queryTokens: string[], docTokens: string[]): number {
  if (queryTokens.length === 0 || docTokens.length === 0) return 0;

  const k1 = 1.2;
  const b = 0.75;
  const avgDocLen = 500; // rough heuristic since we don't have total corpus length easily

  let score = 0;
  for (const token of queryTokens) {
    const termFreq = docTokens.filter((t) => t === token).length;
    if (termFreq === 0) continue;

    // Simplistic IDF (not true IDF since we'd need corpus stats, but good enough for local hybrid boost)
    const idf = 1.5;

    const numerator = termFreq * (k1 + 1);
    const denominator =
      termFreq + k1 * (1 - b + b * (docTokens.length / avgDocLen));

    score += idf * (numerator / denominator);
  }
  return score;
}

/**
 *
 */
export async function buildContext(
  featureName: string,
  specs: ParsedSpec[],
): Promise<string> {
  const targetSpec = specs.find((s) => s.id === featureName);

  if (!targetSpec) {
    throw new Error(`Spec '${featureName}' not found.`);
  }

  const deps = targetSpec.data.depends_on || [];
  const blocks = targetSpec.data.blocks || [];

  const depSpecs = specs.filter((s) => deps.includes(s.id));
  const blockedSpecs = specs.filter((s) => blocks.includes(s.id));

  // Specs that are not the target, not a dependency, and not blocked
  const otherSpecs = specs.filter(
    (s) =>
      s.id !== featureName &&
      !deps.includes(s.id) &&
      !blocks.includes(s.id) &&
      s.data.status !== "superseded" &&
      s.data.status !== "archived",
  );

  let output = `# Context for OpenSpec: ${featureName}\n\n`;

  output += `## Target Specification\n`;
  const targetContent = getSpecContent(targetSpec);
  output += `<target_spec>\n${targetContent}\n</target_spec>\n\n`;

  if (depSpecs.length > 0) {
    output += `## Direct Dependencies (Full Text)\n`;
    output += `<dependencies>\n`;
    for (const dep of depSpecs) {
      output += getSpecContent(dep);
    }
    output += `</dependencies>\n\n`;
  }

  if (blockedSpecs.length > 0) {
    output += `## Blocked Downstream Specs (Full Text)\n`;
    output += `<blocked_specs>\n`;
    for (const block of blockedSpecs) {
      output += getSpecContent(block);
    }
    output += `</blocked_specs>\n\n`;
  }

  if (otherSpecs.length > 0) {
    output += `## Global DAG Community (Top Relevant Context)\n`;
    output += `The following related specs were retrieved via hybrid search to provide architectural alignment context.\n\n`;

    let cacheUpdated = false;
    const cache = getCache();
    let targetVector: number[] | null = null;

    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({});
      const targetHash = hashText(targetContent);

      // Get target embedding
      if (cache[targetSpec.id] && cache[targetSpec.id].hash === targetHash) {
        targetVector = cache[targetSpec.id].vector;
      } else {
        try {
          const response = await ai.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: targetContent,
          });
          const vector = response.embeddings?.[0]?.values;
          if (vector) {
            targetVector = vector;
            cache[targetSpec.id] = { hash: targetHash, vector };
            cacheUpdated = true;
          }
        } catch (e) {
          console.warn("Failed to embed target spec for retrieval:", e);
        }
      }

      // Get other spec embeddings and score
      const scoredSpecs = [];
      const queryTokens = targetContent
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3);

      for (const other of otherSpecs) {
        const otherContent = getSpecContent(other);
        const otherHash = hashText(otherContent);
        let otherVector: number[] | null = null;

        if (cache[other.id] && cache[other.id].hash === otherHash) {
          otherVector = cache[other.id].vector;
        } else {
          try {
            const response = await ai.models.embedContent({
              model: "gemini-embedding-2-preview", // the recommended text embedding model for Gemini
              contents: otherContent,
            });
            const vector = response.embeddings?.[0]?.values;
            if (vector) {
              otherVector = vector;
              cache[other.id] = { hash: otherHash, vector };
              cacheUpdated = true;
            }
          } catch (e) {
            // ignore
          }
        }

        let denseScore = 0;
        if (targetVector && otherVector) {
          denseScore = cosineSimilarity(targetVector, otherVector);
        }

        const otherTokens = otherContent
          .toLowerCase()
          .split(/\W+/)
          .filter((t) => t.length > 3);
        const sparseScore = calculateBM25(queryTokens, otherTokens);

        // Normalize sparse score roughly to 0-1 range based on observed values, then blend
        const normalizedSparse = Math.min(sparseScore / 50, 1.0);
        const hybridScore = denseScore * 0.7 + normalizedSparse * 0.3;

        scoredSpecs.push({ spec: other, score: hybridScore });
      }

      if (cacheUpdated) {
        saveCache(cache);
      }

      // Sort and take Top-K (e.g. top 3) instead of ALL
      scoredSpecs.sort((a, b) => b.score - a.score);
      const topK = scoredSpecs.slice(0, 3);

      output += `<retrieved_context>\n`;
      for (const { spec, score } of topK) {
        if (score > 0.3) {
          // Minimum relevance threshold
          output += `### ${spec.id} (Relevance Score: ${(score * 100).toFixed(1)}%)\n`;
          output += getSpecContent(spec) + `\n\n`; // We can inject full text now because it's only Top 3
        }
      }
      output += `</retrieved_context>\n\n`;
    } else {
      // Fallback to old behavior if no API key
      output += `<global_summaries>\n`;
      for (const other of otherSpecs.slice(0, 5)) {
        // limit fallback
        output += getSpecSummary(other);
      }
      output += `</global_summaries>\n\n`;
    }
  }

  return output;
}
