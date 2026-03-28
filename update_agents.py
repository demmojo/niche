import re

with open('/home/demmojo/Code/nicheai/AGENTS.md', 'r') as f:
    content = f.read()

# Replace the 3 OpenSpec bullets in Workspace Facts with 2 updated bullets
old_bullets = """- **OpenSpec Lifecycle**: Strictly manage files under `openspec/` (`plans/`, `brainstorms/`, `changes/`), routing legacy `docs/` paths via `ingest.ts`. Unimplemented features are 5-file directories under `openspec/changes/`, tracked via `- [ ]` in `tasks.md`. Archive raw plans and specs properly post-implementation.
- **OpenSpec Validation**: The `ai-eval` step is strictly blocking. The `check-ready` script validates against a local SQLite DB, requiring a spec to pass evaluation before implementation. Collision detection fail-fasts before scaffolding.
- **OpenSpec Execution**: Strictly respect task execution order when applying OpenSpecs to prevent dependency failures, and validate task logic using tests before implementation."""

new_bullets = """- **OpenSpec Lifecycle & Validation**: Strictly manage files under `openspec/`, routing legacy `docs/` via `ingest.ts`. `ai-eval` is blocking (validates against SQLite DB), and collision detection fail-fasts. Ensure rollback mechanisms for DAG validation failures and finite retry loops for `ai-eval` auto-fixes.
- **OpenSpec Execution & Agent UX**: Respect task execution order and validate via tests before implementation. CLI tools must be JSON-native and idempotent for agents, utilizing macro-commands (`propose`/`start`) and GraphRAG for context. Automate "Halt and Update" by requiring agents to show a markdown diff before resuming."""

if old_bullets in content:
    content = content.replace(old_bullets, new_bullets)
    with open('/home/demmojo/Code/nicheai/AGENTS.md', 'w') as f:
        f.write(content)
    print("Updated AGENTS.md")
else:
    print("Could not find old bullets to replace.")
