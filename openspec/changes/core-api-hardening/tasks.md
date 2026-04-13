# Tasks: Core API Hardening

## Phase 1: Routing, Auth, & Contracts

- [x] Enforce Controller payload stripping to strict DTO using Zod `.strip()`.
- [x] Remove all URL-based `mock_auth` flags; rely on signed test tokens for E2E.
- [x] Mandate HMAC-SHA256 with a system-wide pepper for all API key hashing.
- [x] Enforce strict mutual exclusivity on authentication channels (Bearer vs Cookie).
- [x] Implement `400 Bad Request` rejection for conflicting `workspaceId` input channels.
- [x] Migrate CSRF Double-Submit cookies to use `__Host-` prefix or SameSite BFF architecture.

## Phase 2: Rate Limiting & Streaming Security

- [x] Implement early stream disconnect heuristic (< 10%) for automatic token refund.
- [x] Enforce sequential logic: Authorization resolved BEFORE Rate Limit Token Bucket query.
- [x] Implement fail-closed circuit breaker for generative endpoints on Redis unreachable.
- [x] Enforce strict JSON-encoding for ALL generative output streams with < 64KB chunk segmentation.
- [x] Bind `AbortController` to `req.on('close')` to pass kill signal to deep LLM SDK.
- [x] Refactor backend to explicitly use structured streaming protocols (`streamObject` / `dataStream`).
- [x] Implement "do not follow redirects" policy for user-provided URLs to mitigate SSRF.
- [x] Append standardized stream-terminating error envelope to Vercel AI SDK data stream on forced disconnect.

## Phase 3: Payload Validation

- [x] Enforce Semantic Data/Instruction Separation using strict LLM provider APIs.
- [x] Configure `express.json` to use a secure parser (e.g., `secure-json-parse`) and reject `application/x-www-form-urlencoded`.
- [x] Update all Zod string schemas to enforce `.max()` limits before regex `.pipe()` validation.
