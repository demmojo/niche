# Design

## Context

The transition to a guided onboarding flow introduced critical new paths that required rigorous testing. To ensure stability, high-coverage intent-based tests were added. This design document captures the architectural decisions regarding our testing strategy to serve as a reference point for future development.

## Goals

- Formalize the testing architecture for the Guided Onboarding transition.
- Document specific mocking strategies used across the application (Firebase, browser APIs).
- Record Vitest configuration updates required for >95% coverage tracking.

## Non-Goals

- Modifying existing application feature code.
- Refactoring tests that already meet the >95% coverage threshold.

## Decisions

- **Intent-Based Testing:** Tests are structured around user intent rather than implementation details (e.g., using accessibility roles instead of DOM class names).
- **Mocking Infrastructure:** Standardized structural mocks for Firebase, React Hooks, and `window.location` were created to ensure isolated, reliable test environments.
- **Vitest Coverage:** Set a strict >95% coverage threshold on newly developed flows to guarantee maximum reliability.

## Risks & Trade-offs

- **Maintenance Overhead:** High coverage requirements and extensive mocks require ongoing maintenance as dependencies (like Radix UI) evolve.
- **Retroactive Documentation:** There is a minor risk of divergence between what was originally built and what is documented retroactively, which is mitigated by directly verifying configurations against this spec.

## Future Potential

These documented patterns will serve as the foundation for automated AI evaluations of test suite health and will be directly integrated into our CI/CD pipeline enforcement.
