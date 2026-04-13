# Proposal: Core API Hardening

## Why

As NicheAI scales to support high-throughput AI features and generative streaming, the underlying Node.js API, authentication boundaries, and infrastructure must be hardened against modern attack vectors.

## What Changes

Isolates all deep backend, security, cryptography, and infrastructure refactoring tasks, decoupling them from frontend UI workflows. Replaces legacy `/v1/` compatibility with strict DTOs and eliminates over-engineered fallback mechanisms.

## Capabilities

Enforces strict DTO validation, stateless signature validation, SSE strict JSON encoding, context pollution defenses, and token-quota graceful refunds.

## Impact

Ensures a secure, lean, Minimum Lovable Product (MLP) architecture that prevents DoS vulnerabilities, SSRF, prototype pollution, prompt injection, and protocol injection.
