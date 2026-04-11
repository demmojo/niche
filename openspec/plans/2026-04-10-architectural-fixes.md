# Architecture Fixes for OpenSpec CLI

Based on the research into Node.js interactive prompt timeouts and NDJSON streaming patterns, here are the concise, actionable architectural fixes for the three identified gaps.

## 1. Interactive Prompt Deadlock Fix

**The Problem:** The current `promptUser` implementation in `scripts/openspec-cli/collision.ts` uses the callback-based `readline` module, which hangs indefinitely if no input is received, deadlocking headless agents.

**The Fix:** Migrate to Node's `readline/promises` API and inject an `AbortSignal.timeout()` to aggressively close hanging prompts and throw a predictable error.

```typescript
// scripts/openspec-cli/collision.ts
import * as readlinePromises from "readline/promises";

export async function promptUser(
  question: string,
  options: string[],
  timeoutMs: number = 60000, // 60s default timeout
): Promise<string> {
  const rl = readlinePromises.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Fails open after timeout to prevent agent deadlock or stale hijacks
  const signal = AbortSignal.timeout(timeoutMs);

  const ask = async (): Promise<string> => {
    try {
      // Node 16+ supports AbortSignal natively in readline/promises
      const answer = await rl.question(`${question} [${options.join("/")}]: `, {
        signal,
      });

      if (options.includes(answer)) {
        rl.close();
        return answer;
      } else {
        console.error(`Invalid option. Choose one of: ${options.join(", ")}`);
        return ask();
      }
    } catch (err: any) {
      rl.close();
      if (err.name === "AbortError") {
        throw new Error(
          `Prompt timed out after ${timeoutMs}ms. Aborting to prevent deadlock.`,
        );
      }
      throw err;
    }
  };

  return ask();
}
```

## 2. Predictable ML Output via NDJSON

**The Problem:** Emitting one massive JSON payload at the end of a 60-second ML execution starves downstream parsers of progress events and creates memory risks.

**The Fix:** Adopt an explicit NDJSON (Newline Delimited JSON) + Claim Check pattern.

- **`stdout`**: Strictly reserved for newline-delimited JSON progress events and the final Claim Check.
- **`stderr`**: Reserved for all human-readable logs (using `console.error` or `presenter.warn`).
- **Disk**: The final massive result is written to `.tmp/`.

```typescript
// Example Implementation for ML commands (e.g., audit-drift)
import * as fs from "fs";

// 1. Emit NDJSON progress to stdout
function emitProgress(step: string, status: string) {
  process.stdout.write(
    JSON.stringify({ type: "progress", step, status }) + "\n",
  );
}

// 2. Emit human logs to stderr
console.error("🔍 Analyzing structural drift...");

async function runMLCommand() {
  emitProgress("ast_parsing", "started");
  // ... do heavy ML work ...
  const fullReport = {
    /* massive JSON object */
  };

  // 3. Write massive payload to disk (Claim Check pattern)
  const claimCheckPath = ".tmp/audit_report.json";
  fs.writeFileSync(claimCheckPath, JSON.stringify(fullReport, null, 2));

  // 4. Emit the final Claim Check reference
  process.stdout.write(
    JSON.stringify({
      type: "complete",
      claimCheckPath,
    }) + "\n",
  );

  process.exit(0); // Exit safely
}
```

## 3. Agent "Halt and Update" Loop Sequence

**The Problem:** By stripping ML evaluations (`ai-eval`, `audit-drift`) out of the `start` command, agents can blindly loop `start` after editing a spec without passing guardrails.

**The Fix:** Explicitly define the mandatory, sequential command loop in `openspec-workflow.mdc` that agents MUST execute when hitting a technical constraint and updating a spec.

**The Exact Command Sequence:**

1. **Edit:** Agent directly updates `design.md` or `spec.md` to reflect the new reality.
2. **Validate DAG:**
   `npm run openspec validate --json`
   _(Ensures structural graph integrity is intact)._
3. **Run ML Guardrails:**
   `npm run openspec ai-eval --non-interactive --json`
   _(Explicitly evaluates the new trade-offs/clarity)._
4. **Stage and Lock:**
   `npm run openspec start <feature> --stage --non-interactive --json`
   _(Generates context and lock token safely, WITHOUT `--auto-fix`)._
5. **Approve & Apply:** Wait for human approval, then run:
   `npm run openspec apply --token=<token>`
