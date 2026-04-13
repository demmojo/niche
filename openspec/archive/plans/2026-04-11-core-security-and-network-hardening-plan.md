---
title: Security & Infrastructure - Core Network Hardening and API Contracts
status: draft
dependencies: []
refactors: []
---

# Proposal: Security & Infrastructure - Core Network Hardening and API Contracts

## Context & Objective

As NicheAI scales to support high-throughput AI features and generative streaming, the underlying Node.js API, authentication boundaries, and infrastructure must be hardened against modern attack vectors. This plan isolates all deep backend, security, cryptography, and infrastructure refactoring tasks, decoupling them from frontend UI workflows to ensure a focused, reviewable implementation. The architecture strictly follows the Minimum Lovable Product (MLP) philosophy, rejecting over-engineered enterprise patterns (e.g., complex Redis blocklists or legacy versioning) in favor of lean, robust constraints.

## Architectural Integrity & Design Decisions

- **Lean API Contracts:** For an MLP, do not over-engineer legacy `/v1/` compatibility. We will enforce strict, dropped-key data transfer objects (DTOs) and standardized error envelopes across the board. If the contract changes, we break it explicitly rather than maintaining complex backward compatibility.
- **Fail-Safe Availability & Stateless Auth:** Explicitly reject maintaining a complex custom Redis JWT revocation blocklist, as it introduces a DoS vulnerability (failing open) or availability risks (failing closed). Instead, rely on short-lived JWT expiries (e.g., 15 minutes) and offline stateless signature validation to verify tokens.
- **Protocol Security:** All Server-Sent Events (SSE) must be strictly JSON-encoded to mathematically prevent CRLF protocol injection.

## Execution Tasks

- [ ] **Task 1: Strict API Routing and DTOs**
  - **Payload Validation:** The Controller MUST perform explicit payload stripping at the perimeter to accept only a strictly typed Data Transfer Object (DTO) using a Zod schema (`.strip()`). Remove URL-based `mock_auth` flags entirely.
  - **Testing:** For E2E testing, rely on cryptographically signed test tokens (e.g., Firebase Custom Claims with `isE2ETest: true`) or Playwright injecting legitimate test cookies directly into the browser context, ensuring E2E smoke tests can safely run against true production builds without creating environment-gated backdoors.

- [ ] **Task 2: Identity & Authentication Hardening**
  - **API Key Hashing:** Strictly mandate HMAC-SHA256 with a system-wide pepper for all API key hashing. Explicitly reject backwards-compatibility mechanisms.
  - **Channel Exclusivity:** Enforce strict mutual exclusivity on authentication channels for ALL routes. The backend MUST evaluate _only_ the Bearer token if present, explicitly ignoring the session Cookie for authentication purposes. The CSRF middleware MUST completely bypass evaluation if a valid `Authorization: Bearer` header is present. Only evaluate Double-Submit cookies for explicitly exempted browser routes relying on session cookies. In explicitly exempted browser cases, if the Cookie is ignored, the perimeter middleware MUST actively sanitize the request by explicitly deleting the authentication cookie (`delete req.cookies.auth`).
  - **Context Pollution:** The normalization logic MUST explicitly reject requests with `400 Bad Request` where `workspaceId` is provided in multiple conflicting input channels.
  - **CSRF:** Migrate CSRF Double-Submit cookies to use the `__Host-` prefix if sharing the exact same origin. If operating across subdomains, explicitly transition to a Backend-BFF architecture using `SameSite` cookies.

- [ ] **Task 3: Rate Limiting & Graceful Token Management**
  - **Token Quota UX & Graceful Refunds:** If a stream disconnects early (e.g., mobile micro-drop) before a meaningful threshold (e.g., 10%) of the payload is delivered, implement a backend heuristic to automatically refund the token. This prevents instant user frustration on flaky mobile networks (financial double-jeopardy). If the drop occurs later, the token is spent.
  - **Sequential Logic:** Enforce strict sequential ordering. Authorization MUST be `await`ed and resolved _before_ any Rate Limit Token Bucket is queried or decremented.
  - **Availability Fallback:** If Redis (used for rate limiting) is unreachable, apply a strict fail-closed circuit breaker policy for generative endpoints. Do NOT fall back to an in-memory `lru-cache` for rate limiting, as this multiplies the limit across horizontal Cloud Run instances, creating a massive distributed DoS vector.

- [ ] **Task 4: Generative Route Security & SSRF Mitigation**
  - **SSE Protocol Injection:** For ALL generative output streams, the backend MUST emit strictly JSON-encoded payloads per discrete event. Enforce a hard 64KB threshold per emitted SSE chunk. Crucially, if a chunk exceeds this, segment it using a character/token-aware parser before JSON serialization. Do NOT slice at raw byte boundaries, which bisects multi-byte UTF-8 characters and JSON escape sequences, corrupting the payload.
  - **Stream Resilience (Die on Disconnect):** You MUST bind an `AbortController` to `req.on('close')` and pass its signal deep into the LLM provider SDK to kill expensive operations on disconnect.
  - **Concurrency Locks:** The backend MUST explicitly use structured streaming protocols (e.g., `streamObject` or `dataStream`) rather than raw `streamText`, guaranteeing the frontend receives predictably structured JSON payloads.
  - **SSRF Defenses:** Enforce `https://` URI scheme validation. Explicitly reject over-engineered low-level SNI TLS spoofing (like a custom `undici.Dispatcher`) which introduces severe operational fragility. Instead, implement a strict "do not follow redirects" policy for user-provided URLs to safely mitigate SSRF risks at the MLP stage.
  - **Mid-Stream Error Contract:** If the backend forcibly terminates a stream, it MUST append a standardized stream-terminating error envelope to the Vercel AI SDK data stream before dropping the socket.

- [ ] **Task 5: Input Validation & Payload Security**
  - **Prompt Injection:** Explicitly mandate Semantic Data/Instruction Separation using strict LLM provider APIs (e.g., Gemini's `system_instruction` parameter).
  - **Prototype Pollution:** Configure `express.json` to use a secure parser (e.g., `secure-json-parse`). Reject `application/x-www-form-urlencoded` payloads.
  - **ReDoS:** Zod schemas MUST enforce hard string length limits (`.max()`) BEFORE any regex validation occurs, using `.pipe()`.
