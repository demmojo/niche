# Tasks

## Phase 1: Rule & State Updates

- [x] Update `.cursor/rules/openspec-workflow.mdc` to define "Phase 2.5: Continual Learning & Extraction".
- [x] Modify the standard OpenSpec scaffolding to include `learnings_extracted: false` in `.openspec.yaml` by default.

## Phase 2: Create Continual Learning Skill

- [x] Create `.cursor/skills/extract-lessons/SKILL.md`.
- [x] Implement logic to execute and parse `git diff origin/master...HEAD`.
- [x] Implement friction heuristic scanning (test failures, loop detection).
- [x] Implement semantic search / grep step targeting `AGENTS.md` and `.cursor/rules/`.
- [x] Implement the prompt to output Human-in-the-Loop proposed additions/deletions.

## Phase 3: Modify Archival Logic

- [x] Update `archive-openspec` skill to read `.openspec.yaml`.
- [x] Add enforcement block: abort and run `extract-lessons` if `learnings_extracted` is not `true`.
- [x] Add step to flip `learnings_extracted` to `true` upon successful RLHF approval.

## Phase 4: Testing & Verification

- [x] Test the pipeline end-to-end with a dummy spec, ensuring lessons are extracted and duplicates are avoided.
- [x] Test the archive guardrail to confirm it blocks premature archival.
