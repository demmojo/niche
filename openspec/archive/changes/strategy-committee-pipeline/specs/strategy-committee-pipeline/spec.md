# Specification

## Features

1. **GitHub Action Archival Trigger**: Listens exclusively to `push` events on `openspec/archive/**/*.md`.
2. **Resilient Orchestration**: Scans `openspec/archive/` for files modified in the last 24h to prevent dropped queue jobs.
3. **Strategy Extraction**: Passes `proposal.md`, `design.md`, and `tasks.md` to Gemini 3.1 Pro via a Socratic prompt (Product Strategist, GFS Accelerator Mentor, Adversarial Reviewer). Requires JSON schemas containing `warrantsUpdate`, `strategyContent`, and `readmeSummary`.
4. **Coherence Drift Check**: A Map-Reduce process:
   - **Map**: Extracts testable claims from `README.md` and active specs.
   - **Scope**: Identifies files explicitly changed in the merge commit via `git show --name-only <sha>`.
   - **Reduce**: Compares claims against code chunks in isolated, parallel Gemini requests to detect explicit contradictions.
5. **Safe Injection & Sync**: Uses HTML anchors to selectively string-replace text inside `STRATEGY.md` and `README.md`. Commits as a bot using `[skip ci]` after a pre-push rebase.

## Scenarios

**Scenario 1: Archiving a completed spec**

- **WHEN** an OpenSpec is archived in `openspec/archive/` via a main branch merge
- **THEN** the Strategy Committee pipeline triggers sequentially via a concurrency lock.

**Scenario 2: Handling GHA Queue Drops**

- **WHEN** multiple specs are archived rapidly and GitHub Actions drops intermediate queued jobs
- **THEN** the active orchestration script scans the archive for all modified specs in the last 24 hours, ensuring no updates are lost.

**Scenario 3: Coherence Drift Check (Pass)**

- **WHEN** the pipeline runs the Map-Reduce check
- **AND** the localized codebase changes do not explicitly violate the extracted documentation claims
- **THEN** the pipeline reports `PASS` and proceeds.

**Scenario 4: Coherence Drift Check (Drift Detected)**

- **WHEN** the scoped codebase changes explicitly violate an extracted documentation claim
- **THEN** the pipeline logs a `DRIFT_DETECTED` JSON report and exits cleanly.

**Scenario 5: Doc Updates**

- **WHEN** the strategy generation step completes successfully
- **THEN** it injects the content strictly between `<!-- STRATEGY_COMMITTEE_START -->` and `<!-- STRATEGY_COMMITTEE_END -->` markers.
- **AND** pushes the changes to main with a `[skip ci]` flag.
