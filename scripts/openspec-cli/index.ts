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
import { CliOptionsSchema } from "./schema.js";

import { proposePlan } from "./propose.js";
import { startFeature } from "./start.js";

const program = new Command();

program
  .name("openspec")
  .description(
    "OpenSpec DAG Engine: Manage, validate, and compile spec-driven development feature graphs.",
  )
  .version("1.0.0")
  .option(
    "--non-interactive",
    "Disable interactive prompts and routing human-readable logs to stderr",
    false,
  )
  .option("--json", "Emit pure JSON output on stdout", false)
  .option("--force", "Overwrite existing resources safely", false)
  .option(
    "--dry-run",
    "Preview scaffolding or file writes without modifying filesystem",
    false,
  )
  .showHelpAfterError("(Run with --help for examples)");

program
  .command("propose")
  .argument(
    "<path-to-plan.md>",
    'The path to the plan markdown file. Use "-" to read from stdin.',
  )
  .option("--stdin", "Read from stdin instead of a file")
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
  .addHelpText(
    "after",
    `
Examples:
  $ openspec propose openspec/plans/my-plan.md
  $ openspec propose openspec/plans/my-plan.md --force
  $ cat my-plan.md | openspec propose -
  $ openspec propose --stdin < my-plan.md`,
  )
  .action(async (planPath, options, command) => {
    const rawOpts = { ...command.optsWithGlobals(), ...options };
    const opts = CliOptionsSchema.parse(rawOpts);
    await proposePlan(planPath, opts);
  });

program
  .command("start")
  .argument("<feature-name>", "The exact folder name of the feature")
  .option(
    "--auto-fix",
    "Automatically run LLM to fix ai-eval failures if needed",
  )
  .description(
    "Validate dependencies and evaluation history, then generate implementation context",
  )
  .addHelpText(
    "after",
    `
Examples:
  $ openspec start my-feature
  $ openspec start my-feature --auto-fix
  $ openspec start my-feature --non-interactive --json`,
  )
  .action(async (featureName, options, command) => {
    const rawOpts = { ...command.optsWithGlobals(), ...options };
    const opts = CliOptionsSchema.parse(rawOpts);
    await startFeature(featureName, opts);
  });

program
  .command("validate")
  .description(
    "Verify YAML schema and ensure the dependency graph (DAG) has no circular loops",
  )
  .addHelpText(
    "after",
    `
Examples:
  $ openspec validate
  $ openspec validate --json`,
  )
  .action(async (_, command) => {
    const rawOpts = { ...command.optsWithGlobals() };
    const opts = CliOptionsSchema.parse(rawOpts);
    const { TerminalPresenter, isHeadless } = await import("./presenter.js");
    const presenter = new TerminalPresenter(
      opts.nonInteractive || isHeadless(),
      opts.json,
    );
    const specs = getAllSpecs();
    const isValid = checkCycles(specs, presenter);
    if (!isValid) {
      process.exit(1);
    }
    presenter.success(
      { message: `Validated ${specs.length} specs successfully.` },
      `Validated ${specs.length} specs successfully.`,
    );
  });

program
  .command("detect-collisions")
  .description(
    "Scan specs using embeddings to find duplicates or feature bloat",
  )
  .addHelpText(
    "after",
    `
Examples:
  $ openspec detect-collisions
  $ openspec detect-collisions --json`,
  )
  .action(async (_, command) => {
    const rawOpts = { ...command.optsWithGlobals() };
    const opts = CliOptionsSchema.parse(rawOpts);
    const specs = getAllSpecs();
    await checkCollisions(specs, false, undefined, opts);
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
  .addHelpText(
    "after",
    `
Examples:
  $ openspec build-context user-auth
  $ openspec build-context user-auth --json`,
  )
  .action(async (featureName, _, command) => {
    const rawOpts = { ...command.optsWithGlobals() };
    const opts = CliOptionsSchema.parse(rawOpts);
    const specs = getAllSpecs();
    const context = await buildContext(featureName, specs, opts);
    const { TerminalPresenter, isHeadless } = await import("./presenter.js");
    const presenter = new TerminalPresenter(
      opts.nonInteractive || isHeadless(),
      opts.json,
    );
    presenter.success({ context }, context);
  });

program
  .command("ai-eval")
  .description(
    "Run an LLM-as-a-Judge semantic review to evaluate spec clarity and architecture",
  )
  .addHelpText(
    "after",
    `
Examples:
  $ openspec ai-eval
  $ openspec ai-eval --json`,
  )
  .action(async (_, command) => {
    const rawOpts = { ...command.optsWithGlobals() };
    const opts = CliOptionsSchema.parse(rawOpts);
    const specs = getAllSpecs();
    await runEval(specs, opts);
  });

program
  .command("check-ready")
  .argument("<feature-name>", "The exact folder name of the feature to check")
  .description(
    "Check if a spec is ready to be implemented (all dependencies are complete)",
  )
  .addHelpText(
    "after",
    `
Examples:
  $ openspec check-ready my-feature
  $ openspec check-ready my-feature --json`,
  )
  .action(async (featureName, _, command) => {
    const rawOpts = { ...command.optsWithGlobals() };
    const opts = CliOptionsSchema.parse(rawOpts);
    const { TerminalPresenter, isHeadless } = await import("./presenter.js");
    const presenter = new TerminalPresenter(
      opts.nonInteractive || isHeadless(),
      opts.json,
    );
    const specs = getAllSpecs();
    const isReady = checkReadiness(
      specs,
      featureName,
      opts.nonInteractive,
      presenter,
    );
    if (!isReady) {
      process.exit(1);
    }
    presenter.success({ ready: true }, `Feature ${featureName} is ready.`);
  });

program
  .command("generate-docs")
  .description(
    "Compile a self-healing central project README from templates, OpenSpecs, and git history",
  )
  .addHelpText(
    "after",
    `
Examples:
  $ openspec generate-docs
  $ openspec generate-docs --json`,
  )
  .action(async (_, command) => {
    const rawOpts = { ...command.optsWithGlobals() };
    const opts = CliOptionsSchema.parse(rawOpts);
    await generateDocs(opts);
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
  .addHelpText(
    "after",
    `
Examples:
  $ openspec check-coverage my-feature
  $ openspec check-coverage my-feature --threshold 95
  $ openspec check-coverage my-feature --json`,
  )
  .action(async (featureName, options, command) => {
    const rawOpts = { ...command.optsWithGlobals(), ...options };
    const opts = CliOptionsSchema.parse(rawOpts);
    const passed = await checkCoverage(
      featureName,
      parseFloat(opts.threshold || "90"),
      opts,
    );
    if (!passed) {
      process.exit(1);
    }
  });

program.parse();
