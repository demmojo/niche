## Context

NicheAI utilizes a "Reverse Demo Hook" where users begin their journey completely anonymously. However, we must provide a standard authentication gateway for returning users. According to our `AGENTS.md` guidelines, Firebase auth flows must be resilient against network flakes and unmounted components.

## Goals / Non-Goals

**Goals:**

- Provide a clean, minimalist `LoginScreen` that matches NicheAI's brand identity (centered card, ample whitespace, high-contrast typography).
- Support Google OAuth (`signInWithPopup`).
- Support standard Email/Password authentication.
- Gracefully handle `auth/credential-already-in-use` exceptions for anonymous users logging into existing accounts.
- Implement strict resilience: 5-second circuit breakers and `isMounted` checks (using existing `useIsMounted` hook) to prevent infinite hangs.

**Non-Goals:**

- Complex enterprise SSO integration (SAML/Okta).
- A heavy, multi-step onboarding flow (onboarding is handled elsewhere).
- Merging anonymous data into the logged-in account (explicit login implies switching contexts, not merging. Merging is handled via "Signup/Claim").

## Decisions

**1. Routing Implementation**

- **Decision**: Handle `/login` routing in `src/App.tsx` directly via `window.location.pathname`.
- **Rationale**: `App.tsx` currently uses simple path matching. Handling `/login` here prevents the heavyweight `WorkspaceShell` from booting up, establishing Firestore listeners, and loading data for an anonymous user when the intent is explicitly to switch accounts.
- **Alternatives Considered**:
  - _React Router_: Rejected. NicheAI currently uses a bespoke URL-matching approach to remain lightweight. Migrating the entire app to React Router is out of scope.

**2. Handling Anonymous Linking Conflicts (Account Switching)**

- **Decision**: If an anonymous user clicks "Sign in with Google", we will call `signInWithPopup`. If Firebase throws `auth/credential-already-in-use` (which happens if the provider is already linked to another account), we extract the credential via `OAuthProvider.credentialFromError` and call `signInWithCredential` to successfully log them into their existing account. We MUST immediately follow this with `auth.currentUser?.reload()` to ensure React state properly hydrates.
- **Rationale**: This adheres to the `AGENTS.md` rule for handling anonymous linking conflicts when the user explicitly wants to access an existing account. It drops the current anonymous session in favor of the existing account, and `reload()` prevents stale auth cache issues.

**3. Auth Resilience and Safety**

- **Decision**: Wrap all auth calls (`signInWithPopup`, `signInWithEmailAndPassword`) in a `try/finally` block. Use a 5-second circuit breaker timeout, use the existing `useIsMounted` hook to guard state updates, and explicitly verify `FirebaseError` types before extracting credentials.
- **Rationale**: Prevents the UI from hanging indefinitely if the Firebase Auth service hangs or if the user navigates away mid-request, causing "suspended inside an act scope" React errors.

**4. Post-Login Redirection Architecture**

- **Decision**: Upon successful login, execute `window.location.href = '/'` rather than relying purely on React state updates.
- **Rationale**: NicheAI's `WorkspaceShell` is heavily reliant on bootstrapping global providers (like `WorkspaceProvider`). A hard redirection ensures a clean React tree mount, preventing complex tree reconciliation bugs between the unauthenticated `LoginScreen` and the authenticated `WorkspaceShell`.

**5. Frontend Design Alignment**

- **Decision**: The `LoginScreen` will follow Frontend Design Module C (Component fitting into an existing App) conventions. It must inherit spacing, borders, and colors from NicheAI. We will avoid the "SaaS card grid" anti-pattern and use a minimal, focused view.
- **Rationale**: Keeps the UI consistent. Using a full-page takeover with a single centered form removes distractions and matches the clean NicheAI aesthetic.

**6. Product Lens: Data Loss Warning**

- **Decision**: If the user is currently anonymous and has generated local data (e.g., we can check for dirty storage or just rely on a simple state check for active anonymous users), the `LoginScreen` MUST explicitly warn them: "Logging in will switch your account. You may lose unsaved work."
- **Rationale**: From a product strategy standpoint, silent data loss is the worst outcome. If a user generated an insight anonymously and then clicks "Log in", they expect to keep their data. While data merging is a "Non-Goal" for this specific iteration, we must at least set the expectation and give them a chance to back out and click "Sign Up" instead.

**4. Google Auth Provider Initialization**

- **Decision**: Use the pre-initialized `GoogleAuthProvider` if available in `src/firebase.ts`, or initialize a new one locally in the component.
- **Rationale**: Ensures we use the correct scopes and configuration for Google Auth.

## Risks / Trade-offs

- **Risk: Dangling React State on Unmount** -> Navigating away mid-login might cause state updates on unmounted components.
- **Mitigation**: Use the existing `useIsMounted` custom hook (found in `src/hooks/useIsMounted.ts`) and strictly check `isMounted.current` before calling `setLoading(false)` or `setError(...)`.
- **Risk: Accidental Data Loss** -> Users might generate a great idea anonymously, click "Log in", and lose their anonymous workspace.
- **Mitigation**: We will ensure the UI clearly distinguishes "Log In" from "Sign Up to Save". We'll add a subtle warning in the UI if we detect they have dirty unsaved data (e.g. checking local storage), or simply rely on clear copy ("Log in to your existing account").

## Future Potential & Wow Features

- **Passwordless Magic Links**: Introduce email magic links for an even lower friction login experience.
- **Smart Session Recovery**: If a user logs in but had a dirty anonymous workspace, offer to migrate that workspace into their established account as a new project.
- **Architectural / Design To-Do**: Migrate to a standard routing library (like `wouter` or `react-router`) once the application adds more top-level discrete pages.
