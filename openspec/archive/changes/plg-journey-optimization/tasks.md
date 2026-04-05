## 1. Streaming Stabilization & Intent State (Frontend)

- [ ] 1.1 **Test:** Write failing RTL intent-based tests asserting zero CLS layout shifts upon intent selection (`min-h-[400px]`) and verifying the URL syncs with query parameters (`?intent=x&q=y`).
- [ ] 1.2 **Test:** Write failing RTL tests asserting the presence of the frosted glass backdrop and ensuring Accordions do **not** auto-expand when stream chunks arrive.
- [ ] 1.3 **Implement:** Update `ZeroFrictionEntry.tsx` with a `min-h-[400px]` container wrapper and sync `intent`/`ideaPayload` state to URLSearchParams via `react-router` or `window.history`.
- [ ] 1.4 **Implement:** Update `TrustBuilderScreen.tsx` with min-height skeletons, `scroll-anchoring`, and explicitly disable auto-expansion behavior on completed Accordion items.
- [ ] 1.5 **Implement (Anti-Abuse):** Add `maxLength={250}` to the idea input in `ZeroFrictionEntry` and integrate Firebase AppCheck to prevent Denial of Wallet (DoW) attacks.
- [ ] 1.6 **Implement (Smart Scroll):** Add a `useScrollToBottom` hook that pins the scroll to the bottom during the stream, but _pauses_ auto-scrolling if the user manually scrolls up (fixing the Infinite Scroll Trap).

## 2. Auth State Hydration & Eliminating the Double-Hit (Full Stack)

- [ ] 2.1 **Test:** Write MSW/RTL tests simulating a successful `linkWithPopup` and asserting the app navigates directly to the pre-filled next step _instantly_ via cache, rather than firing a new `/api/scoring/stream` request.
- [ ] 2.2 **Implement (The Double-Hit Fix):** Refactor Express BFF `/api/scoring/stream`. When `isAnonymous` is true, the backend must pre-compute and cache the _entire_ payload (including Tarpit Score) to Firestore or Redis before emitting the `pql_gate` event.
- [ ] 2.3 **Implement (Hydration Race Condition):** Update `usePQLUpgrade.ts` to cache the anonymous state (`anonToken`, `oldUid`) to `sessionStorage` and `localStorage` _before_ invoking `linkWithPopup`.
- [ ] 2.4 **Implement (Explainable Transfer State):** While the backend merge completes post-auth, render an "Explainable Transfer State" (e.g., "Securing your market research...") instead of a generic spinner or an empty dashboard.
- [ ] 2.5 **Implement (Orphaned State Deadlocks):** Update `AuthProvider.tsx` to check `localStorage` for pending merges on mount. If an uncompleted merge exists, automatically retry the `/merge-anonymous-data` API call. Clear `localStorage` only upon a 200/202 success.
- [ ] 2.6 **Implement (Stateful Tombstones):** In `authRoutes.ts`, write the tombstone as `{ status: "processing", timestamp: Date.now() }`. Only mark as `"completed"` at the end of the batch to prevent deadlocks if the Cloud Run instance dies mid-merge.
- [ ] 2.7 **Implement (Data Integrity):** Ensure workspace members are deduplicated during the merge using a `Set` in `authRoutes.ts`.
- [ ] 2.8 **Implement (JWT Throttling):** Update the fallback polling loop in `AuthProvider.tsx` to use exponential backoff (500ms, 1s, 2s, 4s) instead of linear 500ms to prevent Firebase 429 API errors during sign-in spikes.

## 3. Drawer Migration (UI Architecture)

- [ ] 3.1 **Test:** Write failing RTL tests asserting that `CompetitorDiscoveryModal` and `DocumentationWizardModal` trigger a Side Drawer with `modal={false}` and leave the underlying dashboard fully interactive.
- [ ] 3.2 **Implement:** Create a universal `SideDrawer.tsx` layout component using Radix UI Dialog primitives, ensuring `modal={false}` and manual focus trapping.
- [ ] 3.3 **Implement:** Migrate the `CompetitorDiscoveryModal.tsx` and `DocumentationWizardModal.tsx` logic into the new drawer architecture.
- [ ] 3.4 **Implement:** Sync the drawer's open state with a URL query parameter (e.g., `?drawer=doc-wizard`) so the drawer state survives page refreshes.

## 4. Generative UI & Inverting the Wizard Flow

- [ ] 4.1 **Test:** Write failing RTL tests for the inverted `DocumentationWizardModal`, asserting that Format selection (Step 1) correctly hides or reveals subsequent curation steps (preventing the "False Choice" trap).
- [ ] 4.2 **Test:** Write failing MSW/RTL tests simulating a structured JSON stream from the BFF, asserting that distinct React components (Accordions/Cards) render progressively with structural skeletons.
- [ ] 4.3 **Implement:** Refactor `DocumentationWizardModal.tsx` to force Format selection on Step 1 and pass that constraint down to the curation steps.
- [ ] 4.4 **Implement (Generative UI):** Create a `useGenerativeUI` hook to safely parse incoming JSON chunks using Zod discriminated unions. If `JSON.parse` throws a `SyntaxError` mid-stream, push the chunk into a residual buffer or fail gracefully without hanging the UI.
- [ ] 4.5 **Implement (Render Thrashing):** Throttle React state dispatches during the Generative UI stream to 15-30fps to prevent main thread lockup and flickering objects, rendering structural skeletons while objects are incomplete.

## 5. Final Validation

- [ ] 5.1 Verify targeted local coverage (`npm run test -- <changed-files> --coverage`) meets the 80-100% threshold.
