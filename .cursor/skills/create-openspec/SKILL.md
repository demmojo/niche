---
name: create-openspec
description: Scaffolds a new OpenSpec feature directory. Use when the user asks to plan a new feature, create an OpenSpec, or scaffold a feature spec.
---

# Create OpenSpec Workflow

This project uses the `openspec` standard to plan, design, and manage features. The standard mandates a specific directory structure with markdown templates under `openspec/changes/<feature-name>/`.

## Quick Start

When asked to create a new OpenSpec or plan a feature:

1. **Pre-requisite Review:** You MUST use the `Shell` or `Read` tools to review all existing specs in `openspec/changes/` and `openspec/archive/`. Check for overlaps, conflicts, or if the proposed feature alters an existing implemented/unimplemented spec.
   - If there is an overlap, ask the user if the new spec should _supersede_ the old one, or if they should be merged.
   - If superseding, update the old spec's `.openspec.yaml` to include `status: superseded` and `superseded_by: <new-feature-name>`, and add a warning to the top of its `proposal.md`.
2. **Ingestion Pipeline Shortcut:** If the user provides an existing plan document (e.g., from `docs/plans/`), you **MUST NOT** scaffold the files manually. Instead, you MUST use the ingestion pipeline by running `npx tsx scripts/openspec-cli/index.ts ingest <path-to-plan.md>`. This will automatically parse the plan, generate the OpenSpec artifacts, check for collisions, and archive the original plan. You can skip steps 3-6 if you do this.
3. **Future Extractor Mandate:** While creating plans or specs, at the end make sure to populate "Future Considerations" or potential "Architectural, Design and Future Potential To Dos". This feeds the living roadmap document.
4. Ask the user for the feature name and a brief description if not already provided.
5. Determine a short `feature-name` (kebab-case) for the directory.
6. Use the Write tool to create the directory structure: `openspec/changes/<feature-name>/` and `openspec/changes/<feature-name>/specs/<feature-name>/`.
7. Generate the 5 files below, filling in placeholders logically based on the user's description.

### 1. `.openspec.yaml`

This file is placed at `openspec/changes/<feature-name>/.openspec.yaml`

```yaml
schema: spec-driven
status: draft # Options: draft, active, implemented, superseded, archived
created: YYYY-MM-DD
# superseded_by: [other-feature-name] (if applicable)
```

### 2. `proposal.md`

This file is placed at `openspec/changes/<feature-name>/proposal.md`

```markdown
## Why

[Explain the problem or opportunity based on user input]

## What Changes

[High-level summary of what is being introduced or modified]

## Capabilities

### New Capabilities

- `capability-name`: [Description]

### Modified Capabilities

- `capability-name`: [Description]

## Impact

[What systems, modules, or areas of the codebase are affected]
```

### 3. `design.md`

This file is placed at `openspec/changes/<feature-name>/design.md`

```markdown
## Context

[Background information necessary to understand the design choices]

## Goals / Non-Goals

**Goals:**

- [Goal 1]

**Non-Goals:**

- [Non-Goal 1]

## Decisions

**1. [Decision Title]**

- **Decision**: [What was decided]
- **Rationale**: [Why it was decided]
- **Alternatives Considered**:
  - _[Alternative 1]_: [Why it was rejected (e.g., too complex, performance hit)]
  - _[Alternative 2]_: [Why it was rejected]

## Risks / Trade-offs

- **Risk: [Risk Name]** -> [Description]
- **Mitigation**: [How to mitigate]

## Future Potential & Wow Features

**CRITICAL:** You must populate this section based on your analysis of the specs, technical debt taken, or "Non-Goals". This section is automatically extracted by the CI/CD pipeline (`roadmap-extractor.ts`) to populate the living `docs/ROADMAP.md` document used by the team to strategize and create new product features.

- **[Feature Name]**: [Transform a technical compromise or deferred item into a visionary, user-facing "wow" capability.]
- **Architectural / Design To-Do**: [Any future architectural refactors or design explorations needed to support maturity.]
```

### 4. `spec.md`

This file is placed at `openspec/changes/<feature-name>/specs/<feature-name>/spec.md`

```markdown
# [Feature Name]

[Detailed feature specification, user flows, and requirements]

## Features

### 1. [Feature Component]

- **Requirement:** [Detailed technical/product requirement]

## Scenarios

- **WHEN** [condition or user action]
- **THEN** [expected system outcome]
```

### 5. `tasks.md`

This file is placed at `openspec/changes/<feature-name>/tasks.md`

Break down the implementation into logical phases and actionable steps.

```markdown
## 1. [Phase 1: E.g., Backend / Data Model]

- [ ] 1.1 [Task description]
- [ ] 1.2 [Task description]

## 2. [Phase 2: E.g., Frontend / UI Integration]

- [ ] 2.1 [Task description]
```

## Post-Creation

After generating the files:

1. Briefly present the scaffolded files and paths to the user.
2. Prompt the user to review the files and request edits or approval before beginning implementation (which will be driven by the `.cursor/rules/openspec-workflow.mdc` rule).
