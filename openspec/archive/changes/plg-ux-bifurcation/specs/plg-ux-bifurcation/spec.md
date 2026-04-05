# Spec: PLG & UX Bifurcation

## Detailed Features

- **Path A (Solo Founder):** Pre-gate Idea Entry -> Explainable AI Streaming -> "CAC & Velocity Wall" -> PQL Gate -> Linear Pivot Simulator Workspace.
- **Path B (Enterprise PM):** Pre-gate Competitor Domain Entry -> "Market Radar Summary" Streaming -> PQL Gate -> Spatial Command Center Workspace.
- **Routing & Architecture:** Context-split workspaces (`<FounderProvider>` vs `<EnterpriseProvider>`), Backend SSE streams protected by Firebase App Check, non-destructive append-only data migrations, and `linkWithPopup` conflict resolution.
- **Model Dynamic Resolution:** Remote Config dictates the streaming model version (e.g., `gemini-flash-latest`) to avoid codebase hardcoding.

## Scenarios

**SCENARIO:** Solo Founder Entry

- **WHEN** a user enters an idea via "Validate my startup idea"
- **THEN** the UI streams Explainable AI logs and presents the opinionated "CAC & Velocity Wall" warning before presenting the PQL gate.

**SCENARIO:** Solo Founder Hits a Tarpit

- **WHEN** a Solo Founder is engaged with the Pivot Simulator and a tarpit is detected
- **THEN** the UI presents 3 distinct, AI-generated pivot vectors using Tinder-style swipe cards to accept or reject features.

**SCENARIO:** Enterprise PM Entry

- **WHEN** a user enters a competitor domain via "Analyze a competitor or market"
- **THEN** the UI streams a "Market Radar Summary" showcasing raw data proxy highlights before the PQL gate.

**SCENARIO:** Enterprise PM Deep Dive

- **WHEN** an Enterprise PM clicks an insight in the Command Center
- **THEN** an X-Ray Panel side drawer opens displaying the exact Exa source URL or BigQuery proxy metric for strict data provenance.

**SCENARIO:** Existing User Login & Migration

- **WHEN** an existing user logs in after the bifurcation update
- **THEN** a routing interstitial asks "Are you building a product or analyzing a market?" to flag their account (`persona: solo_founder` or `persona: enterprise_pm`)
- **AND** migrations are non-destructive (append-only) to allow safe toggling between views.
- **AND** if the session is `isImpersonated: true`, the interstitial is bypassed to prevent accidental data destruction by superadmins.

**SCENARIO:** Reverse Demo Hook Protection

- **WHEN** a user initiates a Zero Friction Entry
- **THEN** Firebase App Check (reCAPTCHA v3) token is verified before Cloud Run initiates Backend SSE with dynamically resolved models from Remote Config.
