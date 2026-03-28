## Why

NicheAI has vast amounts of strategic context (JTBDs, sentiment, competitor flaws, value props), but currently users cannot easily translate this into usable product interfaces or applications without heavy manual effort. We want users to go from idea to design/code quickly, for free, while taking advantage of best-in-class visual AI generators like v0.dev, Bolt.new, or Claude. Providing a highly-optimized "Prompt Exporter" allows us to bridge this gap without incurring massive internal LLM costs for code generation.

## What Changes

We are introducing a **Rapid PDLC Workflow (Strategy to Code)** feature. This consists of:

1. A zero-cost, client-side **Prompt Assembler** that packages NicheAI's strategic data into an optimal system prompt.
2. A unified **Strategy-to-Code Wizard** for configuring scope, tech stack, and exporting the prompt.
3. A **Loop-Back Validation (Artifact Reviewer)** step where users can paste generated code back into NicheAI to evaluate it against the original strategic constraints.
4. An update to the `MyProductData` schema to save generated prompt metadata (without bloating Firestore limits).

## Capabilities

### New Capabilities

- `prompt-exporter`: Users can export structured, CO-STAR formatted system prompts tailored to external AI tools containing injected JTBDs, user sentiment, and competitor anti-patterns.
- `artifact-validation`: Users can paste generated UI code back into NicheAI and get a focused critique checking if the code complies with product strategy and UX heuristics.

### Modified Capabilities

- `product-data-storage`: `MyProductData` state tracking will now include `generatedPrompts` metadata tracking history and status of exports.

## Impact

- **Frontend:** New unified wizard component (`StrategyToCodeWizard.tsx`) replacing/consolidating older mockups. Addition of client-side prompt builder utilities (`promptAssembler.ts`).
- **Data Model:** `src/types.ts` will be updated to support `GeneratedPromptMeta`.
- **AI/LLM Integrations:** New prompt endpoints required for the Artifact Reviewer (Critic model), optimized for large contexts and strict dimension-checking.
