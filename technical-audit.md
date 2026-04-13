# 🔍 COMPREHENSIVE TECHNICAL AUDIT REPORT

**Date:** April 11, 2026
**Target:** `openspec/plans/2026-04-11-ai-native-frontend-workflow-docs.md`
**Auditors:** Correctness Reviewer, Maintainability Reviewer, Security Sentinel

## Executive Summary

The most recent patches successfully resolved several critical vulnerabilities (BOLA on `/v1/`, Cursor Token Replay, Direct Proxy Spoofing). However, the parallel audit discovered lingering architectural contradictions, performance bottlenecks, and advanced security vectors that remain unaddressed in the current specification.

The overall risk posture remains **HIGH** pending the resolution of these findings.

---

## 🔴 CRITICAL FINDINGS (Action Required)

### 1. Security: Incomplete Mitigation of Cursor Token Replay (Finite Replay Vulnerability)

- **Vulnerability:** The document states that the signed Cursor payload must embed an `exp` claim (e.g., max 5 minutes). This prevents infinite replay, but leaves a 5-minute window for an attacker to replay the token hundreds of times, executing a Financial DoS via token consumption.
- **Remediation:** Enforce **Single-Use Tokens (Nonce)**. The signed Cursor payload MUST include a unique `jti`. Upon consumption, the backend MUST write this `jti` to Redis. If a subsequent request presents a `jti` that exists in Redis, reject it explicitly as a replay attack.

### 2. Security: SSRF TOCTOU via HTTP Auto-Redirects

- **Vulnerability:** IP Pinning after DNS resolution fails to account for HTTP 3xx Redirects. An attacker's external server can respond with a `302 Found` pointing to `169.254.169.254` (metadata server), and standard HTTP clients will automatically follow it, bypassing the IP pin.
- **Remediation:** Explicitly disable automatic redirects (`redirect: 'manual'` in fetch). If redirects are required, intercept the `Location` header, resolve the new host, and recursively pass the new IP through the SSRF blocklist validation.

### 3. Correctness: Contradictory SSE Payload Architecture (Binary vs JSON)

- **Vulnerability:** Line 69 mandates streaming raw bytes WITHOUT JSON encoding (using binary `0x0A` replacement). Line 70 mandates ALL fragmented generative payloads MUST be JSON-encoded. These are mutually exclusive.
- **Remediation:** Choose one. Either enforce strict JSON encoding for all SSE streams, OR stream raw binary buffers and implement a robust buffer-scanning `Transform` stream that safely splices `\ndata: ` without coercing to V8 strings.

### 4. Correctness: Concurrent Mode Tearing via Mutable Ref Array

- **Vulnerability:** Accumulating SSE chunks by mutating an array (`bufferRef.current.push(chunk)`) and triggering React re-renders violates pure rendering rules. This will cause UI tearing if the network pushes a chunk while React has yielded the main thread mid-render.
- **Remediation:** Do not mutate a ref read during render. Accumulate chunks into an immutable array state via `setTokens(prev => [...prev, newChunks])` batched synchronously.

### 5. Correctness: Rate Limit Bypass via Cache Capacity Eviction

- **Vulnerability:** Attempting to prevent distributed rate limit bypass by dividing the fallback `lru-cache` limit by `MAX_CONTAINERS` (e.g. `Math.floor(GLOBAL_LIMIT / MAX_CONTAINERS)`). This incorrectly shrinks the cache capacity (number of users stored), causing instant eviction under load and resetting quotas to zero.
- **Remediation:** Maintain the `lru-cache` max capacity at 10,000. Apply the division strictly to the assigned _Token Bucket quota value_ inside the rate limit check.

### 6. Correctness: Global Error Propagation Breaks Legacy `/v1/` Contracts

- **Vulnerability:** Mandating that the global frontend fetch utility unconditionally intercept `res.ok === false` and `throw` it as an Error breaks legacy `/v1/` components that manually check `res.ok` (e.g., handling 400 Bad Request locally).
- **Remediation:** Restrict the unconditional `throw` behavior exclusively to the `/v2/` API namespace inside the fetch utility.

