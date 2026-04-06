## Why

Currently, authenticated users encounter friction or a flash of uninitialized state (FOUS) upon entry. Furthermore, the marketing shell is unnecessarily displayed to users who have already authenticated, disrupting the seamless experience required for the product. There is a need for a smooth, guided onboarding transition that brings founders straight into the action without lag or redundant screens. Critically, we must not break the "Reverse Demo Hook" PLG strategy—if a user started typing an idea on the marketing page before logging in, that idea must carry over seamlessly into the application.

## What Changes

We are transitioning the onboarding flow to provide a seamless entry for authenticated founders. This includes bypassing the marketing shell, rendering the authenticated outer shell immediately to prevent FOUS, natively embedding an `OnboardingWizard` within the `FounderWorkspace`, hydrating the wizard with pre-login session data, and introducing an atomic backward-compatible migration strategy for legacy user data.

## Capabilities

### New Capabilities

- **authenticated-marketing-bypass**: Automatically redirects authenticated users away from the marketing shell directly into the core application.
- **fous-prevention**: Ensures the inner UI waits for an `isInitialized` flag from Firestore hooks before rendering, while the outer shell renders instantly to signal a successful login.
- **legacy-data-migration**: Automatically migrates users from the legacy `my_product_data_` structure to the `products` collection using an atomic Firestore `writeBatch`.
- **session-hydration**: The `OnboardingWizard` reads `sessionStorage` (`zf_form_data`) to pre-fill the form with any data the user provided on the marketing page before authenticating.

### Modified Capabilities

- **founder-workspace-entry**: Modifies `FounderWorkspace` to render an embedded `OnboardingWizard` component (instead of `ZeroFrictionEntry`) natively, streamlining the first steps.

## Impact

This will primarily impact the initial routing (`App.tsx`, `WorkspaceShell.tsx`), the `FounderWorkspace` UI, and Firestore data fetching hooks (`FounderProvider.tsx`). Legacy data migration will run atomically on startup for returning users. The PLG funnel will be strengthened by ensuring no data loss occurs when transitioning from anonymous marketing interaction to authenticated app usage.
