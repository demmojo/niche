# Cloud Tasks Local Simulator

This OpenSpec outlines the implementation of a functional local development environment, resolving the Firebase split-brain issue and fixing the broken custom Cloud Tasks simulator.

## Features

### 1. Firebase Local Emulator Suite Integration

- **Requirement:** Update `src/firebase.ts` to connect to the local Firestore (`127.0.0.1:8080`) and Authentication (`127.0.0.1:9099`) emulators when the `VITE_USE_FIREBASE_EMULATOR=true` environment variable is detected.
- **Requirement:** Ensure the backend `src/server/authMiddleware.ts` and `src/server/queues.ts` dynamically align with the same mock `projectId` (e.g., `demo-nicheai`) when testing locally, preventing the split-brain scenario.

### 2. Custom Cloud Tasks Simulator Fix

- **Requirement:** Refactor the custom Cloud Tasks simulator in `src/server/cloudTasks.ts`. The simulator currently dispatches to `http://127.0.0.1:8080`. It must be updated to dispatch to `http://127.0.0.1:${process.env.PORT || 3000}` to match the running Express instance in `server.ts`.
- **Requirement:** Update `.env.example` to default to `SIMULATE_CLOUD_TASKS=true`.

### 3. Local Development Ergonomics

- **Requirement:** Update `package.json` to include scripts for starting the Firebase emulator (`npm run emulators:start`).
- **Requirement:** Update `README.md` to document the new local development experience, explicitly detailing how to toggle between the emulator and the live database.

## Scenarios

- **WHEN** a developer starts the application with `VITE_USE_FIREBASE_EMULATOR=true`
- **THEN** the frontend `src/firebase.ts` instance connects to the local emulators on ports `8080` and `9099`, completely isolated from production.

- **WHEN** a developer triggers a background job (e.g., via a frontend UI action) with `SIMULATE_CLOUD_TASKS=true`
- **THEN** the `enqueueTask` function in `src/server/cloudTasks.ts` dispatches an asynchronous HTTP request to the running Express instance on port `3000`, successfully executing the worker logic.
