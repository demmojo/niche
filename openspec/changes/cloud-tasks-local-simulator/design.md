## Context

During a recent architectural refactoring to a "scale-to-zero" deployment using Google Cloud Run, we replaced BullMQ and Redis with Google Cloud Tasks. The local development experience suffered because Cloud Tasks does not have an official Google-provided local emulator.

Additionally, the frontend previously communicated exclusively with the production Firebase instance (`gtmforge-45e57`), while backend worker middleware attempted to query a local Firestore instance when GCP credentials were missing. This resulted in a "split-brain" where frontend jobs were never processed by the local backend worker, and local background jobs failed because the custom Cloud Tasks simulator tried to dispatch to the wrong port (`8080` instead of `3000`).

## Goals / Non-Goals

**Goals:**

- Unify the frontend and backend to use the exact same Firebase local emulator configuration when testing locally.
- Fix the custom Cloud Tasks local simulator so it successfully dispatches jobs to the running Express instance.
- Ensure developers can easily toggle between "Full Local Mode" (Emulators) and "Hybrid Mode" (Live DB + Local Express).

**Non-Goals:**

- Creating a perfect, 1-to-1 recreation of Google Cloud Tasks (e.g., precise rate limiting, retry queueing, and exact error semantics). We only need a functional asynchronous HTTP dispatcher for local development.

## Decisions

**1. Firebase Emulator Toggle**

- **Decision:** Introduce a `VITE_USE_FIREBASE_EMULATOR=true` environment variable. When detected, `src/firebase.ts` will call `connectFirestoreEmulator(db, '127.0.0.1', 8080)` and `connectAuthEmulator(auth, 'http://127.0.0.1:9099')`.
- **Rationale:** We need to explicitly opt-in to the emulator to allow developers to still test against a live staging database if needed (Hybrid Mode).

**2. Fixing the Cloud Tasks Simulator Port**

- **Decision:** The custom simulator in `src/server/cloudTasks.ts` will dynamically read `process.env.PORT` (falling back to `3000`), constructing the dispatch URL as `http://127.0.0.1:${port}`.
- **Rationale:** This ensures the dispatcher aligns with the exact port `server.ts` is bound to, eliminating the `ECONNREFUSED` error.

**3. Local Dev Defaults**

- **Decision:** Add `SIMULATE_CLOUD_TASKS=true` to `.env.example`.
- **Rationale:** The default behavior out-of-the-box should prioritize a safe local sandbox over accidentally pinging production Cloud Run infrastructure.

## Risks / Trade-offs

- **Risk: Flaky Simulators:** The custom Cloud Tasks simulator relies on `setTimeout` and standard `fetch`. If the Node.js process crashes, the "queued" tasks are lost forever.
- **Mitigation:** Acknowledge this limitation in the developer documentation. This is acceptable for local development, as the goal is functional testing, not production resilience.

## Future Potential & Wow Features

- **Automated E2E Test Environments**: With a fully functional local emulator setup, we can write true end-to-end (E2E) tests using Playwright that spin up a clean database, trigger background tasks, and assert the final state without side-effects on a real cloud database.
- **Architectural / Design To-Do**: Consider replacing the custom Cloud Tasks simulator with an open-source clone like `aertsc/gcp-cloud-tasks-emulator` if the custom logic becomes too complex to maintain.
