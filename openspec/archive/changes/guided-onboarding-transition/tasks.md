## Tasks

### Legacy Data Migration (Atomic)

- [x] Test: Write an integration test for FounderProvider to ensure legacy data is migrated correctly using `writeBatch`.
- [x] Implement: Add `useEffect` to `FounderProvider.tsx` that triggers if `isProductsInitialized` is true but `products.length === 0`.
- [x] Implement: Fetch legacy `my_product_data_`. If present, use `writeBatch` to create a product, set the new data key, and delete the legacy data key.

### Dedicated OnboardingWizard (Embedded)

- [x] Test: Write a unit test for OnboardingWizard that checks hydration from `sessionStorage` (`zf_form_data`).
- [x] Implement: Extract the onboarding state gathering steps from `ZeroFrictionEntry` into a new `OnboardingWizard` component.
- [x] Implement: Add `sessionStorage` hydration logic to the initial state of the `OnboardingWizard` form.
- [x] Implement: Update `FounderWorkspace.tsx` to conditionally render `OnboardingWizard` when `products.length === 0`, ensuring the outer sidebar/header is visible while the inner content shows the wizard or a loader.

### Explicit Routing & Shell Bypass

- [x] Test: Update `App.test.tsx` and `WorkspaceShell.test.tsx` to ensure `ZeroFrictionEntry` is only shown for unauthenticated users.
- [x] Implement: Update `WorkspaceShell.tsx` to check `profileLoading`. If `profileLoading` is true, render a loader instead of jumping to `ZeroFrictionEntry`.
- [x] Implement: Update `WorkspaceShell.tsx` to immediately render the `FounderWorkspace` (or other workspace) if the user is authenticated, passing them through to the inner routing logic.
- [x] Test: Validate global coverage reaches 80% with updated test suites for the newly refactored components.
