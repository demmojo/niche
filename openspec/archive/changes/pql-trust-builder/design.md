# Design

## Context

We are addressing frontend layout thrashing during fast network streams, dangerous IDOR vulnerabilities in account merging, and heavy backend vector math computations during ideation validation.

## Goals

- Safely link anonymous user artifacts to permanent accounts.
- Provide Operational Transparency to users during AI generation.
- Prevent AI prompt injection and unintended niche pivots.

## Non-Goals

- Rewriting the underlying Gemini embedding models.
- Replacing the Firebase Authentication provider entirely.

## Decisions

- **Animation Queueing**: Decouple React animations from network speed. Queue the accordion steps (`onAnimationComplete`) so DOM elements don't jump.
- **Math Optimization**: Replace `Math.sqrt` and `Math.pow` with loop-unrolled squared orthogonal distance checks (`1 - (cosSim * cosSim)`) for V8 performance.
- **Memory Safety**: Avoid shared `Float32Array` scratchpad pools to prevent concurrent memory corruption.
- **Dual-Token Auth Flow**: Prioritize client-side `linkWithPopup`. Fallback to passing BOTH anonymous and permanent JWTs to the backend for cryptographic verification before merging.
- **State Management**: Use explicit State Machine symbols (`STATE_IDLE`, `STATE_MERGING`, `STATE_ERRORED`) instead of fragile boolean refs.

## Risks & Trade-offs

- **Risk**: Dual-token backend merge could fail mid-process. **Mitigation**: Use idempotent background workers (Async Job Queue) via `runTransaction` with paginated limits to reparent artifacts safely.

## Future Potential

- The decoupled Trust Builder animation queue can be reused for all AI generation states across the platform.
