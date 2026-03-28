---
topic: Intent-Based Testing & AI Race Conditions
date: 2026-03-27
status: completed
---

# Brainstorm: Intent-Based Testing & AI Race Conditions

## What We're Building

We are addressing critical architectural bugs (specifically UI race conditions and state sync issues during AI Ideation) and establishing an **Intent-Based Testing** safety net. The primary focus is ensuring that the core "AI Analyze" user flows are robust, cannot be spammed into a broken state, and recover gracefully from timeouts or errors.

## Why This Approach

Instead of over-engineering a complex `AbortController` system or migrating the entire app to React 19 `useActionState`, we are adopting a pragmatic, UI-first safeguard.

By aggressively locking (greying out) the AI action buttons during processing and coupling them with a strict timeout, we prevent the user from creating race conditions in the first place. If the backend hangs, the UI safety net catches it, displays a warning, and allows the user to retry. This approach is highly testable using Intent-Based Testing (React Testing Library + MSW or Playwright) because we can explicitly assert the DOM's `disabled` state and the appearance of the timeout warning.

## Key Decisions

1.  **The "Safe Timeout" UI Lock:**
    - When a user clicks an AI action (e.g., "Analyze"), the button immediately enters a disabled, visually "greyed out" state.
    - A deterministic timeout (e.g., 15-30 seconds, depending on the LLM task) is started.
2.  **Graceful Recovery & Warnings:**
    - If the backend returns an error, the button is re-enabled, and the specific error is surfaced to the user.
    - If the "Safe Timeout" is reached before the backend responds, the UI assumes a silent failure/hang. The backend request is ignored/aborted, the button is re-enabled, and a timeout warning ("Analysis took too long. Please try again.") is displayed.
    - _Refinement:_ We will also log these timeout events to our analytics/telemetry so we can monitor if specific LLM models are failing silently in production.
3.  **Intent-Based Testing Strategy:**
    - We will write tests that simulate the _intent_ of the user: "I click analyze, I wait, and I expect a result or a clear error."
    - We will use Mock Service Worker (MSW) and React Testing Library in Vitest to simulate a hanging API request (e.g., delaying the response infinitely) and assert that the UI correctly unlocks and shows the timeout warning via `getByRole` after the designated safe period.

## Resolved Questions

- _How do we handle concurrent AI clicks?_ We prevent them entirely via a strict UI lock.
- _What happens if the backend silently drops the request?_ The frontend "Safe Timeout" acts as a circuit breaker, unlocking the UI and warning the user so they are not permanently stuck.

## Next Steps

Proceed to `/workflows:plan` to define the technical implementation of the `useSafeAITask` hook (or equivalent) and the specific MSW/RTL tests to cover this journey.
