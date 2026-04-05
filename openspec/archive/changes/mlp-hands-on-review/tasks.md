# Tasks: MLP Deep Hands-On Product Review

## Phase 1: Anonymous / PLG Flow Implementation

- [x] Conduct the 60-Second TTV Test for a cold user.
- [x] Validate anonymous stream visual separation (blurred Tarpit Score vs. clear JTBDs).
- [x] Implement "Anonymous Tarpit Handling" active pushback for broad ideas.
- [x] Restrict initial enrichment form to 3-5 fields maximum.
- [x] Implement "Explainable States" (low-latency trust anchors with `aria-live="polite"`).
- [x] Enforce 4000-character local truncation and Zod schema validation on backend.
- [x] Integrate Firebase AppCheck on `ZeroFrictionEntry`.
- [x] Build the "Rate Limit Upsell UX" (optimistic state vs. 429 error).
- [x] Test Adversarial/Junk Inputs to ensure LLM tokens are protected.

## Phase 2: Auth Transition Review

- [x] Implement `pql_gate` SSE event to halt execution just before Tarpit Score calculation.
- [x] Configure `isMergingRef` to pause `onAuthStateChanged` UI updates during account linking.
- [x] Implement auto-resume functionality for streams post-OAuth completion.
- [x] Handle `auth/popup-closed-by-user` safely via Error Boundaries.
- [x] Implement native Firestore TTL (`expiresAt`) for anonymous session records.
- [x] Build backend `runTransaction` claim-check migration for `auth/credential-already-in-use` collisions.

## Phase 3: Authenticated Workspace Review

- [x] Replace empty states in `ideation` and `rapid-pdlc` with opinionated wizards.
- [x] Refactor UI to adhere to 7±2 Rule; hide dense data in `<details>`/`<Accordion>`.
- [x] Set `#root { position: relative; z-index: 0; }` and use `@radix-ui/react-tooltip` Portal for safe z-indexing.
- [x] Implement HITL binary (Keep/Discard) triage in `StrategyToCodeWizard`.
- [x] Create Zero-Data State fallbacks for Exa competitor searches.

## Phase 4: AI UX & Performance Stress Test

- [x] Implement `AbortController` cancellation for rapid tab switching.
- [x] Wire up `req.on('close')` in Express BFF to terminate disconnected LLM calls.
- [x] Separate contexts into `WorkspaceStateContext` and `WorkspaceDispatchContext`.
- [x] Validate keyboard accessibility (Tab/Shift+Tab) and focus trapping in modals.
- [x] Add pre-stream skeleton sizing to container to prevent Layout Shifts (Anti-CLS).
- [x] Update Cloud Run workers to write to `draftData` subcollections before atomic promotion.
- [x] Add explicit `<Dialog.Title>` and `<Dialog.Description>` to `CompetitorDiscoveryModal`.
- [x] Verify PLG funnel telemetry events (`plg_input_submitted`, `teaser_stream_complete`, `pql_gate_viewed`, `auth_initiated`).
