## Why

The current local development experience is broken due to a "split-brain" database scenario and a flawed background task simulator. When developers run `npm run dev`, frontend operations write to the production Firebase database, while backend workers attempt to read from a local Firestore emulator. Furthermore, the custom Cloud Tasks simulator attempts to dispatch webhooks to port `8080`, but the local Express server is bound to port `3000`, resulting in immediate `ECONNREFUSED` errors for all background tasks. A developer cannot run the application fully locally without encountering silent failures.

## What Changes

This OpenSpec will refactor the local development setup to ensure true offline/local operation:

1.  **Firebase Emulator Suite Integration:** Introduce standard npm scripts to start the Firebase emulator. Update `src/firebase.ts` to seamlessly connect to local Firestore and Auth emulators when a `VITE_USE_FIREBASE_EMULATOR=true` flag is set.
2.  **Cloud Tasks Simulator Fix:** Refactor the custom Cloud Tasks simulator in `src/server/cloudTasks.ts` to dynamically resolve the correct local port (e.g., matching the Express server) and cleanly trigger background workers without `ECONNREFUSED` crashes.
3.  **Local Dev Ergonomics:** Update the `.env.example` file and development instructions to default to `SIMULATE_CLOUD_TASKS=true`, ensuring a safe, sandbox environment out of the box.

## Capabilities

### New Capabilities

- `firebase-local-emulator-support`: The ability to run the entire app against local, ephemeral Firestore and Auth instances.

### Modified Capabilities

- `cloud-tasks-local-simulator`: The fallback HTTP dispatcher will correctly route local jobs to the running Express instance.

## Impact

- `src/firebase.ts` (Frontend Firebase initialization)
- `src/server/cloudTasks.ts` (Backend task dispatcher)
- `package.json` (New emulator scripts)
- `.env.example` (Updated default configs)
- `README.md` (Updated local dev guide)
