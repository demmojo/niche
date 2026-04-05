## Context

The transition from an anonymous visitor receiving their first "Aha!" moment to a fully authenticated power user generating product documentation is the most critical funnel in NicheAI. Currently, technical implementation details (layout shifts, modal popups, text streams, and duplicate latency penalties) interrupt the psychological momentum of this journey.

## Goals / Non-Goals

**Goals:**

- Achieve zero Cumulative Layout Shift (CLS) during AI streaming sequences and initial intent selection.
- Guarantee 100% perceived data continuity across the `signInWithPopup` / `linkWithPopup` auth boundary.
- Eliminate the "Double-Hit" latency penalty post-authentication by caching the pre-computed LLM result.
- Survive accidental page refreshes via URL-driven state persistence during the PLG flow.
- Deprecate center-screen modals for all generative workflows in favor of Side Drawers.
- Implement progressive disclosure for PRD and OpenSpec generation using Generative UI.
- Invert the `DocumentationWizardModal` to ask for "Format" first, preventing the "False Choice" trap.

**Non-Goals:**

- Changing the underlying Gemini 3.1 or Exa prompts (this is purely a UI/UX and state management refactor).
- Building an undo/history system for AI text chunks (YAGNI for now).

## Decisions

**1. Modal Architecture Migration**

- **Decision**: Replace `CompetitorDiscoveryModal` and `DocumentationWizardModal` with a persistent right-side `Drawer` component (e.g., Radix UI Dialog styled as a side sheet with `modal={false}`).
- **Rationale**: Center modals induce "Contextual Claustrophobia" by covering the dashboard (ground truth). A non-modal side drawer allows the user to reference their Matrix or Ideation board while generating docs on the right.

**2. Anti-CLS Streaming Containers & Predictable Layouts**

- **Decision**: Wrap all SSE streaming text outputs in a skeleton container with a predefined `min-height` based on the expected chunk size. Apply `min-h-[400px]` to the `ZeroFrictionEntry` intent selection area. Do not auto-expand Accordions as stream chunks arrive.
- **Rationale**: Prevents the "Jittering Waterfall" effect, allowing the user's eye tracking to remain stable.

**3. Generative UI & Inverted Wizards**

- **Decision**: The backend will emit delimited JSON streams to render distinct React components. The `DocumentationWizardModal` will ask for "Format" on Step 1, and conditionally render subsequent steps based on the format's requirements.
- **Rationale**: Prevents the "Cognitive Dump" and stops users from curating data that the selected format will ultimately discard.

**4. Post-Auth Guided Continuity & The Double-Hit Fix**

- **Decision**: Sync the `ZeroFrictionEntry` intent and query to URL parameters (`?intent=validate&q=...`). Compute and cache the _entire_ Tarpit Score payload on the backend/Firestore _before_ the PQL gate triggers. When the OAuth popup resolves, hydrate from this cache instantly.
- **Rationale**: Eliminates "Contextual Whiplash", survives browser refreshes, and drops post-auth TTFV from ~15 seconds to ~100ms.

## Risks / Trade-offs

- **Risk: Streaming JSON Complexity** -> Parsing incomplete JSON chunks for Generative UI is notoriously difficult.
- **Mitigation**: Use a robust partial JSON parser coupled with Zod discriminated unions.
- **Risk: Auth Hydration Race Conditions** -> `linkWithPopup` resolving before Firestore reparenting completes.
- **Mitigation**: Use an Optimistic Hydration Cache in `sessionStorage` to render the UI immediately while the backend synchronizes.

## Future Potential & Wow Features

- **Interactive Canvas Specs**: Transform the static Generative UI cards into an interactive, draggable canvas where users can visually map features to market gaps.
- **Architectural / Design To-Do**: Abstract the Generative UI stream parser into a universal `useGenerativeUI` hook that can be reused for all future LLM integrations across the platform.
