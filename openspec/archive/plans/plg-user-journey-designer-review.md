# NicheAI: PLG User Journey (Behavioral Design Blueprint)

## 1. The Core Premise: The Builder Paradigm

This document outlines the Product-Led Growth (PLG) user journey for NicheAI. It abandons the passive "AI generates, user consumes" model in favor of the **Builder Paradigm**.

To maximize conversion, we must engineer the **Endowment Effect** and the **IKEA Effect**: founders must feel they _built_ this unique product thesis, making it too valuable to abandon. Furthermore, we maintain a zero-tolerance policy for "AI Slop" (generic text walls, chat interfaces).

**This document serves as a strict behavioral contract between Product, Design, and Engineering.**

## 2. Target Audience & Core Problem

- **Target Audience:** Founders, indie hackers, and small teams.
- **Core Problem:** Analysis paralysis, building "tarpit" horizontal ideas, and the misconception that AI can do the strategic thinking _for_ them.
- **Design Directive (Anti-Slop):** No blank text areas. No chat UI. The interface must be categorical, structural, and tactile (sliders, toggle switches, draggable tags). The user drives; the AI is the intern fetching data.

---

## 3. The Journey Stages

### Stage 1: The Stake in the Ground (Anonymous Entry)

**User State:** Anonymous (Unauthenticated)  
**Psychological Goal:** Commitment. Force the user to make a choice, avoiding the blank canvas.

- **UI/UX Flow:**
  - The user lands on the homepage. Instead of an open-ended "What are you building?" text box (which invites slop), they are presented with a **Mad-Libs / Constraint Engine**.
  - Example UI: _"I want to build a [Select Software Category] for [Select Broad Audience] that solves [Select Core Problem]."_
- **Interaction States & Edge Cases:**
  - **The "Tarpit" Warning (Empty/Saturated State):** If Phase 1 (Data Fetch) reveals 100+ identical competitors, the UI flashes a stark warning: _"High Risk: Saturated Tarpit."_ This challenges the user's ego and hooks them into fixing it.
- **Technical/Design Constraints:**
  - **Two-Phase Fetch Strategy:**
    - _Phase 1 (Deterministic):_ Immediately fetch and display _hard data_ (Exa search for existing competitors) within <2s.
    - _Phase 2 (Generative):_ Background LLM generates 2-4 word structural tags (not paragraphs) asynchronously.

### Stage 2: The Component Workshop (The IKEA Effect)

**User State:** Anonymous (Unauthenticated)  
**Psychological Goal:** Ownership. The user must assemble the product thesis, not just pick one.

- **UI/UX Flow:**
  - Instead of presenting fully-baked "Pivot Cards" that the user passively accepts, the UI presents a **Component Workshop**.
  - The AI suggests _Vectors of Differentiation_ (e.g., "Shift Audience from Agencies to Solo-Preneurs", "Shift Pricing to Pay-Per-Usage").
  - **Interaction Model:** The user _drags and drops_ or _toggles_ these vectors onto their core idea. By manually mixing and matching constraints, the user _builds_ the pivot.
- **Information Architecture & Responsive Strategy:**
  - **Desktop:** A physical-feeling workbench. Left side = AI-suggested Component Tags. Center = The User's "Current Thesis" (where they drag tags). Right side = Real-time competitor data reflecting their choices.
  - **Mobile:** A vertical "Stack". Tap a vector to inject it into your thesis. The data updates instantly via a sticky bottom-sheet peek.
- **Strict Anti-Slop Anatomy:**
  - AI outputs are restricted to micro-copy.
  - A "Vector" is exactly: **[Action Verb] + [Target]** (e.g., _Target Non-Profits_).
  - NO generative paragraphs explaining _why_ until the user explicitly requests a "Thesis Review".

### Stage 3: The Vault Gate (Product Qualified Lead)

**User State:** Anonymous (Unauthenticated)  
**Psychological Goal:** Loss Aversion. "I built this highly differentiated, data-backed thesis. I cannot lose it."

- **UI/UX Flow:**
  - Triggered when the user hits "Generate Execution Spec", "Save to Vault", or exhausts their local token quota.
  - A contextual modal appears: _"Your thesis is locked in. Sign in to save this workspace and generate the technical OpenSpec."_
- **Session Recovery Flow (Returning Anonymous):**
  - If a user closes the tab, their "workbench" state is hydrated from local storage upon return. They see their half-assembled thesis waiting for them.
- **Technical/Design Constraints:**
  - **Radix UI Dialog Portal:** The PQL modal must use a Portal. The background React tree (showing their custom-built thesis) remains visible, mounted, and inert under the overlay.
  - **Stateful Caching:** The custom assembly state MUST be cached to Firestore before the modal appears.

### Stage 4: Conversion & Stateful Resume

**User State:** Authenticating -> Authenticated  
**Objective:** Seamless gratification. The reward for signing in must be instantaneous.

- **UI/UX Flow:**
  - The user clicks "Sign in with Google".
  - Upon success, the modal vanishes, and the UI immediately transitions from the "Workshop" into the "Command Center".
- **Technical/Design Constraints:**
  - **`linkWithPopup` Upgrades:** We upgrade the anonymous session. If `auth/credential-already-in-use` occurs, extract the credential and log them in seamlessly.
  - **Zero "Double-Hit" Latency:** No page reloads. The state is already in memory; the UI simply unlocks the "Generate Spec" functionality.

### Stage 5: The Director (Actionable Execution)

**User State:** Authenticated  
**Psychological Goal:** Delegation. The user transitions from assembling the idea to managing the AI intern building it.

- **UI/UX Flow:**
  - The user is presented with the generated `plan.md` and technical specs.
  - **Interaction Model:** The UI provides a Human-in-the-loop (HITL) review pane. The user does not write the code; they accept, reject, or comment on the AI's technical decisions.
  - The AI Slop rule remains: Specs are rendered as structural tables, dependency graphs, and code blocks. No "Here is your plan!" conversational filler.
