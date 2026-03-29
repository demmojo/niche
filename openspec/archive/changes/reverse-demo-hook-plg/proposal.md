# Proposal: Reverse Demo Hook PLG

## Why

Currently, users encounter a hard authentication wall before experiencing the core value of the product. This friction leads to a high top-of-funnel drop-off rate. To implement a true Product-Led Growth (PLG) motion, we need a "Reverse Demo Hook" strategy: removing the upfront auth wall, allowing users to experience the "Aha!" moment, and strategically gating high-intent features behind account creation.

## What Changes

1. **Zero-Friction Entry:** We will remove the initial `<AuthScreen />` and replace the multi-step onboarding with a single input: "What are you thinking of building?".
2. **Anonymous Strategy Generation:** All unauthenticated visitors will be transparently assigned a Firebase Anonymous Auth UID. This provides a secure sandbox to run the backend ML pipeline.
3. **Delayed PQL Gate:** The sign-up gate (Product Qualified Lead conversion) will be relocated from early exploration steps (e.g., Tarpit Warning) to high-intent save/deploy actions inside the generated dashboard.
4. **Secure Data Merging:** Implementing a secure transition mechanism using Dual-Token Verification to merge an anonymous user's generated data into a newly created permanent account.

## Capabilities

- **Firebase Anonymous Auth & Account Linking:** Automated assignment of an anonymous UID, with a secure backend merge pipeline via `runTransaction` to prevent data loss.
- **React 19 State Optimizations:** Eliminating initial auth transition UI flicker using `useActionState` and `useOptimistic`.
- **Async ML Orchestration:** Transitioning generation APIs to an asynchronous `202 Accepted` + `jobId` pattern with real-time Firestore syncing.
- **Viral Acquisition Loop:** URL-routable dashboards to act as secondary PQL gates for colleagues viewing shared links.
- **Automated Cost Control:** Backend TTL policies to aggressively prune abandoned anonymous sessions and database records.

## Impact

This feature is expected to massively increase the volume of completed strategy generations, leveraging the Endowment Effect to organically lift the overall sign-up conversion rate.
