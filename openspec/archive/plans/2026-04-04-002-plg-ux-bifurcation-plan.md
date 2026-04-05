---
status: archived
---

# Plan: PLG & UX Bifurcation (Solo Founder vs. Enterprise PM)

## 1. The Strategic Premise (Product Lens)

The recent integration of the `hyper-scale-saas-data-moat-pipeline` introduces a fundamental conflict in User Experience (UX). Indie Hackers and Solo Founders require **guided, opinionated constraints** to prevent them from building in "tarpits." Conversely, Enterprise Product Managers (PMs) require **deep, exploratory data provenance** for competitive market defense.

Attempting to serve both audiences with a single, unified PLG flow creates cognitive dissonance: it results in "enterprise data bloat" for founders and "insufficient analytical depth" for PMs.

**The Solution:** We must explicitly bifurcate the UX and Information Architecture (IA) right at the front door (Zero Friction Entry).

## 2. The PLG/PQL "Fork in the Road" (Spec Flow)

The Zero Friction Entry must separate user intent immediately, triggering distinct "Reverse Demo Hooks."

### Path A: The Solo Founder (Pre-Product)

- **Entry Hook:** "Validate my startup idea."
- **Reverse Demo (Pre-Gate):** The user enters an idea. The UI utilizes _Explainable AI Streaming_ (e.g., terminal-like logs showing the system working) to build trust. It presents the **"CAC & Velocity Wall"**—an opinionated, visual warning highlighting the ad spend and execution speed of incumbents in that horizontal market to shock them out of the tarpit.
- **The PQL Gate:** "This market is a high-velocity tarpit. Sign up to unlock your **Tarpit Score** and your **Pivot Strategy**."
- **The Endowment Effect:** The user authenticates (paying with their email/subscription) specifically to find the "escape route" (the defensible micro-niche).

### Path B: The Enterprise PM (Later-Stage)

- **Entry Hook:** "Analyze a competitor or market."
- **Reverse Demo (Pre-Gate):** The user enters a competitor domain. The UI streams a **"Market Radar Summary"** showcasing raw data proxy highlights pulled from the Data Moat (e.g., "Engineering hiring up 40%, SEO indexation down 10%").
- **The PQL Gate:** "Sign up to unlock the full **GTM Vulnerability Matrix** and 365-day trailing execution velocity."
- **The Endowment Effect:** The user authenticates to access actionable, data-proven intelligence they can immediately export or present to internal stakeholders.

## 3. Post-Login Product Design (Design Lens)

Once authenticated, the workspace architectures must diverge completely to match the user's specific "Job To Be Done".

### Workspace A: The Pivot Simulator (Momentum-Driven IA)

_Designed exclusively for the Solo Founder._

- **IA Style:** Linear, wizard-like, and highly opinionated.
- **Core Interface:** A split-pane Copilot Canvas. The left side is the AI Co-Founder chat; the right side is the active Product Spec/Strategy.
- **Interaction State:** When a tarpit is detected, the UI switches to the **Pivot Simulator**. It presents 3 distinct, AI-generated pivot vectors (e.g., "Pivot by Audience," "Pivot by Price Point"). The user interacts via Tinder-style swipe cards to Accept or Reject features.
- **Progressive Disclosure:** Deep data is hidden. The founder only sees the _implications_ of the data (e.g., a simple binary "High Threat" vs. "Low Threat" guardrail).

### Workspace B: The Command Center (Audit-Driven IA)

_Designed exclusively for the Enterprise PM._

- **IA Style:** Spatial, dense, and comparative.
- **Core Interface:** Multi-column data grids, SWOT matrices, and side-by-side competitor comparisons.
- **Interaction State:** X-Ray Panels. PMs require strict data provenance. Clicking any insight (e.g., "Competitor X is pivoting to Enterprise") opens a side drawer showing the exact Exa source URL or the BigQuery proxy metric that triggered the insight.
- **Progressive Disclosure:** Data density is exposed by default. Features include multi-select, version history toggles, data export options (CSV/PDF), and branch comparisons.

## 4. Engineering & Architecture (Architecture Strategist)

- **Decoupled Components:** To prevent Generative UI "slop", we must build separate top-level React components (e.g., `<FounderWorkspace>` vs. `<EnterpriseWorkspace>`) that consume from the same underlying data contexts (e.g., `WorkspaceProvider`).
- **Streaming Hydration:** Both paths must continue to use the existing seamless OAuth merging (`linkWithPopup`). Crucially, they must instantly hydrate the cached Phase 1 stream upon login to avoid the "Double-Hit Latency Penalty" that would break the momentum of the Reverse Demo Hook.
- **Wizard of Oz Validation:** Before engineering the massive Enterprise Command Center (Workspace B), we will validate Path B manually. Founders/PMs will request a market analysis, and the system will generate a static markdown/PDF report using the backend proxies in "shadow mode." We only build the interactive grid once the report format proves to have high retention value.

## 5. Migration & Routing Strategy for Existing Users

- **Routing Logic (The Interstitial):** When an existing user logs in after this update, they are presented with a one-time onboarding interstitial: "Are you building a product or analyzing a market?"
  - If they select "Building", their account is flagged as `persona: solo_founder`, and they default to `<FounderWorkspace>`.
  - If they select "Analyzing", their account is flagged as `persona: enterprise_pm`, and they default to `<EnterpriseWorkspace>`.
- **Data Migration:** Existing saved `TenantIdea` records will render seamlessly in the `<FounderWorkspace>`. If an existing user chooses the Enterprise path, their saved ideas are converted into `GlobalMarketFact` watchlists.
- **Toggle Mode:** We will provide an account settings toggle allowing users to switch between the two workspaces without creating a new account, preserving their legacy data regardless of the active view.
