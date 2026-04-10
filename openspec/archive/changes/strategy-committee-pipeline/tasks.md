# Tasks

## Phase 1: Infrastructure Setup

- [x] Create `.github/workflows/strategy-committee.yml` listening to `push` on `openspec/archive/**/*.md`.
- [x] Configure GitHub Actions concurrency group `strategy-committee-queue` with `cancel-in-progress: false`.
- [x] Configure `actions/create-github-app-token` for branch protection bypass auth (or trusted PAT).

## Phase 2: Orchestration Script & LLM Engine

- [x] Create `scripts/strategy-committee.ts`.
- [x] Implement `@google/genai` with Gemini 3.1 Pro setting `responseMimeType: "application/json"`.
- [x] Create strict Zod schemas for the strategy output and pass via `zodToJsonSchema`.
- [x] Build the 24-hour directory scan fallback logic to mitigate dropped GHA queue jobs.
- [x] Design and implement the multi-persona Socratic prompt targeting OpenSpec context.

## Phase 3: Coherence Drift Check (Map-Reduce)

- [x] **Map**: Implement logic to extract claims from `README.md` and active specs (ignoring archived/superseded).
- [x] **Scope**: Implement `git show --name-only <merge_commit_sha>` execution to isolate strictly modified files.
- [x] **Reduce**: Build the parallel Gemini verification calls comparing claims vs scoped code chunks.
- [x] Implement prompt constraints instructing Gemini to ignore omissions/TODOs and only flag strict contradictions.

## Phase 4: Output Injection & Git Sync

- [x] Add HTML anchor comments to `README.md` and `STRATEGY.md`.
- [x] Implement safe `string.replace` functionality restricted to the anchor zones.
- [x] Add auto-commit staging logic: `git add README.md STRATEGY.md`.
- [x] Add git commit executing as a bot containing the `[skip ci]` flag.
- [x] Implement pre-push sync via `git pull --rebase origin main` followed by the push execution.
