# Proposal: Reverse Demo Hook PLG & Enterprise ML Integration

## Why

The current PLG integration automatically chains calls to expensive Pro-Tier API services immediately after the fast analysis, leading to "Denial of Wallet" vulnerabilities where anonymous users can drain API credits. Additionally, the anonymous-to-permanent account merging process introduces fatal "Snapshot Beats the Fetch" race conditions and unbounded Firestore transactions that crash under load.

## What Changes

1. **PQL Compute Gate**: Breaks the automatic Pro-Tier API chain in `ZeroFrictionEntry.tsx`, pushing heavy computation strictly behind authenticated account upgrades.
2. **State Freeze**: Employs an `isMergingRef` to pause the UI from reacting to the new Google UID until the backend finishes merging data.
3. **Iterative Batching**: Refactors Firestore merging in the backend to utilize `limit(500)` batching instead of a monolithic `runTransaction`.
4. **Worker Update Protocol**: Forces strict partial updates (`.update()`) in BullMQ workers to prevent overwriting reparented `userId`s.

## Capabilities

- Provides "Zero-Shot Value" to anonymous users safely using Lite/Fast tier models.
- Gracefully merges anonymous data to permanent accounts without UI crashes or Firestore limit errors.
- Enforces strict compute boundaries across the platform.

## Impact

Secures cloud costs from abusive anonymous loads. Fixes hard crashes during onboarding. Re-establishes >80% test coverage using sophisticated HTTP 202 async worker mocking.
