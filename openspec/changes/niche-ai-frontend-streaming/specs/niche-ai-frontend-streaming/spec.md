# Spec: Frontend Streaming Architecture

## Detailed Features

### 1. Interactive Generative UI

Frontend tools maps LLM function calls (via Vercel AI SDK `toolUI`) to pre-registered React components statically imported into human-owned Layout Shells (e.g., `<AsymmetricalShell>`).

### 2. Stream Resilience & State Rehydration

Implements background-sync resilience logic leveraging `visibilitychange` listeners, tearing down the Vercel AI SDK controller, and triggering rehydration from a deterministic `onSnapshot` Firestore listener.

### 3. Zod-based Mid-Stream Validation

A zero-trust index tracker mechanism validates structured objects in the stream via `.safeParse()`. Drops bad packets safely without killing the active stream loop.

### 4. AST Security & Chunk Throttling

Utilizes `rehype-sanitize` to filter dangerous HTML nodes (`<script>`, `<iframe>`, `<object>`), block `data:`/`blob:` URIs, and throttle UI state updates using a decoupling ingestion buffer yielding at 100-200ms intervals.

## Scenarios

**Scenario 1: Handling a mobile tab switch during generation**

- **WHEN** a user backgrounds the app during an active generation and returns later.
- **THEN** the UI drops the zombie TCP connection, skips blocking overlays, makes a lightweight `GET /api/generation/{id}/status` fetch, and seamlessly rehydrates state via the `onSnapshot` database update.

**Scenario 2: Malformed payload packet in data stream**

- **WHEN** the SDK `data` stream receives a payload missing a bracket or comma due to an LLM hallucination.
- **THEN** Zod `.safeParse()` catches the invalid chunk, silently drops the malformed packet, logs an error, and the generation continues without unmounting the React tree.

**Scenario 3: Rapid microscopic stream chunks**

- **WHEN** the backend pumps SSE stream tokens extremely fast.
- **THEN** the decoupled chunk ingestion buffer catches the tokens, batches them, and triggers an AST react state update strictly every 100-200ms to preserve main-thread framerate.

**Scenario 4: Harmful content injected in markdown**

- **WHEN** the LLM hallucinates an `<iframe>` or `javascript:` link.
- **THEN** the `react-markdown` AST renderer strips the `iframe` via `rehype-sanitize` and safely sanitizes the link via an explicitly allowed `http/https/mailto` `urlTransform` function.
