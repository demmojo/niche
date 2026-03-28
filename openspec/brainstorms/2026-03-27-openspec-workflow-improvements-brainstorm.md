# Brainstorm: OpenSpec Workflow & Dev UX Improvements

## What We're Building

A robust, frictionless, and strictly enforced OpenSpec Command Line Interface (CLI) that leverages AI to handle the administrative burden of the "Halt and Update" pattern. We are addressing critical architectural bugs (such as `ai-eval` ignoring `spec.md`), streamlining fragmented commands into logical macro-commands (`propose`, `start`), and ensuring that feature collisions and implementation ambiguity are blocked _before_ they poison the dependency graph.

## Why This Approach

The current OpenSpec workflow successfully prevents LLM context bloat and divergence, but it leaks complexity to the developer. The "Halt and Update" protocol forces developers to manually rewrite markdown constraints mid-flight, which breaks their flow state. Furthermore, the existing workflow contains critical bypass bugs: `check-ready` allows developers to implement specs that failed semantic validation, and `detect-collisions` runs _after_ duplicated specs are already written to disk.

By abstracting the mechanics into intelligent, AI-driven CLI commands, we maintain strict architectural compliance (the DAG remains acyclic, specs are thoroughly evaluated) while offloading the markdown maintenance entirely to the AI.

## Key Decisions

1. **Strict `ai-eval` Blocking:** `check-ready` will now query the SQLite database for a passing `ai-eval` record. If a spec failed its semantic evaluation (or hasn't been evaluated), `check-ready` will strictly block implementation.
2. **Complete Semantic Validation:** `ai-eval`'s `getSpecContent` function will be updated to include the actual `specs/<feature-name>/spec.md` file, ensuring the LLM-as-a-judge evaluates the behavioral scenarios alongside the proposal and design.
3. **Fail-Fast Collision Detection:** The `ingest` command will be refactored to generate the JSON artifacts in-memory and run `checkCollisions` _before_ scaffolding the directory structure or archiving the plan. If similarity exceeds the threshold (> 85%), ingestion aborts.
4. **The "Meta-CLI" UX Pattern:** We will consolidate the fragmented commands into macro-operations:
   - `openspec propose <plan.md>`: In-memory collision check -> Scaffold files -> Validate DAG -> Run `ai-eval`.
   - `openspec start <feature>`: Run strict `check-ready` -> `build-context`.
5. **Proactive AI "Halt and Update":** When the AI agent hits a technical constraint mid-implementation, it is programmed to automatically pause coding, prompt the developer about the roadblock, and rewrite `design.md` and `tasks.md` for them. The developer doesn't need to manually run an `openspec pivot` command; the agent acts as the orchestrator.
6. **Interactive `ai-eval` Auto-Fix:** If a draft spec fails `ai-eval`, the CLI will not just log the feedback and exit. Instead, it will prompt the developer: "Would you like me to rewrite the spec to address these issues?" and automatically apply the AI's structural fixes.
7. **Semantic Collision Resolution:** During `openspec propose` (ingestion), if a collision > 85% is detected, the CLI will use the LLM to provide a high-level explanation of the differences between the two specs. It will then offer an interactive prompt:
   - Option A: Supersede the older spec.
   - Option B: Merge the new tasks into the existing spec.
   - Option C: Custom instructions (allow the developer to type exactly how they want the collision resolved).

## Open Questions

None. All major architectural flaws and UX friction points have been addressed and decided upon during the brainstorm dialogue.
