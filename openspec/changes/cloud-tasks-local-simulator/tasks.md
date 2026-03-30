## 1. Firebase Local Emulator Setup

- [ ] 1.1 **Update `package.json`**: Add a `firebase emulators:start` script to the `package.json` for starting the local emulators.
- [ ] 1.2 **Update `src/firebase.ts`**: Add logic to call `connectFirestoreEmulator(db, '127.0.0.1', 8080)` and `connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })` if `VITE_USE_FIREBASE_EMULATOR=true` is present in the environment.
- [ ] 1.3 **Update Backend `authMiddleware.ts` (Admin SDK)**:
  - In the initialization block, set `process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099"` alongside `FIRESTORE_EMULATOR_HOST`.
  - Use `127.0.0.1` instead of `localhost` to avoid Node 18+ IPv6 resolution issues (`ECONNREFUSED` on `::1`).
  - **Crucial:** Delete the unsafe "dev mode token decode" block inside `requireAuth`. With the auth emulator host set, `admin.auth().verifyIdToken(idToken, true)` will now natively validate local emulator tokens.

## 2. Cloud Tasks Local Simulator Fixes

- [ ] 2.1 **Update `src/server/cloudTasks.ts`**:
  - Change the fallback port in the fetch URL from `8080` to `3000` to match `server.ts`.
  - Fix the string evaluation bug by explicitly checking `process.env.SIMULATE_CLOUD_TASKS === "true"`.
- [ ] 2.2 **Secure `src/server/internalAuthMiddleware.ts`**: Fix the OIDC bypass security flaw. Change the check to strictly require `process.env.NODE_ENV !== "production" && process.env.SIMULATE_CLOUD_TASKS === "true"`.
- [ ] 2.3 **Update `.env.example`**: Set `SIMULATE_CLOUD_TASKS=true` and `VITE_USE_FIREBASE_EMULATOR=true` as defaults.

## 3. Local Development Ergonomics

- [ ] 3.1 **Update `README.md`**: Revamp the "Local Development Setup" section to clearly document how to use the Firebase Emulators and Cloud Tasks simulator. Explain how to run "Hybrid Mode" (live DB + local express) vs "Full Local Mode".
