---
title: PLG Builder Paradigm Journey
status: draft
type: feature
relationships: []
---

# PLG Builder Paradigm Journey

## 1. Context & Objective

NicheAI needs a Product-Led Growth (PLG) funnel that converts anonymous users into registered users. We are applying the "Reverse Demo Hook" to maximize the Endowment Effect via a **Constrained Curation** model.

Crucially, we must aggressively prevent "AI Slop" while explicitly avoiding the "Bait and Switch Friction Trap"—where we hook a user with opinionated AI guidance pre-gate, only to dump them into a blank, unopinionated text editor post-gate.

## 2. Product Lens Evolution: The "Anti-Popup" Onboarding

Traditional SaaS onboarding relies on intrusive, modal-based product tours (e.g., WalkMe). **Product Lens Verdict: Reject all modal tours.**

- **The Trap:** Modal tours break the "AI Co-Founder" identity. A co-founder doesn't hand you a manual; they say, _"Here is what we need to decide today."_ Furthermore, modal tours kill momentum right after the user passes the PLG conversion gate.
- **The Pivot (Embedded Guidance):** We utilize "Action over Navigation." The onboarding is embedded directly into the workspace states using _Ghost Nodes_, _Inline Placeholders_, and a _Mastery State Machine_.

## 3. The Journey Stages (Iterated SaaS Design)

### Stage 1: The Stake in the Ground (Tactile Inputs)

- Replace open-ended text inputs with a structured Mad-Libs UI: _"I want to build a [Category] for [Audience] that solves [Problem]."_
- **Design Identity:** Clean SaaS. Soft `slate-200` borders, dot-grid background.
- **Immediate Data:** The right side displays Phase 1 Exa competitor data instantly (<2s).

### Stage 2: Constrained Curation (The Tease)

- **Interaction Model:** "Simulated Highlighting." Users don't type; they highlight sentences in the market data to instantly save them as structured "Insight Cards" in a sticky sidebar.
- **The Tease:** Features like "Add Custom Feature" or "Execution Phase" are heavily frosted/blurred with a physical lock icon overlay.

### Stage 3: The Vault Gate (PQL)

- **Psychological Trigger:** Loss aversion. _"You've curated a strong, data-backed niche. Unlock the Vault to save your highlights and enter the Execution Phase."_
- **Technical Constraint:** Modal using Radix UI `Dialog.Portal` to overlay the React tree without unmounting it.

### Stage 4: Conversion & Stateful Resume

- Use Firebase `linkWithPopup`. Extract credentials on `auth/credential-already-in-use` to sign in directly without a full page reload (zero double-hit latency).

### Stage 5: The Director (Post-Gate Execution & Embedded Onboarding)

- **The Transition:** The frosted locks vanish. The left panel condenses the user's curated insights into an immutable "Strategy North Star."
- **The UI (Human-In-The-Loop Node Graph):** The right panel becomes a structured, linear node graph pipeline.
- **Embedded Onboarding Mechanics (No Popups):**
  - **The Ghost Node (Context):** The very first node in the graph is a dashed "Ghost Node" that silently explains the mechanic: _"The AI breaks features into atomic phases and pauses. Nothing is coded until you approve."_
  - **Placeholder Progression (Action):** The `[Comment]` box doesn't say "Comment". It uses instructional placeholders: _"See an issue? Ask the AI to revise this schema..."_
  - **Progressive Disclosure:** Future nodes in the graph are rendered with an inline empty state explaining _why_ they are locked: _"Locked. The AI will draft these routes after you approve the Database Schema in Phase 02."_
- **Interaction Mechanics:**
  - The active node pulses. The user has three rigid actions: `[Approve]` (Acid Yellow button), `[Reject]`, or `[Revise]` (using the placeholder input).

## 4. Technical Constraints

- **Frontend:** React 19, Radix UI.
- **Typography/Color (Stage 5 Anti-Slop):** Use _Bricolage Grotesque_ (Headers) and _IBM Plex Mono_ (Data/Code). Use deep black backgrounds (`#050505`) and brutalist **Acid Yellow** (`#E3FF00`) accents for active execution states to signify a shift from "planning" to "industrial engineering."
- **Simulated Highlighting:** `<span role="button" class="...">` instead of custom DOM selection.
- **Mastery State Machine:** A lightweight React Context that tracks if the user has successfully executed a node action, permanently hiding Ghost Nodes and hints once mastery is achieved.

## 5. Metrics for Success

- Anonymous to Registered conversion rate (Primary).
- Stage 5 Churn: Drop-off rate immediately after unlocking the gate (measures if the post-gate experience is too overwhelming).
- Onboarding Velocity: Time to first `[Approve]` action on a Node without using a traditional product tour.
