---
name: Strategy Committee Pipeline
overview: A hardened GitHub Action pipeline using Gemini 3.1 Pro that simulates a Strategy Committee to update STRATEGY.md and README.md upon OpenSpec archival, and runs a Map-Reduce Coherence/Drift Check to detect contradictions between docs and the codebase.
todos:
  - id: setup-gha
    content: Create .github/workflows/strategy-committee.yml with OpenSpec archive triggers, concurrency locks, and App token authentication
    status: pending
  - id: create-script
    content: Write scripts/strategy-committee.ts using @google/genai, Zod, and zod-to-json-schema
    status: pending
  - id: design-prompt
    content: Implement the multi-persona Socratic prompt targeting OpenSpec context (not raw diffs)
    status: pending
  - id: setup-readme-anchors
    content: Add HTML anchor comments to README.md and STRATEGY.md for safe text injection
    status: pending
  - id: add-coherence-check
    content: Add coherence-check phase using the Claim-Verification Map-Reduce pattern
    status: pending
isProject: false
dependencies: [] # Explicitly setting no dependencies to avoid DAG dangling references
---

# Strategy Committee Pipeline Plan

Based on strict workspace rules, adversarial review, and product strategy heuristics, we have pivoted the execution trigger. Generating strategy from raw code `git diffs` on every push causes "split-brain" strategy drift and API token exhaustion. Strategy dictates code; code does not dictate strategy.

Instead, the Action will run when an OpenSpec is **archived**. This is the SSOT for completed strategic work. It will also execute a **Coherence Drift Check** to ensure documentation and code remain aligned without exhausting token limits.

**DAG Constraints:** This feature has NO dependencies (`depends_on: []`) and does not extend any existing features. It is a standalone CI tool. Do not hallucinate dependencies like `openspec-framework`.

## 1. GitHub Action Infrastructure (`.github/workflows/strategy-committee.yml`)

- **The Archival Trigger:** Run on `push` to `main`, but restrict it strictly to OpenSpec archival paths.
  ```yaml
  on:
    push:
      branches: [main]
      paths: ["openspec/archive/**/*.md"]
  ```
- **Concurrency & Race Conditions:** `main` is highly concurrent. Use a concurrency block to queue runs sequentially and prevent non-fast-forward Git rejections.
  ```yaml
  concurrency:
    group: strategy-committee-queue
    cancel-in-progress: false
  ```
- **Handling GitHub Actions Queue Drops:** GitHub limits concurrency queues to 1 pending job. If multiple specs are archived in rapid succession, jobs will be silently dropped. To solve this, the Node.js script will not just process the single commit that triggered it. Instead, it will scan the `openspec/archive/` directory for _all_ files modified in the last 24 hours that haven't been synced to `STRATEGY.md` (by comparing git hashes or a state file), ensuring no dropped jobs lead to missed strategy updates.
- **Authentication (Branch Protection Bypass):** The default `GITHUB_TOKEN` cannot push to protected branches. Use `actions/create-github-app-token` to generate a short-lived token for a trusted App configured to bypass branch protections, or use a trusted PAT.
- **Loop Prevention:** Ignore `STRATEGY.md` and `README.md` paths.

## 2. Orchestration Script (`scripts/strategy-committee.ts`)

- **Context Assembly (No `git diff`):** The script reads the `proposal.md`, `design.md`, and `tasks.md` from the recently archived OpenSpec folder. This provides human-verified business intent, bypassing massive context-window blowouts from `package-lock.json` bumps.
- **Gemini 3.1 Pro via `@google/genai`:**
  - Enforce structured outputs by passing a `Zod` schema through `zodToJsonSchema`.
  - Set `responseMimeType: "application/json"`.
- **The Socratic Prompt:** The system prompt will adopt the required personas:
  - `/product-strategist`: Demands lean value and business impact.
  - `/gfs-accelerator-mentor`: Enforces "metric minimalism" (ignores vanity metrics).
  - `/adversarial-document-reviewer`: Prevents the LLM from hallucinating strategy that isn't explicitly in the OpenSpec.
- **Strict JSON Schema:**
  - `warrantsUpdate`: boolean (significance gate).
  - `strategyContent`: string (the 500-word replace-and-synthesize block).
  - `readmeSummary`: string (2-sentence high-level summary).

## 3. Coherence Drift Check (Map-Reduce Pattern)

To ensure that the codebase and docs do not contradict each other—without suffering context exhaustion or false positives—we implement a **"Claim-Verification" Map-Reduce** workflow natively in the script, rejecting heavy RAG/VectorDB bloat:

1. **Map (Doc to Claims):**
   - **DAG Pruning:** Only read `README.md` and active specs (ignoring superseded/archived specs using `.openspec.yaml`).
   - Use Gemini 3.1 Pro to extract atomic, testable claims from these docs into a JSON array (e.g. `{"domain": "auth", "claim": "Admins use custom claims"}`).
2. **Blast-Radius Scoping (Search):**
   - **No AST Guesswork:** We will not use fragile AST parsing to map natural language claims to random files.
   - **Deterministic Scoping:** We will extract the exact file paths modified by the OpenSpec feature branch. The script will run `git show --name-only <merge_commit_sha>` or read the `.openspec.yaml` to retrieve the definitive list of changed files.
   - We map the claims _only_ against these explicitly modified files.
3. **Reduce (Code vs Claims):**
   - Run parallel, isolated Gemini 3.1 Pro calls. Each call gets exactly ONE claim and its relevant code chunk.
   - **Constraint:** Instruct Gemini to ignore omissions and `// TODO` comments. A contradiction only exists if the code explicitly violates a stated claim.
   - Outputs a Zod-validated `DriftReportSchema` (`status: PASS | DRIFT_DETECTED`). If severe drift is found, the script logs the JSON and exits cleanly (optionally failing the CI job).

## 4. Documentation Constraints (Anti-Bloat)

- **Injection Zones:** Do NOT let Gemini rewrite entire files. Use HTML anchors:
  - `<!-- STRATEGY_COMMITTEE_START -->` / `<!-- STRATEGY_COMMITTEE_END -->`
  - The Node.js script will safely `string.replace` between these anchors.
- **Scrubbing:** The prompt strictly forbids the AI from mentioning internal agent names ("Martyna", "Committee") or exposing its mechanical nature in the output text. It must read as an executive product update.

## 5. Resilient Auto-Commit Phase

- Stage the changes: `git add README.md STRATEGY.md`.
- Commit as the bot: `git commit -m "docs: sync strategy with archived OpenSpec [skip ci]"`. The `[skip ci]` flag is critical to prevent recursive triggering.
- **Pre-Push Sync:** Just before pushing, run `git pull --rebase origin main` to fetch any changes pushed by other engineers during the ~15 seconds the Gemini API took to respond.
- `git push origin main`.
