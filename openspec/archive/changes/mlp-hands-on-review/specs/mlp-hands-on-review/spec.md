# Specification: MLP Deep Hands-On Product Review

## Phase 1: Anonymous / PLG Flow (The Hook)

- **Teaser Value:** The app immediately delivers an insights stream with visually locked/blurred high-value outputs (e.g., Tarpit Score).
- **Explainable States:** Low-latency trust anchors stream immediately (e.g., "Found 43 competitors...") using `aria-live="polite"`.

**Scenario:** Hitting the anonymous rate limit

- **WHEN** an anonymous user exhausts their allowed idea generation limits
- **THEN** the UI displays an optimistic upsell state ("You're a power brainstormer!") rather than a technical 429 error.

**Scenario:** Adversarial / Junk Inputs

- **WHEN** a user submits gibberish or a prompt injection
- **THEN** the Express backend safely rejects the payload using Zod validation and truncates at 4000 characters without wasting LLM tokens.

## Phase 2: The Auth Transition (The PQL Gate)

- **State Freeze:** The `isMergingRef` state correctly pauses `onAuthStateChanged` to prevent UI flickering ("Snapshot Beats the Fetch").

**Scenario:** OAuth popup closed by user

- **WHEN** a user closes the sign-in popup mid-stream
- **THEN** the system catches `auth/popup-closed-by-user`, prevents a fatal crash, and returns the user to their preserved anonymous state.

**Scenario:** Account Merge Collision

- **WHEN** `linkWithPopup` throws `auth/credential-already-in-use`
- **THEN** the frontend triggers `signInWithPopup`, calls a secure backend Callable Function, and uses `runTransaction` to migrate anonymous data to the existing permanent account.

**Scenario:** Immediate Value Resume

- **WHEN** the OAuth popup successfully resolves
- **THEN** the stream automatically resumes to calculate the locked metrics (Tarpit Score) without requiring a "Generate" click.

## Phase 3: Authenticated Workspace (The Value Delivery)

- **No Blank Canvas:** Users navigate through opinionated wizards instead of open text boxes.
- **Human-in-the-Loop (HITL):** AI output generation breaks into small, binary (Keep/Discard) curation steps.

**Scenario:** Zero-Data State

- **WHEN** the system searches for an impossibly narrow niche yielding 0 Exa results
- **THEN** the UI provides an educational "Get Started" or "Broaden Search" fallback instead of an empty table.

## Phase 4: AI UX & Performance Stress Test

**Scenario:** Fast Click Race Conditions

- **WHEN** a user rapidly navigates between tabs while an AI stream is resolving
- **THEN** the frontend `AbortController` triggers, and the backend `req.on('close')` successfully kills the expensive LLM calls, preventing stale data overwrites.
