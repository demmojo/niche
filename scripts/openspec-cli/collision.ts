import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI } from "@google/genai";
import { ParsedSpec } from "./utils.js";
import * as dotenv from "dotenv";
import * as crypto from "crypto";

dotenv.config();

const CACHE_FILE = path.join(process.cwd(), ".openspec-gemini-embeddings.json");

export interface EmbeddingCache {
  [specId: string]: {
    hash: string;
    vector: number[];
  };
}

/**
 *
 */
export function getCache(): EmbeddingCache {
  if (fs.existsSync(CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  }
  return {};
}

/**
 *
 */
export function saveCache(cache: EmbeddingCache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Simple hash function for text
/**
 *
 */
export function hashText(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 *
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 *
 */
export async function checkCollisions(specs: ParsedSpec[]) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Skipping collision detection: GEMINI_API_KEY is not set.");
    return;
  }

  const ai = new GoogleGenAI({});
  const cache = getCache();
  let cacheUpdated = false;

  console.log("Generating embeddings for collision detection...");

  const embeddings = new Map<string, number[]>();

  for (const spec of specs) {
    // Only check active/draft specs that aren't superseded
    if (spec.data.status === "superseded" || spec.data.status === "archived")
      continue;

    const proposalPath = path.join(spec.dirPath, "proposal.md");
    let textToEmbed = `Feature: ${spec.id}\n`;
    if (fs.existsSync(proposalPath)) {
      textToEmbed += fs.readFileSync(proposalPath, "utf-8");
    }

    const hash = hashText(textToEmbed);
    if (cache[spec.id] && cache[spec.id].hash === hash) {
      embeddings.set(spec.id, cache[spec.id].vector);
    } else {
      try {
        const response = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: textToEmbed,
        });
        const vector = response.embeddings?.[0]?.values;
        if (!vector) throw new Error("No embedding values returned");
        embeddings.set(spec.id, vector);
        cache[spec.id] = { hash, vector };
        cacheUpdated = true;
      } catch (error) {
        console.error(`Failed to generate embedding for ${spec.id}`, error);
      }
    }
  }

  if (cacheUpdated) {
    saveCache(cache);
  }

  console.log("Checking for collisions...");
  const threshold = 0.85; // Configurable threshold
  let collisionFound = false;

  const specIds = Array.from(embeddings.keys());
  for (let i = 0; i < specIds.length; i++) {
    for (let j = i + 1; j < specIds.length; j++) {
      const idA = specIds[i];
      const idB = specIds[j];
      const vecA = embeddings.get(idA)!;
      const vecB = embeddings.get(idB)!;

      const sim = cosineSimilarity(vecA, vecB);
      if (sim >= threshold) {
        console.warn(`\n⚠️ COLLISION WARNING:`);
        console.warn(
          `Specs '${idA}' and '${idB}' have a high semantic similarity of ${(sim * 100).toFixed(1)}%.`,
        );
        console.warn(
          `Consider merging them or using 'superseded_by' if they represent the same feature.`,
        );
        collisionFound = true;
      }
    }
  }

  if (!collisionFound) {
    console.log("No significant semantic collisions detected.");
  }
}
