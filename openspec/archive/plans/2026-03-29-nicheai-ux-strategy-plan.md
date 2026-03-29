---
name: nicheai-ux-strategy
overview: A mathematically and scientifically grounded UX and product strategy for NicheAI's onboarding and market validation workflows, incorporating JTBD scoring, Intent-Based Routing, and the Reverse Demo Hook.
todos:
  - id: scaffold-openspec
    content: Run `create-openspec` to scaffold the OpenSpec directory for the new validation flow
    status: completed
  - id: update-zero-friction-entry
    content: Update `src/components/ZeroFrictionEntry.tsx` to implement Intent-Based Routing and the PQL Gate
    status: completed
  - id: update-scoring-engine
    content: Update `src/utils/scoringEngine.ts` to include JTBD and Quantitative Gap Analysis schemas and math
    status: completed
  - id: update-scoring-routes
    content: Update `src/server/scoringRoutes.ts` to stream the new JTBD and Gap Analysis SSE events
    status: completed
  - id: update-trust-builder-screen
    content: Inject `<JTBDStep>` and `<GapAnalysisStep>` Suspense boundaries into `src/components/TrustBuilderScreen.tsx`
    status: completed
isProject: false
---

# NicheAI: Product & UX Strategy Review (Onboarding & Validation)

This plan outlines the transformation of NicheAI’s core onboarding and market validation workflow into an academically rigorous, psychologically optimized experience.

## 1. Evidence-Based Onboarding

We will apply 2026 behavioral psychology patterns to eliminate the "blank canvas" and guide users into specific niches.

- **Intent-Based Routing (Hick's Law):** Force users into a specific "Job to Be Done" immediately. We will update `[src/components/ZeroFrictionEntry.tsx](src/components/ZeroFrictionEntry.tsx)` to ask a single routing question with 3-5 options before accepting their idea. The UI will dynamically prune irrelevant features based on this choice to reduce decision fatigue.
- **Progressive Disclosure (Goal Gradient & Zeigarnik Effects):** We will implement a 3-5 step onboarding checklist where the first step is pre-completed ("Account Created ✓"). Complex configurations will be abstracted behind secondary screens, preventing cognitive overload during Day 1.

## 2. Optimizing Time-to-First-Value (TTFV)

To hit the "Aha!" moment rapidly, we will artificially shrink TTFV using AI pre-population.

- **Smart Defaults & Pre-Population:** Instead of an empty state, we will use the user's initial intent to aggressively pre-populate competitor data via Exa/Apollo, giving them immediate momentum.
- **Explainable States (The Labor Illusion):** We will double down on the SSE streaming architecture in `[src/components/TrustBuilderScreen.tsx](src/components/TrustBuilderScreen.tsx)`. By showing granular updates (`aria-live="polite"`) of the AI's real-time labor, we build trust and keep users engaged without generic spinners.

## 3. Scientific Validation Flow

We will replace the subjective "wedge metric" with mathematically rigorous frameworks to score market viability.

- **Jobs-To-Be-Done (JTBD) Opportunity Scoring:** We will implement Anthony Ulwick's formula: `Opportunity = Importance + Math.max(Importance - Satisfaction, 0)`.
- **Quantitative Gap Analysis:** We will extract structured market deficits from negative competitor reviews found via Exa.
- **Implementation Path:**
  - **Data Model:** Expand `LLMExtractionSchema` in `[src/utils/scoringEngine.ts](src/utils/scoringEngine.ts)` to require `jtbd` (importance/satisfaction) and `market_gaps` sub-objects.
  - **SSE Pipeline:** Update `[src/server/scoringRoutes.ts](src/server/scoringRoutes.ts)` to emit two new intermediate event types: `{ type: 'jtbd_analysis' }` and `{ type: 'gap_analysis' }`.
  - **UI Orchestration:** Inject two new `<Suspense>` accordions (`<JTBDStep>` and `<GapAnalysisStep>`) into the `TrustBuilderScreen` state machine.

## 4. Actionable Outputs & Activation

We will convert abstract data into concrete GTM action, using psychology to drive upgrades.

- **The IKEA Effect / Investment Trigger:** By allowing users to curate and edit the AI's optimistic validation results on the success screen of `ZeroFrictionEntry`, we create a positive sunk cost.
- **Reverse Demo Hook (PQL Gate):** The user experiences the full value of the validation _before_ hitting a paywall. The "Generate Full Campaign" button serves as the ultimate Product Qualified Lead (PQL) gate, funneling high-intent users into paid activation.

---

_Note: Once this plan is approved, I will use the `create-openspec` skill to scaffold the formal proposal, design, and task markdown files._