### 7. Correctness: Token Revocation Redis Desynchronization

- **Vulnerability:** Redis `revokedBefore` blocklist forbids synchronous Firebase reads. If an admin revokes a user's tokens via the Firebase Console, Redis is unaware.
- **Remediation:** Implement a fallback cache-miss check, or document that all revocations MUST route through a custom backend endpoint that updates Redis.

---

## 🟠 HIGH & MODERATE RISK FINDINGS

### 8. Security: HTTP/2 Rapid Reset Susceptibility

- **Vulnerability:** Encouraging unbounded multiplexing exposes the infrastructure to the HTTP/2 Rapid Reset attack (CVE-2023-44487), exhausting server CPU/memory allocating stream state.
- **Remediation:** Explicitly clamp `SETTINGS_MAX_CONCURRENT_STREAMS` (e.g., to 100) at the proxy/load balancer.

### 9. Security: CSRF Double-Submit Cookie Subdomain Forgery

- **Vulnerability:** A standard Double-Submit Cookie is vulnerable if an attacker compromises _any_ subdomain, forcing a forged CSRF cookie for the parent domain.
- **Remediation:** Require the `__Host-` prefix for the CSRF cookie (e.g., `__Host-csrf-token`).

### 10. Security: XSS via CSS Injection (Style Clobbering)

- **Vulnerability:** CSP bans `unsafe-inline` scripts, but not styles.
- **Remediation:** Explicitly mandate `style-src 'self'` in the CSP, and configure DOMPurify/rehype-sanitize to drop all inline `style` attributes.

### 11. Security: TraceId "Scrubbing" Anti-Pattern

- **Vulnerability:** Scrubbing traceIds is an anti-pattern (nested encodings bypass regex).
- **Remediation:** Never sanitize security IDs. Enforce a strict binary outcome: if `traceId` fails exact UUIDv4 regex validation, completely drop the input and assign a new server-side UUID.

### 12. Security: ReDoS / CPU Exhaustion via Frontend Markdown AST

- **Vulnerability:** Extremely nested markdown can trigger exponential algorithmic complexity in the parser.
- **Remediation:** Enforce a maximum parse depth/nesting limit (e.g., depth > 10).

### 13. Maintainability: Architectural Dead Code (Contradictory SSE Massive Data Protocol)

- **Vulnerability:** The plan bans streaming large deterministic JSON payloads over SSE, but immediately dictates complex Web Worker infrastructure for exactly this forbidden scenario.
- **Remediation:** Remove the contradictory Web Worker architecture for JSON delta patching over SSE.

### 14. Maintainability: Premature Abstraction (Incremental Markdown AST Parser)

- **Vulnerability:** Mandating an incremental Markdown AST parser to avoid `.join('')` introduces massive indirection for an unproven performance bottleneck.
- **Remediation:** Remove the mandate for an incremental AST parser for standard markdown streams.

### 15. Maintainability: Naming Obfuscates Intent ('Tail-Rendering')

- **Vulnerability:** Inventing novel terminology ('Tail-Rendering') for standard React `memo` patterns creates cognitive overhead.
- **Remediation:** Use standard terminology (e.g., "memoized list items").

### 16. Correctness: `StringDecoder` Violates Zero-Allocation Buffer Mandate

- **Vulnerability:** Mandating `StringDecoder` for multibyte characters while piping raw `Uint8Array` buffers directly to Response forces string allocation.
- **Remediation:** Handle binary scanning for `0x0A` natively on the `Uint8Array` without decoding to a JS string.

---

**[HITL PAUSE]**

The subagents have identified significant architectural contradictions and security gaps in the current OpenSpec draft.

Would you like me to resolve these issues by applying patches to the OpenSpec document and adding necessary `Execution Tasks` at the beginning of the plan, as you requested?
