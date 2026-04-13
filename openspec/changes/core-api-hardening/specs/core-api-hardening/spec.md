# Spec: Core API Hardening

## Detailed Features & Scenarios

### 1. API Routing and DTOs

- **Scenario:** Strict Payload Validation
  - **WHEN** the Controller receives a request
  - **THEN** it MUST perform explicit payload stripping to a strict DTO using Zod `.strip()`
  - **AND** it MUST NOT evaluate any URL-based `mock_auth` flags.

### 2. Identity & Authentication Hardening

- **Scenario:** Auth Channel Exclusivity
  - **WHEN** a client sends both a Bearer token and a session Cookie
  - **THEN** the backend MUST evaluate only the Bearer token
  - **AND** actively sanitize the request by explicitly deleting the authentication cookie if ignored.
- **Scenario:** Context Pollution
  - **WHEN** a `workspaceId` is provided in multiple conflicting input channels
  - **THEN** the normalization logic MUST reject the request with a `400 Bad Request`.

### 3. Rate Limiting & Graceful Management

- **Scenario:** Mobile Network Token Refund
  - **WHEN** a generative stream disconnects early before a 10% payload delivery threshold
  - **THEN** the backend heuristic MUST automatically refund the token to avoid double-jeopardy.
- **Scenario:** Redis Unreachable Fallback
  - **WHEN** Redis is unreachable during rate limiting
  - **THEN** apply a strict fail-closed circuit breaker
  - **AND** explicitly DO NOT fall back to an in-memory `lru-cache`.

### 4. Generative Route Security

- **Scenario:** SSE Payload Segmentation
  - **WHEN** an emitted SSE chunk exceeds 64KB
  - **THEN** segment it using a character/token-aware parser before JSON serialization to prevent UTF-8 bisection.
- **Scenario:** Stream Resilience (Die on Disconnect)
  - **WHEN** `req.on('close')` is triggered
  - **THEN** an `AbortController` signal MUST kill the LLM provider SDK operations.

### 5. Input Validation

- **Scenario:** ReDoS Prevention
  - **WHEN** defining Zod schemas for strings
  - **THEN** enforce hard string length limits `.max()` BEFORE any regex validation occurs via `.pipe()`.
