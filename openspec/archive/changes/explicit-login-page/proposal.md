> **NOTICE:** This spec has been **superseded** by unified-auth-modal.

## Why

Currently, users who click the "Log in" link on the `ZeroFrictionEntry` page (or navigate directly to `/login`) are not provided with a standard login interface. Because NicheAI uses an anonymous-first PLG (Product-Led Growth) flow, returning users are inadvertently trapped in the default onboarding flow.

From a product strategy perspective, we must distinguish between two user intents:

1. **Claim Account (Signup):** The user generated value anonymously and wants to save it by attaching an identity.
2. **Explicit Login:** The user already has an established account and wants to abandon their current anonymous session to access their existing data.

This spec addresses the **Explicit Login** intent.

## What Changes

- Introduce a dedicated, minimalist `LoginScreen` component.
- Update top-level routing in `src/App.tsx` to explicitly intercept `/login` and render the `LoginScreen`.
- Implement robust Firebase Authentication for returning users (Google Auth, Email/Password), adhering to NicheAI's strict resilience and error-handling mandates.

## Capabilities

### New Capabilities

- `explicit-login-ui`: A dedicated screen for returning users to authenticate, featuring clear error states and loading indicators.
- `login-routing`: Top-level router support for the `/login` path, bypassing heavy workspace initialization.

### Modified Capabilities

- `app-bootstrap`: Modified `App.tsx` to handle the `/login` route bypass before initializing the standard `WorkspaceProvider`.
