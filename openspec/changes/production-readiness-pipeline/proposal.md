# Proposal: Production Readiness Pipeline

## Why

The NicheAI architecture needs hardening for its production launch. We face risks such as Denial of Wallet (DoW) attacks on expensive LLM APIs, single-node memory bottlenecks, unstructured log blindness, and inefficient static asset delivery.

## What Changes

- Replace local Node.js memory rate limiting with GCP Cloud Armor at the edge.
- Decouple the React frontend to Firebase Hosting, but route API traffic directly to Cloud Run to bypass CDN buffering timeouts.
- Apply Firebase App Check to public routes and strict OIDC validation for internal Cloud Tasks routes.
- Replace `console.log` with structured `pino` logging.
- Automate CI/CD using GitHub Actions and distroless multi-stage Docker builds.
- Implement hard API quotas to replace delayed budget alert webhooks.

## Capabilities

- Scalable edge rate limiting without stateful dependencies (Redis).
- Uninterrupted Server-Sent Events (SSE) streaming.
- Secure boundaries between public clients, internal microservices, and external attackers.
- Correlated log traces in GCP Log Explorer.
- Automated, zero-downtime deployments.

## Impact

A resilient, observable, and financially protected serverless architecture ready for public scale.
