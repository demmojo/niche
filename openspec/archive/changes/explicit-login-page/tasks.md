## 1. Phase 1: Test Scaffolding (Red Phase)

- [ ] 1.1 **Test:** Write failing MSW/RTL intent-based tests in `src/__tests__/components/LoginScreen.test.tsx`. Must include scenarios for: successful Google auth, successful Email/Password auth, invalid password error, and the 5-second circuit breaker timeout.
- [ ] 1.2 **Test:** Write an intent-based test in `src/__tests__/App.test.tsx` verifying that navigating to `/login` intercepts the route and renders the `LoginScreen` instead of `WorkspaceRouter`.

## 2. Phase 2: Component Implementation (Green Phase)

- [ ] 2.1 **Implement:** Create `src/components/LoginScreen.tsx` with email/password and Google OAuth functionality.
  - _Must use `useIsMounted` hook for ref checks._
  - _Must include a 5-second `Promise.race` circuit breaker for auth calls._
  - _Must handle `auth/credential-already-in-use` by extracting credentials via `OAuthProvider.credentialFromError` and calling `signInWithCredential`, followed by `auth.currentUser?.reload()`._
  - _Must use `aria-live="polite"` for loading states instead of generic spinners._
  - _Must redirect via `window.location.href = '/'` on success._
  - _Must explicitly show a warning about losing unsaved work if the user is currently anonymous._
- [ ] 2.2 **Implement:** Update `src/App.tsx` to include the route interception for `/login` returning the `<LoginScreen />`.

## 3. Final Phase: Testing & Validation

- [ ] 3.1 Verify targeted local coverage (`npm run test -- src/components/LoginScreen.tsx src/App.tsx --coverage`) meets the 80-100% threshold.
- [ ] 3.2 Run manual verification in the browser to ensure the UI matches the NicheAI minimal design system and transitions smoothly back to `/` on success.
