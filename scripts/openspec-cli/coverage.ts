import fs from "fs";
import path from "path";
import { CliOptions } from "./schema.js";
import { TerminalPresenter, isHeadless } from "./presenter.js";

/**
 * Validates local test coverage for an OpenSpec feature against a strict threshold.
 * It parses the V8/Istanbul JSON coverage report and checks statement/branch metrics.
 */
export async function checkCoverage(
  featureName: string,
  threshold: number,
  options?: CliOptions,
): Promise<boolean> {
  const presenter = new TerminalPresenter(
    options?.nonInteractive || isHeadless(),
    options?.json || false,
  );

  const coveragePath = path.resolve(
    process.cwd(),
    "coverage",
    "coverage-summary.json",
  );

  presenter.log(`Checking coverage against >= ${threshold}% threshold...`);

  if (!fs.existsSync(coveragePath)) {
    presenter.fail(
      `Coverage summary not found at ${coveragePath}.`,
      "missing_coverage",
      `npm run test -- --coverage`,
    );
    return false;
  }

  try {
    const rawData = fs.readFileSync(coveragePath, "utf-8");
    const report = JSON.parse(rawData);

    // Usually the root key in the summary is 'total'
    const totals = report.total;

    if (!totals) {
      presenter.fail(
        "Coverage summary format unrecognized. Expected 'total' root object.",
        "invalid_coverage_format",
      );
      return false;
    }

    const { lines, statements, functions, branches } = totals;
    let passed = true;
    const metrics: Record<string, number> = {};

    presenter.log(`\nCoverage Report (Required: ${threshold}%):`);
    presenter.log("-----------------------------------------");

    const checkMetric = (name: string, metric: any) => {
      // In json-summary, the structure is usually { total, covered, skipped, pct }
      const pct =
        typeof metric === "number"
          ? metric
          : metric && metric.pct !== undefined
            ? metric.pct
            : 0;
      metrics[name.toLowerCase()] = pct;
      const isPassing = pct >= threshold;
      presenter.log(`${name.padEnd(12)}: ${pct}% ${isPassing ? "✅" : "❌"}`);
      if (!isPassing) passed = false;
    };

    checkMetric("Statements", statements.pct);
    checkMetric("Branches", branches.pct);
    checkMetric("Functions", functions.pct);
    checkMetric("Lines", lines.pct);

    presenter.log("-----------------------------------------");

    if (passed) {
      presenter.success(
        { metrics, passed: true },
        `Global codebase passes the mechanical coverage check (>= ${threshold}%).`,
      );
      return true;
    } else {
      presenter.fail(
        `Mechanical Check Failed. Intent-Based Testing mandates ${threshold}% global coverage across all metrics.`,
        "coverage_failed",
        `npm run test -- --coverage`,
      );
      return false;
    }
  } catch (error) {
    presenter.fail(
      `Failed to parse coverage report: ${error instanceof Error ? error.message : String(error)}`,
      "parse_error",
    );
    return false;
  }
}
