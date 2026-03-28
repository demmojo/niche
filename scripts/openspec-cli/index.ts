#!/usr/bin/env tsx
/**
 * OpenSpec DAG Engine & Validator
 *
 * A deterministic orchestrator and ML validation tool for Spec-Driven Development.
 * This CLI tool parses `.openspec.yaml` files, enforces graph acyclicity, checks for
 * semantic collisions using embeddings, and generates optimized context for AI coding agents.
 */
import { Command } from "commander";
import { getAllSpecs } from "./utils.js";
import { checkCycles } from "./validate.js";
import { checkCollisions } from "./collision.js";
import { buildContext } from "./context.js";
import { runEval } from "./eval.js";
import { checkReadiness } from "./readiness.js";
import { generateDocs } from "./generate-docs.js";
import { checkCoverage } from "./coverage.js";

import { proposePlan } from "./propose.js";
import { startFeature } from "./start.js";

const program = new Command();

program
  .name("openspec")
  .description(
    "OpenSpec DAG Engine: Manage, validate, and compile spec-driven development feature graphs.",
  )
  .version("1.0.0");

program
  .command("propose")
  .argument("<path-to-plan.md>", "The path to the plan markdown file")
  .option("--non-interactive", "Run in headless mode with JSON output")
  .option(
    "--on-collision <action>",
    "Action to take on collision (supersede|merge|abort)",
  )
  .option("--auto-fix", "Automatically run LLM to fix ai-eval failures")
  .option(
    "--clear-state",
    "Clear existing sqlite state for the generated feature before evaluating",
  )
  .description(
    "Parse a plan, check collisions, scaffold safely, and run evaluations",
  )
  .action(async (planPath, options) => {
    await proposePlan(planPath, options);
  });

program
  .command("start")
  .argument("<feature-name>", "The exact folder name of the feature")
  .option("--non-interactive", "Run in headless mode with JSON output")
  .option(
    "--auto-fix",
    "Automatically run LLM to fix ai-eval failures if needed",
  )
  .description(
    "Validate dependencies and evaluation history, then generate implementation context",
  )
  .action(async (featureName, options) => {
    await startFeature(featureName, options);
  });

program
  .command("validate")
  .description(
    "Verify YAML schema and ensure the dependency graph (DAG) has no circular loops",
  )
  .action(() => {
    const specs = getAllSpecs();
    const isValid = checkCycles(specs);
    if (!isValid) {
      process.exit(1);
    }
    console.log(`Validated ${specs.length} specs successfully.`);
  });

program
  .command("detect-collisions")
  .description(
    "Scan specs using embeddings to find duplicates or feature bloat",
  )
  .action(async () => {
    const specs = getAllSpecs();
    await checkCollisions(specs);
  });

program
  .command("build-context")
  .argument(
    "<feature-name>",
    "The exact folder name of the feature (e.g., user-auth)",
  )
  .description(
    "Generate an optimized markdown context block (GraphRAG) for AI coding agents",
  )
  .action(async (featureName) => {
    const specs = getAllSpecs();
    const context = await buildContext(featureName, specs);
    console.log(context);
  });

program
  .command("ai-eval")
  .description(
    "Run an LLM-as-a-Judge semantic review to evaluate spec clarity and architecture",
  )
  .action(async () => {
    const specs = getAllSpecs();
    await runEval(specs);
  });

program
  .command("check-ready")
  .argument("<feature-name>", "The exact folder name of the feature to check")
  .description(
    "Check if a spec is ready to be implemented (all dependencies are complete)",
  )
  .action((featureName) => {
    const specs = getAllSpecs();
    const isReady = checkReadiness(specs, featureName);
    if (!isReady) {
      process.exit(1);
    }
  });

program
  .command("generate-docs")
  .description(
    "Compile a self-healing central project README from templates, OpenSpecs, and git history",
  )
  .action(async () => {
    await generateDocs();
  });

program
  .command("check-coverage")
  .argument("<feature-name>", "The exact folder name of the feature")
  .option(
    "-t, --threshold <number>",
    "Minimum coverage percentage required",
    "90",
  )
  .description(
    "Run coverage report parser for a given feature to mechanically verify intent-based testing compliance",
  )
  .action(async (featureName, options) => {
    const passed = await checkCoverage(
      featureName,
      parseFloat(options.threshold),
    );
    if (!passed) {
      process.exit(1);
    }
  });

program.parse();
