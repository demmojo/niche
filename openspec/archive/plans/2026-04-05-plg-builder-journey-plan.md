---
title: PLG Builder Paradigm Journey
status: draft
type: feature
relationships: []
---

# PLG Builder Paradigm Journey

## 1. Context & Objective

NicheAI needs a Product-Led Growth (PLG) funnel that converts anonymous users into registered users. We are moving away from the "Brutalist Machine Terminal" aesthetic toward a clean, modern SaaS identity (Linear/Notion-inspired) that aligns with the "Niche" brand.

The goal is to maximize the Endowment Effect (ownership) via a **Constrained Curation** model. We must aggressively prevent "AI Slop" while explicitly avoiding "The Friction Trap"—giving users complex tools (like free-text note-taking or manual feature iteration) _before_ they pass the Product Qualified Lead (PQL) gate.

## 2. Product Lens Evolution & The Friction Trap

We evaluated introducing a "Strategy Canvas" allowing users to iterate on strategy, write custom features, and highlight text _before_ the auth gate.

**Product Lens Verdict: Reject Pre-Gate Iteration.**

- **The Trap:** Deep iteration is a destination, not a hook. Giving users a blank canvas to type notes before they have an account sabotages the "Reverse Demo Hook" by killing velocity. It gives them _work_ instead of _magic_.
- **The Pivot (Progressive Commitment):** We split the journey. **Pre-Gate** is for rapid, constrained curation (swipes, toggles, highlight-to-keep). **Post-Gate** unlocks the deep iteration workspace. Sell the _magic_ before the gate, reserve the _tools_ for after the gate.

## 3. The Journey Stages (Iterated SaaS Design)

### Stage 1: The Stake in the Ground (Tactile Inputs)

- Replace open-ended text inputs with a structured, tactile Mad-Libs UI: _"I want to build a [Category] for [Audience] that solves [Problem]."_
- **Design Identity (Clean SaaS):** Soft `slate-200` borders, subtle `shadow-sm`, dot-grid background. The variables are soft-edged pills that focus with a crisp brand-color ring.
- **Immediate Data (Right Pane):** Instead of a harsh black terminal, the right side is an "Intelligence Panel"—a clean, structured document layout displaying Phase 1 Exa competitor data instantly (<2s).

### Stage 2: Constrained Curation (The Tease)

- The AI background process completes (Phase 2), injecting structural, micro-copy vectors (e.g., `Shift Pricing` + `Target Non-Profits`) into the Intelligence Panel.
- **Interaction Model (High-Velocity Curation):**
  - The user does _not_ write features. They use a "Keep/Discard" toggle on AI-generated insights.
  - **Highlight-to-Save:** Users can highlight key sentences in the competitor data, which saves them as "Insight Cards" in a sticky sidebar.
  - **The Tease:** Complex features like "Add Custom Feature" or "Deep Edit Strategy" are visibly present but rendered with a subtle lock icon or a blur effect.

### Stage 3: The Vault Gate (PQL)

- The user attempts to click a locked "Iterate Strategy" button, or clicks "Generate Execution Spec" for their curated insights.
- **Psychological Trigger:** Loss aversion. _"You've curated a strong, data-backed niche. Unlock the Vault to save your highlights, add custom features, and generate the technical OpenSpec."_
- **Technical Constraint:** Modal using Radix UI `Dialog.Portal` to overlay the React tree without unmounting it. State MUST be cached to Firestore prior to rendering the modal.

### Stage 4: Conversion & Stateful Resume

- Use Firebase `linkWithPopup` to merge the anonymous session.
- Gracefully catch `auth/credential-already-in-use` to extract credentials and sign in directly without a full page reload, achieving zero "double-hit" latency.

### Stage 5: The Strategy Canvas (Post-Gate Execution)

- **The Reward:** The UI transitions fully into the "Strategy Canvas." The locks disappear.
- Users can now freely edit the text, write custom features, and structure the PRD.
- Authenticated users manage the AI-generated execution specs via a HITL (Human-in-the-loop) review pane.

## 4. Technical Constraints

- **Frontend:** React 19, Radix UI primitives. UI must support the Split Screen architecture on desktop and a Bottom Sheet architecture for mobile to handle the Intelligence Panel data.
- **Highlighting Logic:** Custom DOM selection/highlighting logic that surfaces contextual tooltips (e.g., "Save Insight") without relying on heavy third-party rich text editors pre-gate.
- **Two-Phase Fetch:** Immediate hard-data fetch (<2s) followed by async generative scenarios to prevent infinite shimmer states.
- **Explainable States:** Use `aria-live="polite"` for accessibility.
- **Auth:** Firebase Modular SDK (`linkWithPopup`, `signInWithCredential`).

## 5. Metrics for Success

- Anonymous to Registered conversion rate (Primary).
- Drop-off rate in Stage 2 (measuring if curation is too frictionless or too complex).
- Number of "Highlights" or "Keeps" saved per anonymous session before hitting the gate.
