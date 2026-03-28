---
name: create-openspec
description: Scaffolds a new OpenSpec feature directory. Use when the user asks to plan a new feature, create an OpenSpec, or scaffold a feature spec.
---

# Create OpenSpec Workflow

This project uses the `openspec` standard to plan, design, and manage features. The standard mandates a specific directory structure with markdown templates under `openspec/changes/<feature-name>/`.

## Quick Start

When asked to create a new OpenSpec or plan a feature:

1. Ask the user for the feature name and a brief description if not already provided.
2. Determine a short `feature-name` (kebab-case) for the directory.
3. Use the Write tool to create the directory structure: `openspec/changes/<feature-name>/` and `openspec/changes/<feature-name>/specs/<feature-name>/`.
4. Generate the 5 files below, filling in placeholders logically based on the user's description.

### 1. `.openspec.yaml`

This file is placed at `openspec/changes/<feature-name>/.openspec.yaml`

```yaml
schema: spec-driven
created: YYYY-MM-DD
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
