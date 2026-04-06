# Plan: Codebase-wide Button & Intent Triage

## Why

A codebase scan revealed ~150 `<button>` elements that either lack `onClick` handlers or are seemingly "dead". However, treating this as a simple UI bug is a trap. From a product perspective, keeping 150 "Coming Soon" buttons creates a sprawling, unfinished dashboard (a "tarpit") rather than a focused, opinionated tool. Technically, many of these buttons might be implicit form submits, Radix UI triggers that require `forwardRef`, or styling escape hatches.

We must apply **binary triage** to ruthlessly prune unvalidated features, unify our button abstractions with proper ARIA and Radix compatibility, and ensure robust intent-based testing for the remaining critical path.

## What Changes

1. **Strategic Pruning ("Binary Triage"):**
   - We will NOT wire up 150 buttons. Any button leading to a feature outside the core Minimum Lovable Product (MLP) will be **deleted entirely**.
   - "Coming Soon" states will be eliminated unless they are explicit Product Qualified Lead (PQL) gates (the "Teaser" PLG approach with a padlock icon), which measure actual user demand before building.
   - **Triage Matrix:**
     - **Bucket 1: Core MVP (Test Rigorously)** - e.g., "Run Validation Arena", "Generate Insight".
     - **Bucket 2: PQL Gates (Test the Capture Intent)** - e.g., "Export Data", "Save Workspace".
     - **Bucket 3: Vaporware & Bloat (Delete, Don't Test)** - Minor UI filters, settings, unvalidated dashboard elements.

2. **Unified `<Button>` Abstraction:**
   - Evolve the existing `AsyncButton` into a universal `Button` component that supports visual variants (primary, secondary, ghost) using standard Tailwind classes.
   - **Crucial Fix:** Wrap the component in `React.forwardRef` to ensure it works flawlessly as a Radix UI `asChild` trigger (tooltips, modals, etc.).
   - Default to `type="button"` to prevent accidental form submissions.
   - Internalize promise resolution so that returning a Promise from `onClick` automatically triggers the loading state (removing boilerplate).

3. **Complete Interaction State Loop:**
   - Define exact design behaviors for Default → Loading (maintain width, show spinner, disable pointer) → Success/Error (revert state, show toast notifications for errors) → Disabled (`aria-disabled="true"` for screen reader compliance instead of dropping from tab order).

4. **Intent-Based Testing Strategy (MSW / RTL):**
   - Test the `Button` primitive exhaustively once in its own suite.
   - For all other components, ban brittle DOM queries (`.querySelector`). Use semantic queries (`screen.getByRole("button", { name: /Submit/i })`).
   - **Strict Server Validation:** MSW handlers will validate the exact intent payload and return 400 errors if wrong, instead of spying on the request.
   - **Semantic State Assertions:** Tests will assert `toBeDisabled()` and `toHaveAttribute('aria-busy', 'true')` rather than checking for spinner CSS classes.
   - Assert the _side effect_ (MSW endpoint called exactly once) rather than the presence of a spinner. Test double-click concurrency to prevent race conditions.

## Capabilities

### Modified Capabilities

- **Core Interactions:** All exposed buttons will function flawlessly. Unimplemented workflows will be hidden, reducing cognitive load and improving perceived stability.
- **Robust Asynchronous UI:** Users will experience seamless feedback (spinners, locked states, success/error handling) without layout shifts or "dead" clicks.
- **Architectural Resilience:** Radix UI components (Dropdowns, Dialogs) will no longer fail silently due to missing refs on custom buttons.

## Impact

- **Modules Affected:** Broad sweep across `src/components/` (e.g., `PivotSimulator`, `ToolboxEngine`, `FounderWorkspace`, `EnterpriseWorkspace`, and Radix UI implementations).
- **UX/UI:** Significant improvement in user trust through a focused, fully functional interface without vaporware buttons.
- **Engineering:** Elimination of brittle tests and introduction of a unified, highly reliable component system.

## Future Potential & Wow Features

- **Global PQL Telemetry:** The "Teaser" locked buttons can be wired to PostHog, automatically generating a dashboard of which unbuilt features users try to click the most, directly prioritizing the product roadmap based on intent.
- **Architectural / Design To-Do:** Implement an AST-based ESLint rule (`no-restricted-syntax`) to globally ban the use of raw `<button>` HTML elements in favor of the unified `<Button>` component.

## Tasks

### 1. The Core Abstraction

- [ ] 1.1 **Test:** Write exhaustive unit tests for `Button.test.tsx` verifying `forwardRef` attachment, `aria-disabled` injection, and automatic `isPending` state when `onClick` returns a Promise.
- [ ] 1.2 **Implement:** Create `src/components/ui/Button.tsx` (evolving `AsyncButton`) with variants and `forwardRef`.

### 2. Triage & Migration

- [ ] 2.1 **Triage:** Audit the ~150 raw `<button>` elements. Delete buttons for unvalidated/non-MVP features (Bucket 3).
- [ ] 2.2 **Migrate:** Convert remaining active raw buttons to `<Button>`, taking care to preserve `type="submit"` where implicitly used in forms, and ensuring Radix triggers map correctly.
- [ ] 2.3 **Implement:** For strategic PQL gates (Bucket 2), apply the "Teaser" pattern (padlock icon + `onClick` modal capture) instead of generic gray disabled states.

### 3. Deepened Intent-Based Testing

- [ ] 3.1 **Test:** Create MSW validation intent tests for Core MVP actions (Bucket 1). Enforce strict payload contracts at the network boundary.
- [ ] 3.2 **Test:** Create PQL Gate interception tests (Bucket 2). Ensure unauthenticated clicks reliably trigger the `<AuthModal>` or `<PQLGateModal>` and cache state.
- [ ] 3.3 **Test:** Add double-click concurrency tests to ensure the new `Button` correctly debounces/prevents multiple submissions, verifying MSW is only hit once.
- [ ] 3.4 **Refactor:** Remove any tests that rely on `.spinner` classes or `.querySelector`, moving them to semantic ARIA assertions.

### 4. Validation

- [ ] 4.1 Run full CI test suite and verify no regressions in Radix UI modals or Forms. Validate local test coverage is >80%.
