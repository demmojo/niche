# Guided Onboarding Transition

This specification outlines the structural changes to the onboarding flow to provide a seamless, FOUS-free transition into the FounderWorkspace for authenticated users, including an atomic backward-compatible migration path and pre-login session hydration.

## Features

### 1. Marketing Shell Bypass

- Requirement: The application (`WorkspaceShell`) must intercept authenticated users at the root or marketing routes and immediately render the authenticated app shell, bypassing any full-screen marketing copy.

### 2. Explicit State Machine & Instant Outer Shell (No FOUS)

- Requirement: Firestore data fetching hooks (e.g., `FounderProvider`) must expose an `isInitialized` boolean that is false initially and true only after the first successful resolution of data.
- Requirement: The UI must defer rendering the _core inner workspace content_ until `isProductsInitialized` is true AND `profileLoading` is false, but the _outer app shell_ (sidebar, header) must render immediately.

### 3. Dedicated OnboardingWizard (Not ZeroFrictionEntry)

- Requirement: FounderWorkspace must conditionally render an `OnboardingWizard` (or empty state) within its own layout if the user has not completed onboarding. It MUST NOT embed the full-screen marketing `ZeroFrictionEntry` for returning authenticated users.
- Requirement: The dashboard routing logic must depend on the `products` array length instead of the brittle `myProductData.name` check.

### 4. Pre-Login Session Hydration (Reverse Demo Hook)

- Requirement: The `OnboardingWizard` must attempt to read `zf_form_data` from `sessionStorage` (which may have been populated by `ZeroFrictionEntry` on the marketing page). If data exists, the wizard should pre-fill its form fields so the user does not have to re-enter their idea after authenticating.

### 5. Atomic Legacy Data Migration

- Requirement: During initialization in `FounderProvider`, if a user has existing `my_product_data_` but their `products` collection is empty, the system must automatically create a new entry in the `products` collection using the legacy data.
- Requirement: This migration MUST use a Firestore `writeBatch` to ensure atomic creation of the new product, duplication of the app data to the new product key, and deletion/clearing of the legacy key, to avoid partial migration states.

## Scenarios

Note: Every scenario MUST map 1:1 to an intent-based test using RTL/MSW/Firebase Emulator.

- WHEN an authenticated user visits the marketing root URL THEN they are immediately redirected to the workspace without seeing the marketing UI.
- WHEN the FounderWorkspace mounts and Firestore data is still fetching THEN the UI displays an intentional loading state for the inner content (no FOUS) because `isInitialized` is false.
- WHEN an authenticated user with no products enters the workspace THEN the FounderWorkspace natively renders the OnboardingWizard component, NOT the marketing ZeroFrictionEntry.
- WHEN a user types an idea into the marketing page, logs in, and lands in the OnboardingWizard THEN the wizard's inputs are pre-filled with the data from the marketing page via sessionStorage.
- WHEN an authenticated legacy user enters the workspace with existing `my_product_data_` but an empty `products` collection THEN their legacy data is atomically migrated to the `products` collection via a `writeBatch` and they bypass the OnboardingWizard.
