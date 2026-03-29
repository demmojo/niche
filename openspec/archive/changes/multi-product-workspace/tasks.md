## 1. Core Architecture & Context Setup

- [x] 1.1 **Test:** Write failing RTL tests for `WorkspaceProvider` (default state, Context updates, context splitting, and throwing error when used outside provider).
- [x] 1.2 **Implement:** Create `src/components/WorkspaceProvider.tsx` exporting the split contexts and `useWorkspace` / `useWorkspaceDispatch` hooks.

## 2. Superadmin & Onboarding Logic

- [x] 2.1 **Test:** Write failing RTL tests for `useSuperadminBootstrap` asserting it sets the default `prod-kageform` product ONLY when the user has valid Firebase Custom Claims (`token.claims.superadmin === true`).
- [x] 2.2 **Implement:** Create `src/components/useSuperadminBootstrap.ts` and abstract the hardcoded logic out of `App.tsx`.
- [x] 2.3 **Test:** Update `App.tsx` RTL tests to assert that a child component (e.g., `<WorkspaceRouter>`) correctly intercepts standard users with 0 products and shows the `<OnboardingWizard>`.
- [x] 2.4 **Implement:** Update `App.tsx` to render `<WorkspaceProvider>`, and create a child component to consume the context and conditionally render `<OnboardingWizard>` or the main app.

## 3. Security & Race Condition Mitigations

- [x] 3.1 **Test:** Write failing intent-based tests simulating a fast workspace switch while a fetch is in-flight (asserting the first fetch is aborted).
- [x] 3.2 **Implement:** Integrate `AbortController` inside data fetching hooks that depend on `activeProductId` and ensure cache keys are prefixed with the product ID.

## 4. Final Phase: Testing & Validation

- [x] 4.1 Verify targeted local coverage (`npm run test -- src/components/WorkspaceProvider.tsx src/components/useSuperadminBootstrap.ts --coverage`) meets the 90-100% threshold.
- [x] 4.2 Verify no regression in `App.tsx` rendering by ensuring existing `App.tsx` intent-based tests continue to pass.
