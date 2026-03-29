# Update Coverage Threshold to 80%

Our `CONTRIBUTING.md` specifies a "Testing Trophy strategy with >80% coverage enforced on new code." However, our automated check-coverage scripts and skills are currently enforcing a 90% threshold, causing friction when verifying changes.

This plan updates the enforced coverage threshold across the repository to be 80%.

## Target Files to Update

1. `**.cursor/skills/verify-openspec/SKILL.md**`: Update the hardcoded `check-coverage` command example and documentation to expect `80%`.
2. `**CONTRIBUTING.md**`: Update the "8-Step Lifecycle" verification step to reference an `80` threshold.
3. `**.cursor/rules/openspec-workflow.mdc**`: Update the `check-coverage` command example and the Archiving block requirement to `80%`.

## Implementation Steps

1. **Update `verify-openspec` Skill:**
  - Change `npm run openspec check-coverage <feature-name> --threshold=90 --non-interactive --json` to `--threshold=80`.
    - Change mentions of "90-100%" to ">80%".
2. **Update `CONTRIBUTING.md`:**
  - Change `npm run openspec check-coverage <feature-name> --threshold=90` to `--threshold=80`.
3. **Update `openspec-workflow.mdc`:**
  - Change `--threshold=90` to `--threshold=80`.
    - Update the archive unblocking requirement from `>= 90%` to `>= 80%`.