import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { execSync } from "child_process";
import { CliOptions } from "./schema.js";

export async function migrateLegacySpecs(opts: CliOptions) {
  const { TerminalPresenter, isHeadless } = await import("./presenter.js");
  const presenter = new TerminalPresenter(
    opts.nonInteractive || isHeadless(),
    opts.json,
  );

  // 1. Strict git status --porcelain guard
  try {
    const status = execSync("git status --porcelain openspec/", {
      encoding: "utf-8",
    });
    if (status.trim().length > 0 && !opts.force) {
      await presenter.fail(
        "Git tree is dirty in openspec/. Please commit or stash changes before migrating. (Or use --force)",
      );
      return;
    }
  } catch (e: any) {
    // If it fails because openspec/ doesn't exist or git isn't initialized, we can ignore or fail.
  }

  // 2. Find and migrate legacy specs
  const baseDirs = [
    "openspec/changes",
    "openspec/archive",
    "openspec/archive/changes",
  ];
  let migratedCount = 0;
  let skippedCount = 0;

  for (const baseDir of baseDirs) {
    if (!fs.existsSync(baseDir)) continue;

    const items = fs.readdirSync(baseDir);
    for (const item of items) {
      const dirPath = path.join(baseDir, item);
      if (!fs.statSync(dirPath).isDirectory()) continue;

      const yamlPath = path.join(dirPath, ".openspec.yaml");
      if (!fs.existsSync(yamlPath)) continue;

      const content = fs.readFileSync(yamlPath, "utf-8");
      let rawData: any;
      try {
        rawData = yaml.load(content);
      } catch (e) {
        continue;
      }

      if (!rawData || typeof rawData !== "object") continue;

      // Skip already migrated specs
      if (rawData.schema === "spec-driven") continue;

      // Ignore active/in-flight specs during migration
      if (
        rawData.status === "active" ||
        rawData.status === "in_progress" ||
        rawData.status === "draft" ||
        rawData.status === "proposed"
      ) {
        // Wait, if we ignore draft/proposed, how do they get migrated?
        // Let's assume active/in_progress are the ones to ignore as per "active/in-flight specs"
        if (rawData.status === "active" || rawData.status === "in_progress") {
          skippedCount++;
          continue;
        }
      }

      // Perform Migration
      const migratedData: any = {
        schema: "spec-driven",
        status: rawData.status || "draft",
      };

      if (rawData.created_at) {
        // Convert ISO string to YYYY-MM-DD
        migratedData.created = new Date(rawData.created_at)
          .toISOString()
          .split("T")[0];
      } else if (rawData.created) {
        migratedData.created = rawData.created;
      }

      if (rawData.learnings_extracted !== undefined) {
        migratedData.learnings_extracted = rawData.learnings_extracted;
      }

      if (rawData.relationships && Array.isArray(rawData.relationships)) {
        // Migrate relationships to depends_on, etc if needed. Most are empty.
        // Actually the legacy relationships usually had { type: 'depends_on', target: '...' }
        const dependsOn: string[] = [];
        for (const rel of rawData.relationships) {
          if (rel.type === "depends_on" && rel.target) {
            dependsOn.push(rel.target);
          }
        }
        if (dependsOn.length > 0) migratedData.depends_on = dependsOn;
      }

      // Write back
      fs.writeFileSync(yamlPath, yaml.dump(migratedData), "utf-8");
      migratedCount++;
    }
  }

  await presenter.success(
    { migratedCount, skippedCount },
    `Successfully migrated ${migratedCount} legacy specs. Skipped ${skippedCount} active/in-flight specs.`,
  );
}
