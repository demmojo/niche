## 1. Data Model & Utilities

- [x] 1.1 Update `src/types.ts` to include the `GeneratedPromptMeta` interface and add `generatedPrompts: GeneratedPromptMeta[]` to `MyProductData`.
- [x] 1.2 Create `src/utils/promptAssembler.ts`. Implement the core function `generateSystemPrompt(productData, config)` that uses the CO-STAR template structure and injects JTBDs and Competitor flaws as `[CONSTRAINTS]`.
- [x] 1.3 Add prompt assembly unit tests in `src/__tests__/utils/promptAssembler.test.ts` to verify correct bracketed output and context injection.

## 2. UI/UX: Strategy-to-Code Wizard

- [x] 2.1 Create the `StrategyToCodeWizard.tsx` component as a multi-step modal using existing UI components (Dialog, Tabs/Stepper).
- [x] 2.2 Implement **Step 1: Configure**. Add form controls for Scope (App vs Component) and Tech Stack selection.
- [x] 2.3 Implement **Step 2: Handoff**. Integrate the `promptAssembler` to render the prompt in a syntax-highlighted block. Add the "Copy to Clipboard" action with a 2-second success state change, and a "Download as .md" button using Blob URLs.
- [x] 2.4 Implement **Step 3: Validate**. Add a large text area for pasting code.

## 3. Loop-Back Validation (AI Integration)

- [x] 3.1 Create a new AI prompt/endpoint handler (e.g., in `cloudflareService.ts` or equivalent) specifically for `reviewArtifact`. It must accept the original strategic constraints and the pasted code.
- [x] 3.2 Implement the Actor-Critic prompt template for the reviewer, ensuring it asks for dimension-specific checks (UX, Stack, Constraints).
- [x] 3.3 Connect the validation endpoint to Step 3 of the Wizard. Render the AI's feedback, highlighting violations or actionable corrections.

## 4. Integration & Polish

- [x] 4.1 Add a "Generate UI Code" (or similar) trigger button in the main product dashboard or feature views that opens the `StrategyToCodeWizard`.
- [x] 4.2 Ensure that completing the Handoff step dispatches a state update to save the `GeneratedPromptMeta` to the Zustand/Firestore store.
- [x] 4.3 Test the full flow manually to ensure state doesn't bloat and the UX feels seamless and magical.
