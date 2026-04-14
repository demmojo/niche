# Tasks: Hybrid AI Workflow Upgrade

## Phase 1: Local Checkpoint Mechanics

- [ ] Create CLI command `openspec checkpoint` containing the soft-wrap `git add` and `git commit` logic.
- [ ] Create CLI command `openspec undo` with strict `git reset` and `git clean` sequence.
- [ ] Implement error handling if git tree is dirty and resolve conflict behavior for checkpoints.

## Phase 2: Remote CI/CD Evaluation (`ai-eval`)

- [ ] Scaffold `npm run openspec ai-eval` script.
- [ ] Implement Blast-Radius scoping calculation via `git diff HEAD^1 HEAD --name-only`.
- [ ] Integrate the `gemini-3.1-pro` API for the automated `evaluatePairwise` judge.
- [ ] Configure evaluator execution logic to be entirely stateless (disable or strip any caching layer).
- [ ] Wire evaluator to exit with code `1` (fail-fast) upon detecting semantic specification drift.

## Phase 3: Workflow Boundaries and Policy

- [ ] Add `.github/CODEOWNERS` entry assigning lead human reviewers to `openspec/`.
- [ ] Inject the "Halt & Update" escape hatch logic into the standard AI agent system prompts.
- [ ] Add GitHub Actions YAML job to trigger `ai-eval` automatically on PR creation/update.
