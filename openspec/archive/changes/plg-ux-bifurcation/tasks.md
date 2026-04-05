# Tasks: PLG & UX Bifurcation

## Phase 1: Foundation, Security & Entry Hooks

- [x] Build the Zero Friction Entry "Fork in the Road" interface, explicitly writing the `persona` (`solo_founder` vs `enterprise_pm`) to the anonymous Firestore document before proceeding.
- [x] Implement Firebase App Check (reCAPTCHA v3) verification on Cloud Run Reverse Demo Hook endpoints, returning graceful error states _before_ rendering the PQL gate.
- [x] Implement Firebase Remote Config model resolution (e.g., `gemini-flash-latest`).
- [x] Build Backend SSE orchestrator (explicitly rejecting client-side `generateContentStream`).
- [x] Implement Path A Reverse Demo Hook (Explainable AI Streaming + CAC & Velocity Wall).
- [x] Implement Path B Reverse Demo Hook (Market Radar Summary) with graceful URL validation fallbacks.
- [x] Design and implement divergent PQL Gates for both paths, handling abandonment logic.
- [x] Implement two-phase caching (write to an anonymous Firestore document before PQL gate) and a `useStreamHydration` hook for seamless OAuth merging.
- [x] Implement robust `linkWithPopup` conflict resolution (`auth/credential-already-in-use`) by catching, extracting the credential via `OAuthProvider.credentialFromError`, and logging the user in directly.

## Phase 2: Post-Login Workspaces

- [x] Scaffold isolated domain providers (`<FounderProvider>`, `<EnterpriseProvider>`) and split `WorkspaceProvider` to manage identity only.
- [x] Create `WorkspaceShell` using compound components/slots for DRY layout, housing global navigation and the account settings toggle.
- [x] Build the Pivot Simulator UI for Workspace A (Left Pane: Decision Queue/Insight Feed, Right Pane: Live Document structured into JTBD, Gaps, Strategy, Pivot sections).
- [x] Implement mobile responsive fallback for Workspace A (tabbed layout or bottom sheet drawer for screens < 768px).
- [x] Implement Framer Motion feature cards rendered as full-width blocks inline within the Decision Queue, with explicit Accept/Reject buttons, Title, Description, Pros/Cons, and Confidence Score.
- [x] Build interaction states for Workspace A:
  - Acceptance: Targeted shimmer/pulse in the Live Document.
  - Rejection: Card dismissal with "Undo" toast, persisting as a _negative constraint_ in `TenantIdea`.
  - Empty: Replace "Ideation Complete" with an actionable CTA (e.g., Export to OpenSpec).
- [x] Implement MVP UI for Workspace B (A "Generate Market Report" form and a list of historically generated static PDF/Markdown reports).
- [x] Enforce Firestore security rules (`TenantIdea` private, `GlobalMarketFact` immutable from client).

## Phase 3: Migration & State Management

- [x] Implement a background migration defaulting all legacy users to `persona: solo_founder` (removing the blocking interstitial).
- [x] Ensure post-login routing seamlessly assigns users to their correct workspace.
- [x] Add a non-intrusive banner for discovery of the other workspace (e.g., "Are you an Enterprise PM?").
- [x] Add an impersonation escape hatch (`isImpersonated: true`) that bypasses PQL gates and CAC/Velocity walls globally for superadmins.
- [x] Add an account settings toggle allowing users to switch between workspaces as isolated silos (loading default/empty state for the other workspace).
