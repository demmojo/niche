import fs from "fs";
import path from "path";

/**
 * Validates local test coverage for an OpenSpec feature against a strict threshold.
 * It parses the V8/Istanbul JSON coverage report and checks statement/branch metrics.
 */
export async function checkCoverage(
  featureName: string,
  threshold: number,
): Promise<boolean> {
  const coveragePath = path.resolve(
    process.cwd(),
    "coverage",
    "coverage-summary.json",
  );

  console.log(`Checking coverage against >= ${threshold}% threshold...`);

  if (!fs.existsSync(coveragePath)) {
    console.error(
      `❌ Coverage summary not found at ${coveragePath}. Please run 'npm run test -- --coverage' first.`,
    );
    return false;
  }

  try {
    const rawData = fs.readFileSync(coveragePath, "utf-8");
    const report = JSON.parse(rawData);

    // Usually the root key in the summary is 'total'
    const totals = report.total;

    if (!totals) {
      console.error(
        "❌ Coverage summary format unrecognized. Expected 'total' root object.",
      );
      return false;
    }

    const { lines, statements, functions, branches } = totals;
    let passed = true;

    console.log(`\nCoverage Report (Required: ${threshold}%):`);
    console.log("-----------------------------------------");

    const checkMetric = (name: string, metric: any) => {
      // In json-summary, the structure is usually { total, covered, skipped, pct }
      const pct =
        typeof metric === "number"
          ? metric
          : metric && metric.pct !== undefined
            ? metric.pct
            : 0;
      const isPassing = pct >= threshold;
      console.log(`${name.padEnd(12)}: ${pct}% ${isPassing ? "✅" : "❌"}`);
      if (!isPassing) passed = false;
    };

    checkMetric("Statements", statements.pct);
    checkMetric("Branches", branches.pct);
    checkMetric("Functions", functions.pct);
    checkMetric("Lines", lines.pct);

    console.log("-----------------------------------------");

    if (passed) {
      console.log(`✅ ${featureName} passes the mechanical coverage check.`);
      return true;
    } else {
      console.error(
        `\n❌ Mechanical Check Failed. Intent-Based Testing mandates ${threshold}% coverage across all metrics.`,
      );
      return false;
    }
  } catch (error) {
    console.error("❌ Failed to parse coverage report:", error);
    return false;
  }
}
