# Specification

## Feature 1: Trust Builder Loading Screen

- **Scenario 1: Standard AI Generation**
  - **WHEN** the user submits an idea,
  - **THEN** the UI progressively streams real market data via `useSyncExternalStore` hoisted outside Suspense boundaries.
- **Scenario 2: Network exceeds Animation Speed**
  - **WHEN** backend chunks arrive faster than CSS animations (e.g., < 300ms),
  - **THEN** queue the steps and do not render Step 2 until Step 1 fires `onAnimationComplete`.
- **Scenario 3: Instant Generation Fast-Forward**
  - **WHEN** backend finishes instantly,
  - **THEN** drain the queue and instantly mount the final UI to avoid holding the user hostage.

## Feature 2: Idea Preservation Override

- **Scenario 1: Niche Idea near a Tarpit**
  - **WHEN** a user's idea is hyper-niche but semantically close to a saturated tarpit,
  - **THEN** use the unrolled squared distance check to verify uniqueness,
  - **THEN** trigger a System Override to bypass standard semantic clustering and preserve the user's idea.

## Feature 3: Reverse Demo PQL Gate

- **Scenario 1: PQL Presentation**
  - **WHEN** generation is complete for an unauthenticated user,
  - **THEN** render the artifact behind a blurred/gradient overlay with possessive microcopy.
- **Scenario 2: Primary Account Link**
  - **WHEN** the user authenticates,
  - **THEN** attempt `linkWithPopup` to retain the UID natively with zero backend writes.
- **Scenario 3: Fallback Account Link**
  - **WHEN** `auth/credential-already-in-use` is thrown,
  - **THEN** sign the user into their existing account, verify dual JWTs on the backend, and trigger an idempotent artifact reparenting batch job.
