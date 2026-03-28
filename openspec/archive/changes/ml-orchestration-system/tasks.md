# Tasks: ML Orchestration and Prompt System

## Phase 1: Security & Foundation (InstruCoT)

- [x] Implement utility to sanitize user inputs (strip `<` and `>` characters).
- [x] Create base Zod schema wrappers that enforce the `securityAnalysis` pre-flight properties (`containsRoleConfusion`, `containsCommandOverrides`, `reasoning`).
- [x] Update all prompt generation functions to use the CO-STAR framework and inject sanitized variables inside `<user_input>` XML tags.
- [x] Integrate `rehype-sanitize` for AST sanitization of Markdown fallbacks.

## Phase 2: Core Routing & Configuration (CQB & Firestore)

- [x] Create `ml_configs` Firestore collection utilizing SCD Type 2 architecture.
- [x] Implement `MLConfigCache` singleton using `onSnapshot` with `where('status', '==', 'champion')`.
- [x] Add explicit `unsubscribe()` hooks to the application SIGTERM lifecycle to prevent memory leaks.
- [x] Implement `mabWeightsCache` for in-memory model routing.
- [x] Set up `p-queue` for async telemetry buffering into the `mab_telemetry_buffer` collection.
- [x] Create a 5-minute background cron worker to aggregate telemetry and update CQB distribution weights.

## Phase 3: The Pairwise Arena (Validation Engine)

- [x] Scaffold the Async Worker for Tri-Modal evaluation against `gold_standard_evals`.
- [x] Implement deterministic scoring layer (verifying against expected Zod schema).
- [x] Implement semantic scoring using an Object Pool of `Float32Array` scratchpads and `setImmediate` chunking to prevent V8 blocking.
- [x] Implement Head-to-Head Pairwise Comparison prompt for `gemini-3.1-pro-preview` (blinded A/B grading).
- [x] Implement the Binomial Sign Test calculator logic (Challenger must win > 55%, $p < 0.05$).
- [x] Write the `firestore.runTransaction()` logic to archive the old Champion and promote the new one.

## Phase 4: Secure Data Flywheel

- [x] Implement `raw_eval_staging` collection with a 24-hour strict TTL policy.
- [x] Build Hybrid Tokenization pipeline: Regex step + `gemini-3.1-flash-lite-preview` rewriting step.
- [x] Write worker to process staging items, run tokenization, and insert into `gold_standard_evals`.
- [x] Secure `gold_standard_evals` via Firestore Security Rules (deny external access, allow internal workers).
- [x] Implement intent-based MSW (Mock Service Worker) tests to verify fallback routing and exponential backoff.
