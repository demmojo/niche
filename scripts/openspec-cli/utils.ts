import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { OpenSpec, OpenSpecSchema } from "./schema.js";
import { z } from "zod";
import type { GoogleGenAI } from "@google/genai";
// import { zodToJsonSchema } from "zod-to-json-schema";

export interface ParsedSpec {
  id: string; // the folder name
  dirPath: string;
  yamlPath: string;
  data: OpenSpec;
}

/**
 *
 */
export async function generateWithSelfHealing<T>(
  ai: any,
  modelName: string,
  prompt: string,
  schema: z.ZodSchema<T>,
  systemInstruction?: string,
  maxRetries = 3,
  timeoutMs = 60000,
): Promise<T> {
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { zodToGeminiSchema } = await import("./zodToGemini.js");
      const schemaDef = zodToGeminiSchema(schema as any);

      const config: any = {
        responseMimeType: "application/json",
      };

      // Only set responseSchema if we could properly extract the definition
      if (schemaDef && typeof schemaDef === "object" && schemaDef.type) {
        config.responseSchema = schemaDef;
      }
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const signal = AbortSignal.timeout(timeoutMs);

      const responsePromise = ai.models.generateContent(
        {
          model: modelName,
          contents: currentPrompt,
          config: config,
        },
        { signal },
      );

      let timeoutId: any;
      const timeoutPromise = new Promise<any>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("LLM Timeout Exceeded")),
          timeoutMs,
        );
      });

      const response = await Promise.race([
        responsePromise,
        timeoutPromise,
      ]).finally(() => {
        clearTimeout(timeoutId);
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from AI model");
      }

      const payload = JSON.parse(responseText);

      // Enforce strict validation locally
      return schema.parse(payload);
    } catch (error: any) {
      if (attempt === maxRetries) {
        console.error(
          `LLM failed validation after ${maxRetries} attempts. Last error: ${error}`,
        );
        throw error;
      }

      console.warn(
        `Validation attempt ${attempt} failed. Retrying... (${error.message || error})`,
      );

      // Exponential backoff
      await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 1000));

      // Feedback loop to LLM
      if (error instanceof z.ZodError) {
        currentPrompt = `${prompt}\n\n[SYSTEM: Your previous output failed strict validation. Fix the following errors and return ONLY valid JSON: ${error.message}]`;
      } else {
        currentPrompt = `${prompt}\n\n[SYSTEM: Your previous output failed to parse or execute: ${error.message}. Please try again and return ONLY valid JSON.]`;
      }
    }
  }
  throw new Error("Unreachable");
}

/**
 *
 */
export function truncateGitDiff(diff: string, maxLines: number = 500): string {
  const lines = diff.split("\n");
  if (lines.length <= maxLines) return diff;

  // Keep 50% from the top, 50% from the bottom
  const head = lines.slice(0, Math.floor(maxLines / 2));
  const tail = lines.slice(-Math.floor(maxLines / 2));

  return [
    ...head,
    `\n... [ ${lines.length - maxLines} lines truncated from middle ] ...\n`,
    ...tail,
  ].join("\n");
}

import * as crypto from "crypto";

/**
 *
 */
export function hashString(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 *
 */
export function getAllSpecs(
  baseDirs: string[] = [
    "openspec/changes",
    "openspec/archive",
    "openspec/archive/changes",
  ],
): ParsedSpec[] {
  const specs: ParsedSpec[] = [];

  for (const baseDir of baseDirs) {
    if (!fs.existsSync(baseDir)) continue;

    const items = fs.readdirSync(baseDir);
    for (const item of items) {
      const dirPath = path.join(baseDir, item);
      if (fs.statSync(dirPath).isDirectory()) {
        const yamlPath = path.join(dirPath, ".openspec.yaml");
        if (fs.existsSync(yamlPath)) {
          const content = fs.readFileSync(yamlPath, "utf-8");
          try {
            const rawData = yaml.load(content);
            const data = OpenSpecSchema.parse(rawData);
            specs.push({
              id: item,
              dirPath,
              yamlPath,
              data,
            });
          } catch (error) {
            console.error(`Validation failed for ${yamlPath}:`);
            console.error(error);
            process.exitCode = 1;
            return;
          }
        }
      }
    }
  }

  return specs;
}
