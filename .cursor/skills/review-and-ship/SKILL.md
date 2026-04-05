---
name: review-and-ship
description: Finalizes an OpenSpec feature implementation, performs pre-flight checks, creates architecturally dense commits, and opens a PR for CI/CD validation.
---

# Review and Ship

## Trigger

Reviewing changes before shipping. Used to close out an active OpenSpec lifecycle, validate against project rules, commit with architectural density, and open/update a PR.

## Workflow

1. **OpenSpec Lifecycle Check:**
   - Ensure the current feature has been `verified` (`npm run openspec check-coverage`).
   - Ensure lessons have been extracted (`@extract-lessons`).
   - Ensure the spec has been archived (`@archive-openspec`).
   - _Do not ship active `openspec/changes/` directories unless they are explicitly meant to be reviewed as in-progress PRs._

2. **Pre-flight Validation (Shift-Left Testing):**
   - Run linter and type-checker: `npm run lint` and `npx tsc --noEmit`.
   - Run unit tests globally to ensure no regressions: `npx vitest run --coverage`.
   - Verify `AGENTS.md` rules are followed (e.g., no hardcoded secrets, correct use of `isImpersonated` tokens, no floating promises, no generic spinners).

3. **Review Diff & Architectural Density:**
   - Run `git fetch origin main` and `git diff origin/main...HEAD`.
   - Prioritize correctness, security, and regressions. Ensure all testing constraints are met (e.g., Playwright SSE mocking, RTL+MSW, Firebase Emulators).

4. **Commit & Push:**
   - Commit selective files with an **architecturally dense commit message**.
   - _NicheAI requires dense commits to ensure `ai-eval` parity via CI/CD exemptions. Avoid generic messages like "fix bug". Include the mechanical 'why'._

5. **Open Pull Request (CI/CD Integration):**
   - Push branch and open or update a PR.
   - Advise the user that pushing the PR will trigger two critical pipelines:
     - `ci.yml`: Runs standard unit tests and Playwright E2E Tests (Matrix Sharded).
     - `stochastic-eval.yml`: Runs the non-deterministic `measureVariance` statistical runners and the `gemini-3.1-pro` Pairwise Judge for pre-merge LLM evaluation gating.

## Suggested Checks

```bash
npm run lint
npx tsc --noEmit
npx vitest run --coverage
git fetch origin main
git diff origin/main...HEAD
git status
```

## Guardrails

- **No OpenSpec Leakage:** Ensure `.tmp` staging directories and `.openspec-gemini-embeddings.json` are ignored or cleaned up.
- **Architectural Density:** Commit messages MUST explain trade-offs and architectural shifts, not just what was changed.
- **Test Mandates:** Ensure new code has >=80% coverage and uses RTL+MSW / Playwright.
- If pre-commit checks fail, fix the underlying code rather than bypassing hooks (`--no-verify`).

## Output

- Findings summary (OpenSpec status, Lint/Type/Test results)
- Architecturally dense commit message proposed or applied
- Expected CI/CD triggers (Standard CI + Stochastic Eval)
- PR URL (if created via CLI)
