# Design: PLG & UX Bifurcation

## Context

Solo Founders and Enterprise PMs have fundamentally different Jobs To Be Done (JTBD). The platform must accommodate both without diluting the experience for either.

## Goals

- Separate user intent at the very first interaction.
- Decouple frontend architecture to support entirely distinct workspaces.
- Maintain seamless OAuth merging and instant stream hydration to avoid breaking the Reverse Demo Hook momentum.

## Non-Goals

- Fully building the interactive Enterprise Command Center (Workspace B) in Phase 1. We will use Wizard of Oz validation instead.

## Decisions

- **Decoupled Components & Context Splitting:** Build separate top-level React components (`<FounderWorkspace>` vs. `<EnterpriseWorkspace>`). To prevent React 19 "God Object" render cascades, `WorkspaceProvider` is restricted to identity/routing only. Domain data is pushed down to `<FounderProvider>` and `<EnterpriseProvider>`. Global navigation (including the account settings toggle) lives in a unified `WorkspaceShell` header.
- **Anti-AI Slop & Insight Feed (Workspace A):** Move away from a generic "Chat" mental model. The left pane acts as a "Decision Queue" or "Insight Feed" where interactive feature/pivot cards are the primary UI elements, relegating conversational text to a secondary context layer.
- **Mobile Responsive Fallback:** The "Split-pane Copilot Canvas" must collapse into a tabbed view (`<Tabs>` or a bottom sheet drawer) on screens `< 768px` to prevent broken side-by-side layouts.
- **Concrete MVP UI (Workspace B):** Instead of defining Workspace B by what it _lacks_, it explicitly consists of a "Generate Market Report" form and a dashboard feed of previously generated static PDF/Markdown reports (Wizard of Oz validation).
- **Anonymous Persona Retention:** The Zero Friction Entry will immediately write the selected `persona` (`solo_founder` or `enterprise_pm`) to the anonymous user's Firestore profile _before_ initiating the Cloud Run SSE. This ensures that when the user passes the PQL gate and converts to a permanent account, they bypass the onboarding interstitial and retain their momentum.
- **Legacy User Migration:** We will _not_ block legacy users with an onboarding interstitial. Legacy users will default to the `solo_founder` persona in the background, preserving their expected experience. A non-intrusive banner can be used later to advertise Workspace B.
- **Workspace Switching & Data Boundaries:** Workspaces act as isolated silos. Switching personas via the settings toggle loads the empty/default state for that workspace. Data is not automatically cloned back and forth, preventing leaky abstractions.
- **Card Placement, Content, & Interaction States:** Framer Motion cards render as full-width blocks inline within the Decision Queue. Cards must contain concrete data: Title, Description, Pros/Cons, and a Confidence Score.
  - **Acceptance:** Triggers a visual feedback loop: the Right Pane (Live Document) shows a targeted shimmer/pulse at the injection site (into explicitly structured sections like JTBD, Strategy, Pivot Vectors) before updating.
  - **Rejection:** Dismisses the card (with an "Undo" toast) and crucially saves the rejection as a _negative constraint_ in the `TenantIdea` document so the AI learns not to suggest similar pivots.
  - **Empty State:** When all cards are cleared, display an actionable CTA (e.g., "Run Market Radar" or "Export to OpenSpec") instead of a dead-end "Ideation Complete" state.
- **Firebase Security & App Check:** Enforce Firebase App Check (reCAPTCHA v3) on all Reverse Demo Hook endpoints to prevent API quota drains. If App Check fails or a domain is invalid, the backend will emit an explicit error chunk to halt the SSE stream and display a graceful error state _before_ the PQL gate is ever reached.
- **Backend SSE & Model Resolution:** Explicitly reject client-side Gemini streaming (`generateContentStream`) to protect API keys. Use backend Server-Sent Events (SSE) via Cloud Run. Dynamically resolve models (e.g., `gemini-flash-latest`) via Firebase Remote Config to prevent hardcoding.
- **Streaming Hydration & Conflict Resolution:** Cache the Phase 1 stream to an anonymous Firestore document. Upon `linkWithPopup`, if `auth/credential-already-in-use` is thrown, extract the credential via `OAuthProvider.credentialFromError` and call `signInWithCredential`. The `useStreamHydration` hook will seamlessly bind the cached stream to the new permanent UID.
- **Accessible UI Patterns (Workspace A):** The "Split-pane Copilot Canvas" will use standard CSS grid/flexbox with ARIA landmarks. "Tinder-style swipe cards" for feature pivots will use Framer Motion but _must_ include explicit, always-visible "Accept/Reject" buttons for keyboard accessibility and screen readers.

## Risks & Trade-offs

- Maintaining two distinct UI flows increases frontend maintenance burden.
- Routing relies heavily on self-selection or accurate interpretation of the entry hook, risking miscategorization.

## Future Potential

- Granular monetization tiers mapped directly to user personas (e.g., higher tiers for PMs needing raw data exports).
