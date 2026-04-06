# Explicit Login Page

Introduce a dedicated UI and routing layer for explicit user authentication, bypassing the anonymous PLG flow.

## Features

### 1. Route Interception

- **Requirement:** `src/App.tsx` must inspect `window.location.pathname` and immediately render `LoginScreen` if it equals `/login`. It must not initialize the `WorkspaceProvider` or execute any anonymous bootstrapping during this state.

### 2. Login UI Component (`LoginScreen.tsx`)

- **Requirement:** A minimalist UI component that provides:
  - A single-purpose, focused layout (avoiding generic "SaaS card grid" anti-patterns).
  - A Google OAuth button with the standard Google logo or Lucide equivalent.
  - A form for Email and Password login.
  - Links to "Sign Up" or "Go Back".
  - **Data Loss Warning**: If accessed while in an active anonymous session, it must display a warning: "Logging in will switch accounts and may lose unsaved work. To save this work, use Sign Up instead."
  - **Explainable AI States:** Loading states must use descriptive text with `aria-live="polite"` (e.g., "Authenticating...", "Verifying credentials...") instead of generic, non-accessible spinners.
  - Inline error messages with clear, human-readable text (e.g., "Invalid password", "Network error") instead of raw Firebase error codes.

### 3. Authentication Logic & Resilience

- **Requirement:** Integrate with `firebase/auth`.
  - For Google: Execute `signInWithPopup(auth, googleProvider)`.
  - For Email/Password: Execute `signInWithEmailAndPassword(auth, email, password)`.
  - **Circuit Breaker:** All auth calls must be wrapped in a 5-second timeout (e.g., `Promise.race([authCall, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))])`) to prevent infinite UI hangs.
  - **Memory Leak Prevention:** All state setters (`setLoading`, `setError`) must be guarded by `isMounted.current` (using `useIsMounted()`).
  - **Conflict Resolution:** Handle the `auth/credential-already-in-use` specific case by extracting the credential and calling `signInWithCredential`. Follow with `auth.currentUser?.reload()`.
  - **Hard Redirection:** On success, force a clean mount via `window.location.href = '/'`.

## Scenarios

- **WHEN** a user navigates to `/login`
- **THEN** the application renders the `LoginScreen` component without loading the standard workspace.

- **WHEN** a user clicks "Sign in with Google" and the credential belongs to an existing account
- **THEN** the system catches the `auth/credential-already-in-use` error, logs them in via `signInWithCredential`, and redirects them to the root (`/`).

- **WHEN** a user submits valid email and password
- **THEN** the system logs them in via `signInWithEmailAndPassword` and redirects them to the root (`/`).

- **WHEN** Firebase Auth takes longer than 5 seconds to respond
- **THEN** the circuit breaker triggers, aborting the UI loading state and displaying a "Network timeout. Please try again." error.

- **WHEN** a user encounters an authentication error (e.g., wrong password)
- **THEN** the `LoginScreen` displays an appropriate inline error message, resets the loading state, and leaves the form intact for a retry.
