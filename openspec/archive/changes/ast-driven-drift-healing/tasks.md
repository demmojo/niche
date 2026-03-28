# Tasks: AST-Driven Pre-Commit Drift Healing

## Phase 1: Stateless AST Scanner Foundation

- [ ] Install `ts-morph` as a development dependency.
- [ ] Create `scripts/openspec-cli/ast-scanner.ts`.
- [ ] Implement in-memory VFS logic using `git diff --cached` and `git show HEAD:file`.
- [ ] Configure `ts-morph` with `isolatedModules: true` to bypass deep type-checking.
- [ ] Implement Semantic Signature extraction logic (exported functions, props, dependencies, state hooks) to output a concise summary.
- [ ] Ensure the script runs entirely in-memory with sub-100ms execution.

## Phase 2: Refactor `drift.ts` to Pre-Commit Auto-Heal

- [ ] Refactor `scripts/openspec-cli/drift.ts` to consume the AST-generated Semantic Signature instead of raw git diffs.
- [ ] Update LLM prompts (Gemini 1.5 Flash) to generate surgical markdown patches for `spec.md` based on semantic changes.
- [ ] Implement logic to automatically apply markdown patches and run `git add <patched-files>`.
- [ ] Implement logic to append detected workarounds to `tasks.md` or `docs/brainstorms/tech-debt.md`.
- [ ] Enforce a strict 3000ms timeout on the LLM request, failing open (`exit 0`) if triggered.

## Phase 3: Workflow Integration & Triage Surface

- [ ] Update `lefthook.yml` to trigger the synchronous `drift.ts` auto-heal workflow on `pre-commit` (and remove old `pre-push` logic).
- [ ] Ensure no stateful lockfiles (`.openspec/ast-snapshot.lock.json`) are written or committed.
- [ ] Update `generate-docs.ts` to compile tasks from `tech-debt.md` and display them in a "Sprint Insights & Drift Triage" section of the root project `README.md`.
- [ ] (Experimental) Configure prompt guidelines for Change Budget Auditing / Scope Creep detection.
