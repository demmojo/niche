## Why

The recent implementation of the `VisualWhiteboard` and related features significantly reduced the global function test coverage (currently <70%). We need to bring this back up to the >80% threshold required by our CI/CD pipelines and quality standards.

## What Changes

We are introducing a comprehensive suite of unit tests for the visual knowledge store, the new whiteboard UI components (CustomCardNode, MindmapAIChat), and several missing utility modals (GuidedTour, InviteMember, RequestAccess) to elevate coverage.

## Capabilities

### New Capabilities

- `test-suite-expansion`: Comprehensive tests covering recently added and historically uncovered components.

### Modified Capabilities

- `test-coverage`: Improving coverage metrics (Statements, Branches, Functions, Lines) above the 80% mark.

## Impact

This change will strictly involve adding files to the `src/__tests__/` directory. No application source code will be functionally modified, though some components may require minor testability tweaks.
