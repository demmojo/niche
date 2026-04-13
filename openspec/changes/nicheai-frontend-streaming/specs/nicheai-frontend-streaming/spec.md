# Specification: Streaming & AST Execution

## Detailed Features

### 1. Vercel AI SDK Integration & State

- **Stream Control:** Vercel AI SDK's `useChat` / `useCompletion` exclusively owns stream state natively. Zustand or Context are strictly forbidden for generative state.
- **Hook Encapsulation:** Wrap primitive SDK calls in `useNicheGenerativeStream`.
- **Mid-Stream Validation:** Validate Vercel SDK `data` stream payloads via Zod `.safeParse()`. Track the "high-water mark" via `useRef` to process only new chunks.

### 2. Main-Thread Optimizations & AST Pipeline

- **Throttling:** Throttle Markdown AST updates to 100-200ms.
- **Sanitization:** Use `react-markdown` with `rehype-sanitize` to explicitly strip dangerous nodes (`<script>`, `<iframe>`, `<object>`, `<svg>`).
- **URL Allowlisting:** Enforce a `urlTransform` allowlist (`http:`, `https:`, `mailto:`); block `data:` and `blob:` URIs.
- **Virtualization constraints:** Use `@tanstack/react-virtual` only on _completed_ historical chat messages. Actively streaming chunks must not be virtualized.

### 3. Backend Contracts & Dead Letter Handling

- **Circuit Breaker:** A backend streaming proxy enforces a hard byte/token circuit breaker. If exceeded, it actively terminates the pipeline with an error chunk.
- **Dead Letter Timeout:** Relies on deterministic backend fetch (`GET /api/generation/{id}/status`) upon tab foregrounding to confirm job state, bypassing local OS clocks.

## Scenarios

- **WHEN** a payload packet received mid-stream fails Zod validation (e.g., hallucinated comma)
  **THEN** explicitly drop the malformed packet, silently swallow the error, log it, and gracefully continue the stream without crashing the effect loop.

- **WHEN** the user backgrounds a mobile tab and returns later
  **THEN** tear down zombie TCP controllers, do NOT render a blocking overlay, fetch completed state via standard Firestore `updatedAt` / `onSnapshot` listener, and display a non-blocking background sync toast.

- **WHEN** a generation exceeds the maximum allowed token budget
  **THEN** the backend proxy hard-terminates the pipeline and replaces the tail with a structured error chunk instead of depending on the LLM to halt.
