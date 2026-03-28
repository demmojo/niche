# Performance Optimization Analysis: Comprehensive Documentation & Guides Plan

Based on the Performance Oracle framework, I have analyzed the proposed architecture in `docs/plans/2026-03-27-feat-comprehensive-documentation-and-guides-update-plan.md` and `openspec/changes/comprehensive-documentation/`.

While standardizing tooltips (for accessibility) and shifting to stateful progressive disclosure (for UX) are necessary, the shift from zero-JavaScript CSS tooltips to React-managed portaling—combined with new global state persistence—introduces significant performance bottlenecks at scale.

Here are the actionable enhancements and critical updates needed for the plan:

## 1. Critical Issues

### Issue 1: React Component & Context Overhead (Radix UI Tooltips)

- **Description:** Applying `@radix-ui/react-tooltip` individually to every interactable element (e.g., the hundreds of cells in `DataPointsTable` or `InsightEngineChat`) causes exponential growth in React Component instances and DOM event listeners.
- **Projected Impact:** A 500-row table with 3 tooltips per row will instantiate 1,500 `TooltipProvider` contexts, triggering massive memory bloat and blocking the main thread during render and scroll phases. Radix UI context recalculations can tank performance to < 30 FPS.
- **Recommended Solution:**
  - **MANDATORY:** Lift the Radix `<TooltipProvider>` out of the individual `<Tooltip>` component and place it at the root of the application (e.g., in `src/App.tsx`). The wrapper component should only contain `<Tooltip>`, `<TooltipTrigger>`, and `<TooltipContent>`.
  - **Singleton Delegation:** For large datasets like `DataPointsTable`, implement a delegated tooltip pattern where a single tooltip exists at the root and updates its content/position based on `onMouseOver` of elements with a `data-tooltip-id`.

### Issue 2: Synchronous LocalStorage Blocking (Zustand)

- **Description:** Moving from `useSyncExternalStore` (which currently reads from `localStorage`) to a global `useOnboardingStore` (via Zustand's `persist` middleware) introduces synchronous I/O blocking.
- **Projected Impact:** If the Zustand store persists ephemeral UI state (e.g., `currentStep: 'tour'`, `isModalActive: true`) to `localStorage` on every interaction, it forces continuous main-thread blocking JSON serialization. Furthermore, persisting active UI state could cause invalid states to restore on a fresh session.
- **Recommended Solution:**
  - Use Zustand's `partialize` configuration in the persist middleware to STRICTLY whitelist only boolean completion flags (e.g., `hasSeenDashboardTour: true`).
  - Never persist the active tour step or UI state flags.
  - Debounce the storage writes so it only fires when a tour is fully completed or explicitly dismissed.

## 2. Optimization Opportunities

### Opportunity 1: Lazy Evaluation of Tooltip Content

- **Current Implementation:** The existing custom `Tooltip` receives content via a prop (`content={<CustomTooltip />}`). React evaluates and instantiates this VDOM during the parent's render phase, even if the tooltip is never hovered.
- **Suggested Optimization:** Refactor `TooltipProps` to support a render function (`content: React.ReactNode | (() => React.ReactNode)`). Radix UI mounts portals lazily, but ensuring the _React elements_ are only created just-in-time prevents massive initial render payloads.
- **Expected Gain:** Significant reduction in memory heap and faster Time to Interactive (TTI).

### Opportunity 2: Deterministic Tour Initialization

- **Current Implementation:** The current `GuidedTour` logic relies on arbitrary timers (`setTimeout(..., 300)`) to wait for DOM nodes to settle before rendering.
- **Suggested Optimization:** Replace the timer with a `MutationObserver` or `useLayoutEffect` that precisely tracks when the target DOM nodes for the tour actually mount.
- **Expected Gain:** Eliminates layout thrashing and prevents the Tour from rendering pointing to empty space (if async data takes > 300ms).

## 3. Recommended Actions (Enhancements for the Plan)

**Please update `tasks.md` and `design.md` with the following explicit technical constraints:**

1. **Update Task 2.2:** _"Verify the `<Tooltip>` component utilizes `@radix-ui/react-tooltip`. CRITICAL: Ensure `<TooltipProvider>` is lifted to `App.tsx` and NOT duplicated inside the `<Tooltip>` wrapper to prevent O(n) context overhead."_
2. **Add Task 2.4:** _"Refactor `TooltipProps` to accept a render function (`() => ReactNode`) for complex content to enable lazy evaluation of React elements."_
3. **Update Task 4.1:** _"Create a global `useOnboardingStore`. Configure Zustand's `persist` middleware with `partialize` to strictly serialize only the `hasSeen_`boolean flags, explicitly omitting ephemeral UI state like`currentStep` to prevent synchronous I/O thrashing."\*
4. **Update Design Decision #1:** Add a trade-off note: _"While Radix solves accessibility and clipping, it introduces significant JS overhead compared to CSS tooltips. We mitigate this via a global TooltipProvider and lazy VDOM evaluation."_
