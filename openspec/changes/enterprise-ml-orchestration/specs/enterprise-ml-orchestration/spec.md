# Specification: ML Orchestration and Prompts

## Detailed Features

### 1. Model Tiering System
Tasks are routed not by literal model string, but by an abstract alias tier mapped through `PromptBanditOptimizer`:
- **Tier.LITE (`gemini-3.1-flash-lite-preview`)**: Targeted for high-volume data extraction and structured JSON parsing.
- **Tier.FAST (`gemini-3.1-flash`)**: Targeted as the balanced default workhorse for standard interactions.
- **Tier.PRO (`gemini-3.1-pro-preview`)**: Reserved for complex agentic problem-solving and heuristic LLM-Judge evaluations.

### 2. Prompt Standardization
- All prompt templates must follow **CO-STAR** (Context, Objective, Style, Tone, Audience, Response).
- Schemas enforce extraction leveraging native Zod implementations (e.g., `z.discriminatedUnion()`).
- Judges strictly require explicit XML tag usage and mandatory Chain-of-Thought prior to outputting a final score.

### 3. Execution Layer
- Incoming async tasks trigger an **HTTP 202 Accepted** returning a `jobId`.
- Tasks enqueue in BullMQ, configured for Sandboxed Processors running in decoupled child processes.
- `job.updateProgress()` emits real-time updates for complex reasoning steps.

### 4. Tri-Modal Short-Circuit Waterfall (Eval Engine)
1. **Deterministic**: Parsed against Zod schema. Immediate `0` score if AST fails.
2. **Semantic**: Utilizes `gemini-embedding-001`. Calculates Cosine Similarity with standard dataset using Float32Array scratchpads. Drops if below threshold.
3. **Heuristic**: Uses `Tier.PRO` Pairwise Dueling Bandits with randomized A/B positioning to neutralize verbosity/position bias.

## Scenarios

**Scenario: Initiating a complex reasoning task**
- **WHEN** a client initiates an action mapped to `Tier.PRO`
- **THEN** the system immediately returns an HTTP 202 status containing the generated `jobId`
- **AND** the payload is pushed to the BullMQ Redis queue
- **AND** the client begins an `onSnapshot` subscription to monitor task progress and retrieve the payload.

**Scenario: Submitting an output for automated validation**
- **WHEN** an evaluation job processes an AI output
- **THEN** it first attempts strict JSON parsing via Zod AST
- **AND** if syntax parsing fails, the system immediately returns a score of 0, bypassing Embedding and LLM Judge API calls entirely.

**Scenario: Promoting a successful prompt Challenger**
- **WHEN** an active Challenger prompt completes its "Gold Standard" evaluation run
- **AND** a Paired Student's t-test calculation returns a `p-value < 0.05` vs the Champion
- **THEN** the system executes `firestore.runTransaction()` to atomically archive the current Champion and promote the Challenger.