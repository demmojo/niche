# Design

## Context
The repository has a discrepancy between the intended 80% coverage rule (in `CONTRIBUTING.md`) and the 90% enforcement in `.cursor` rules and skills.

## Goals/Non-Goals
- **Goals**: Align automated tools, skills, and documentation with the 80% rule.
- **Non-Goals**: Modifying the underlying test runner logic or testing framework.

## Decisions
We will do a direct replacement of hardcoded `90` threshold values to `80` in the specified target files to resolve the friction immediately.

## Risks/Trade-offs
- Technically lowers the enforced bar, but it matches the intended bar defined in the testing strategy.

## Future Potential
Centralize the threshold configuration to a single source of truth (e.g., `openspec.config.json`) instead of hardcoding in multiple markdown files.