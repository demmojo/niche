# Proposal: Tech Debt Remediation

## Why

The NicheAI codebase currently suffers from 'Enterprise-grade' over-engineering that is detrimental to the agility of an MLP. This includes fat controllers, rogue threading/polling, leaked frontend transactions, and outdated testing paradigms.

## What Changes

1. Replace Piscina thread pools with standard BullMQ worker threads.
2. Extract fat controllers (like campaignRoutes.ts) into cohesive domain modules.
3. Secure frontend transactions by moving them to backend API endpoints with Zod validation.
4. Modernize to Express 5 native async routing and React 19 nested transitions.
5. Modernize testing with Firebase Emulator and MSW.

## Capabilities

- Scalable background processing without sandboxing overhead.
- Pure, concurrent-safe vector math.
- Secure, append-only backend data mutations.

## Impact

Achieve a Series A-ready Minimum Lovable Product (MLP) with drastically reduced technical debt, faster and reliable test suites (80-100% coverage), and secure, maintainable API boundaries.
