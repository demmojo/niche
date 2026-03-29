# PQL Reverse Demo Hook & Trust Builder Plan

## Why

Currently, the Product Qualified Lead (PQL) flow and ideation validation experience suffers from three critical issues:

1. **Low Trust During Wait Times:** The user sees little value while waiting for their idea to be evaluated. A generic wait state misses the opportunity to build anticipation and trust.
2. **AI Forcibly Changing Niche Ideas:** The system frequently overwrites the user's idea even if it's already a hyper-niche, due to standard semantic clustering classifying niche terms within broader, saturated "tarpits."
3. **Weak PQL Gate:** The `PQLGateModal` is a standard, low-context sign-up wall. It fails to leverage the "Reverse Demo Hook" psychology (Endowment Effect and Loss Aversion) to maximize conversions.

## What Changes

We are revamping the ideation flow to be a "Trust-Building Progressive Disclosure" journey, culminating in a high-converting PQL gate.

1. **The "Trust Builder" Loading Screen (Labor Illusion):**
   - Introduce an "AI Working State" that progressively streams real market data (e.g., number of competitors found, initial tarpit score) before finalizing the AI's product strategy.
   - Uses React 19 `use()`, Radix Accordion, and Motion `layout` to smoothly expand steps as data arrives.
2. **The Idea Preservation Override:**
   - Modify the `scoringEngine` and `tarpitAnalyzer` to respect hyper-niche ideas. We will implement an "Orthogonal Vector Distance" check (or similar threshold bypass). If a user's idea is sufficiently unique despite semantic proximity to a tarpit, it triggers a "System Override" to preserve the original idea rather than auto-pivoting it.
3. **The Reverse Demo PQL Gate:**
   - Overhaul `PQLGateModal.tsx`.
   - Visually present the generated artifact (e.g., the validated idea dashboard) behind a blurred/gradient overlay.
   - Use possessive microcopy ("Save Your Analysis") and highlight the impending loss of the generated data if the user doesn't authenticate.

## Capabilities

### Modified Capabilities

- `PQL Gating`: Replaced basic auth wall with a contextual, loss-aversion-driven Reverse Demo Hook.
- `Idea Validation UI`: Replaced generic loading states with a real-time, streaming "Trust Builder" screen displaying intermediate insights.
- `Tarpit Analyzer`: Updated the scoring logic to prevent false positives when evaluating hyper-niche ideas, preventing the AI from unnecessarily pivoting valid concepts.

## Impact

- **Frontend:** `PQLGateModal.tsx`, `usePQLUpgrade.ts`, new `TrustBuilderScreen` component, Auth and Ideation flows.
- **Backend/AI:** `tarpitAnalyzer.ts`, `scoringEngine.ts`, `scoringRoutes.ts` (to stream intermediate evaluation steps and implement the niche preservation override).
- **UX:** Significant increase in Time-to-Value (TTV) perception and PQL conversion rates.
