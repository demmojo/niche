# Security Audit Report: Sovereign Blob Reference Protocol (SBRP)

## Executive Summary

A comprehensive security review of the Sovereign Blob Reference Protocol (SBRP) specifications (`RFC.md`, `execution-plan.md`, `PR.md`, and `technical-audit.md`) has been conducted. The audit focused on input validation, Auth/AuthZ bypasses, Stored XSS, SSRF, Hash DoS, and general OWASP compliance.

While the protocol includes strong defensive architecture (e.g., prototype pollution prevention, 202 async ingestion, JSX escaping, SSRF domain whitelists), several critical omissions were identified in input validation bounds and AuthZ enforcement for Pre-Signed URLs.

---

## 🛑 Critical Severity

### 1. Missing Input Validation on `sbrp.blob_reference.checksum` (Input Validation / Regex DoS)

**Description:** In the OTel YAML specification (`PR.md`), `sbrp.blob_reference.checksum` is declared as a `string` but entirely lacks a `validation` block. This contrasts with `blob_id` and `storage_route.alias`, which enforce strict regex patterns and length boundaries.
**Exploit Scenario:** A malicious Compute Plane could inject a multi-megabyte string into the `checksum` attribute. Since the OTel JSON payload is parsed synchronously upon ingress, a massive string causes memory exhaustion, Event Loop Starvation, and potential database truncation errors before the background worker even attempts to process the blob.
**Remediation:**

- Add a strict validation block enforcing a 64-character maximum length and a hexadecimal regex pattern (e.g., `pattern: "^[a-fA-F0-9]{64}$"` and `max_length: 64`).

### 2. Missing AuthZ on Pre-Signed URL Generation Endpoints (Broken Access Control / IDOR)

**Description:** Section 2.3 mandates that "Observability UIs MUST use a read-only Pre-Signed GET URL" and mentions "Pre-Signed POST requests MUST include [policies]". However, the specifications completely omit the authentication and authorization contracts for the backend API endpoints responsible for generating these URLs.
**Exploit Scenario:** If the endpoint that generates the Pre-Signed GET URL accepts a `blob_id` without enforcing strict tenant ownership (`authenticated_user_tenant_id === target_blob.tenant_id`), an attacker can perform a Cross-Tenant IDOR to generate valid, signed download URLs for another tenant's highly sensitive LLM telemetry data.
**Remediation:**

- Explicitly specify that all API endpoints generating Pre-Signed URLs (GET/POST) MUST assert strict tenant authorization against the database record before cryptographic signing.

---

## ⚠️ Warning Severity

### 3. Incomplete Hash DoS Mitigation (Memory Exhaustion / OOM)

**Description:** Section 2.4 states that workers MUST "verify the `sbrp.blob_reference.checksum` (if provided) using non-blocking cryptographic hashing to prevent event loop starvation."
**Exploit Scenario:** "Non-blocking" merely implies asynchronous execution. If the worker downloads a 250MB payload entirely into a memory buffer before performing the asynchronous hash, concurrent background workers will trigger severe runtime memory utilization exhaustion (OOM) and GC thrashing, bypassing the intended "Strict Concurrency Limits" controls.
**Remediation:**

- Explicitly mandate **streamed, chunk-based cryptographic hashing** (e.g., piping the HTTP response stream directly into a hash stream API) rather than buffering uncompressed payloads into memory prior to hashing.

### 4. Missing Scheme Enforcement for Legacy URIs (SSRF / Parser Differential)

**Description:** Section 2.1 mitigates SSRF by restricting Legacy URIs to a "pre-populated allowlist of trusted domains" and an "RFC 3986 URL pattern."
**Exploit Scenario:** RFC 3986 encompasses dangerous schemes (e.g., `http://`, `file://`, `ftp://`, `gopher://`). Even with exact-match domain checking, failing to restrict the scheme can expose the backend fetch client to protocol smuggling, plaintext downgrade attacks, or Parser Differential SSRF bypasses.
**Remediation:**

- Update the protocol to strictly mandate the `https://` scheme for all Legacy URIs prior to domain extraction and whitelist matching.

### 5. Missing CORS Policy Constraints on Tenant Blob Storage Buckets (Data Exposure)

**Description:** The specification mitigates Stored XSS by injecting `response-content-type=application/json` into the Pre-Signed GET URL signature and enforcing origin-isolated sandbox domains. However, it fails to specify CORS policies for the storage buckets.
**Exploit Scenario:** If a tenant's Blob Storage bucket is configured with wildcard CORS (`Access-Control-Allow-Origin: *`), malicious third-party websites could leverage a leaked Pre-Signed URL to fetch and read the telemetry data directly from the browser.
**Remediation:**

- Mandate that Blob Storage buckets MUST enforce strict CORS policies, restricting `AllowedOrigins` strictly to authorized Observability UI domains.

---

## 📝 Note Severity

### 6. No Edge Rate Limiting on "Sinked" Legacy URIs (Resource Exhaustion)

**Description:** Unlisted Legacy URIs are gracefully "sinked" (dropped server-side, returning `200 OK`) and emit a custom metric (`sbrp.security.ssrf_sink_count`).
**Exploit Scenario:** While returning `200 OK` prevents benign legacy SDKs from infinitely retrying, an attacker could intentionally flood the ingress edge with unlisted URIs. Generating metrics and parsing JSON for millions of dropped requests could cause CPU starvation at the ingress proxy layer.
**Remediation:**

- Ensure generic IP-based or Tenant-based L7 rate limiting applies globally before the payload reaches the SBRP application layer parsing/sinking logic.

### 7. UUIDv7 Collision/Squatting (Denial of Service)

**Description:** Section 2.2 enforces `INSERT ON CONFLICT (blob_id) DO NOTHING` to guarantee idempotency.
**Exploit Scenario:** While extremely unlikely due to the 74-bit entropy of UUIDv7, if an attacker could observe or predict a legitimate tenant's `blob_id` before ingestion, they could submit a fake OTel span with that ID. The legitimate span would subsequently be dropped due to `DO NOTHING`, causing localized data loss for the victim.
**Remediation:**

- No immediate architectural change is required given the high entropy of UUIDv7, but this theoretical risk should be documented in the threat model.

## Security Mandate

Legacy payloads containing any CRLF sequences MUST trigger an immediate HTTP 400 rejection across all implementations to prevent HTTP Response Splitting.
