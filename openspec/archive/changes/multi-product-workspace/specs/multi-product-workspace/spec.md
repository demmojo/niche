# Multi-Product Workspace

This specification defines the behavior for users managing multiple product ideas within NicheAI, and the structural safety mechanisms for switching between them.

## Features

### 1. Workspace Provider & Context

- **Requirement:** The application must wrap authenticated routes in split React 19 Contexts (`WorkspaceStateContext` and `WorkspaceDispatchContext`) exposing `activeProductId`, `products`, and `isLoading`.

### 2. Superadmin Bootstrapping

- **Requirement:** If the user has superadmin claims (verified via Firebase Custom Claims, NOT frontend email string matching), the system should automatically provision the default `prod-kageform` product if no products exist.

### 3. Onboarding Interception

- **Requirement:** If a standard user has no products, they must be intercepted by the `OnboardingWizard` before accessing the main application.

### 4. Data Fetching & Security

- **Requirement:** All network requests relying on `activeProductId` must bind to an `AbortSignal` to cancel in-flight requests on workspace switch. Backend calls must verify tenant ownership to prevent IDOR.

## Scenarios

- **WHEN** a newly registered user logs into the application and has no products
- **THEN** they are rendered the `OnboardingWizard` and cannot access the main dashboard.

- **WHEN** a user selects a different product from the global workspace switcher
- **THEN** the `activeProductId` in the `WorkspaceProvider` updates, pending fetches are aborted via `AbortController`, and the active application tree safely re-renders for the new product.

- **WHEN** a superadmin (verified via custom claims) logs in and has no products
- **THEN** the `useSuperadminBootstrap` hook automatically provisions the `prod-kageform` workspace without requiring the onboarding wizard.
