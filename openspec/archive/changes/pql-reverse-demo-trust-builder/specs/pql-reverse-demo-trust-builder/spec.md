# Specification

## Feature: Trust Builder Loading Screen

**Scenario**: User submits an idea for validation.

- **WHEN** the validation process starts
- **THEN** the UI transitions to the `TrustBuilderScreen`
- **AND** progressively displays streamed market data (e.g., competitors found, initial tarpit score)
- **AND** smoothly expands step UI using Motion layout animations.

## Feature: Niche Preservation Override

**Scenario**: User inputs a hyper-niche idea near a tarpit.

- **WHEN** the `tarpitAnalyzer` evaluates the idea
- **AND** the Orthogonal Vector Distance exceeds the required uniqueness threshold
- **THEN** the system triggers a System Override
- **AND** bypasses the auto-pivot, keeping the user's original idea intact.

## Feature: Reverse Demo PQL Gate

**Scenario**: Validation completes and the user must authenticate to view full results.

- **WHEN** the `PQLGateModal` is invoked
- **THEN** the background displays the generated idea dashboard behind a heavily blurred/gradient overlay
- **AND** the CTA displays possessive microcopy (Save Your Analysis) highlighting the loss of the generated data if the user does not authenticate.
