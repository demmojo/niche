---
title: NicheAI MLP PLG Refactor
status: draft
author: Product Strategist
date: 2026-04-10
dependencies: ["superadmin-pipeline-gtm"]
---

# Proposal: NicheAI MLP PLG Refactor

## Why

The current NicheAI MLP implementation suffers from architectural vulnerabilities, UX friction, and security gaps that undermine the "Reverse Demo Hook" PLG strategy. Specifically, we have identified Denial of Wallet (DoW) risks on global rate limits, offline UI freezes for superadmins, "ghost auth" cross-device failures with Magic Links, and generic "AI slop" aesthetics that erode trust.

## What Changes

This refactor overhauls the frontend PLG flow and hardens the backend architecture to support secure, scalable, and high-fidelity user experiences. It shifts global rate-limiting to robust counters, implements secure Firebase Magic Links with cross-device persistence, hardens Server-Sent Events (SSE) with `AbortController`, and completely revamps the UI to enforce "Explainable States" and ban generic AI aesthetics.

## Capabilities

### Modified Capabilities

- `roast-my-niche-entry`: Replaced single-document rate limiting with Redis INCR or Firestore Distributed Counters. Decoupled waitlist logic and integrated AbortControllers.
- `secure-report-delivery`: Upgraded from simple email capture to robust Firebase Magic Links (Email Link Auth) handling cross-device persistence.
- `my-reports-dashboard`: Redesigned with a master-detail/accordion layout, dark mode theme, explicit loading states, and visibility for 'pending' reports.
- `superadmin-queue`: Fixed offline UI freeze by ordering state updates before `setDoc` merges and optimizing React 19 concurrent rendering.

## Impact

This impacts the public entry point (`/roast-my-niche`), the authenticated user dashboard (`/my-reports`), the superadmin queue (`/admin/pending-roasts`), and the core LLM streaming backend (`src/server/sse.ts`, `src/server/llmRoutes.ts`). It extends the `superadmin-pipeline-gtm` spec.
