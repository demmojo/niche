## Context

The Rapid PDLC Workflow aims to generate highly optimized system prompts for external visual code generators (like v0 or Bolt) directly from NicheAI's internal data model (JTBDs, Value Factors, Competitor Flaws). To ensure performance and avoid massive API costs, prompt assembly must happen client-side. We also need a mechanism to validate the generated code against the original product strategy.

## Goals / Non-Goals

**Goals:**

- Generate fully structured (CO-STAR) markdown prompts instantly and for free on the client.
- Provide a seamless UX to copy the prompt or download it as a `.md` or `.tsx` file.
- Provide a validation step ("Loop-Back") to analyze pasted generated code for strategic and UX compliance.
- Keep the Firestore `MyProductData` document payload small to avoid hitting the 1MB limit.

**Non-Goals:**

- Build an internal visual code generator inside NicheAI (we are delegating this to v0/Bolt).
- Store massive raw prompt strings and 10k-line generated code artifacts directly in the Firestore document.

## Decisions

**1. Unified Stepper UI (`StrategyToCodeWizard.tsx`)**

- **Decision**: Combine the Prompt Exporter and Artifact Reviewer into a single multi-step wizard rather than disjointed modals.
- **Rationale**: Based on UX best practices, splitting the flow fractures the user journey. A stepper (1. Configure -> 2. Handoff -> 3. Validate) provides continuous context.
- **Alternatives Considered**:
  - _Separate Modals_: Rejected because the user would have to discover the validation tool separately after leaving the app to use v0.dev.

**2. Client-Side Prompt Assembly (`promptAssembler.ts`)**

- **Decision**: Abstract all prompt template building into a pure utility function that formats CO-STAR data (using rigid brackets like `[CONTEXT]`, `[CONSTRAINTS]`) client-side without LLM calls.
- **Rationale**: Eliminates API cost for generation, guarantees instant responsiveness, and keeps the React components clean (Single Responsibility Principle).
- **Alternatives Considered**:
  - _LLM Prompt Generation_: Rejected due to unnecessary cost and latency for a deterministic string concatenation task.

**3. Lightweight Prompt Metadata Storage**

- **Decision**: Store only lightweight metadata (`GeneratedPromptMeta`) in `MyProductData.generatedPrompts` (e.g., id, timestamp, scope, stack, status). Raw prompt content will be generated dynamically or stored in ephemeral local storage.
- **Rationale**: Firestore documents have a 1MB limit. Storing raw 3,000-word prompts and pasted code directly in `MyProductData` introduces high risk of state bloat and performance degradation.
- **Alternatives Considered**:
  - _Storing raw prompts in `MyProductData`_: Rejected due to risk of quota/size errors on Firestore syncs.

**4. Actor-Critic Validation Pattern**

- **Decision**: The Loop-Back validation (`ArtifactReviewer`) will use specific dimension-based checks (Constraint Check, Stack Check, UX Check) and evaluate the code against the original prompt constraints.
- **Rationale**: An AI reviewing generic code often falls into an "Agreeableness Bias." Explicit dimension checks prevent the AI from rubber-stamping bad code.

## Risks / Trade-offs

- **Risk: AI Context Window Limits (Validation Step)** -> Users pasting massive code artifacts into the Loop-Back validator could exceed token limits.
- **Mitigation**: Use models with large context windows (e.g., `gemini-1.5-pro` or `claude-3-5-sonnet`) and place strategic constraints at the _beginning_ and _end_ of the prompt to avoid the "lost in the middle" phenomenon. Add a sensible character limit to the paste input.
