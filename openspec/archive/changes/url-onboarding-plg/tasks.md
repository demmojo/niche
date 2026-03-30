## 1. Backend & Infrastructure

- [x] 1.1 **Test:** Write failing MSW/Firebase Emulator intent-based tests for `/api/scoring/url-teaser` validating App Check and PQL limits.
  - _Must test SSE connection close handling (`req.on('close')`)._
- [x] 1.2 **Implement:** Create the `/api/scoring/url-teaser` endpoint with simple HTTP fetching, prompt injection protection (`replace(/[<>]/g, "")`), Zod validation, and Gemini Flash-Lite integration.
- [x] 1.3 **Implement:** Add PQL tracking logic in Firestore (`users/{uid}/pqlState`).

## 2. Frontend Integration

- [x] 2.1 **Test:** Write failing RTL intent-based tests for `ZeroFrictionEntry` URL submission and teaser display.
  - _Must wrap the initial `render()` and every `controller.enqueue()` stream injection in `await act(async () => { ... })`._
- [x] 2.2 **Test:** Mock Server-Sent Events in Playwright `page.route` by fulfilling the route with a concatenated string of chunks.
- [x] 2.3 **Implement:** Update `ZeroFrictionEntry` UI to accept a URL and handle the new intent type.
- [x] 2.4 **Implement:** Create the "Explainable State" loading UI and Teaser result component with safe JSON parsing (`chunk.replace(/^data:\s*/, "")`).

## 3. Auth Linking Resilience

- [x] 3.1 **Test:** Write RTL tests mocking `linkWithPopup` and verifying React 19 state freezing via `AbortController` degrades gracefully.
- [x] 3.2 **Implement:** Update `AuthProvider` to handle anonymous-to-permanent linking smoothly, catching fetch errors on remount.

## 4. Final Phase: Testing & Validation

- [x] 4.1 Verify targeted local coverage (`npm run test -- <changed-files> --coverage`) meets the 90% threshold strictly.
