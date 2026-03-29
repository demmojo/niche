# Spec

## Features
1. **Verify OpenSpec Skill Update**: Modifies the `verify-openspec` skill to expect an 80% threshold.
2. **CONTRIBUTING.md Update**: Modifies the lifecycle instructions to use an 80% threshold.
3. **OpenSpec Workflow Rule Update**: Modifies the unblocking requirements for archiving features to 80%.

## Scenarios

### Scenario 1: verify-openspec skill execution
- **WHEN** the `verify-openspec` skill is invoked or read
- **THEN** it explicitly states `>80%` and uses `--threshold=80` in its check-coverage command.

### Scenario 2: Documentation reference
- **WHEN** a developer references the 8-Step Lifecycle in `CONTRIBUTING.md`
- **THEN** the example verification command uses `--threshold=80`.

### Scenario 3: Archiving a feature
- **WHEN** checking archiving requirements in `openspec-workflow.mdc`
- **THEN** the required coverage threshold to unblock archiving is `>= 80%`.