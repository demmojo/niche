## 1. Implement Alpha Limit Tracking (Utility)

- [x] 1.1 Create `src/utils/alphaUsageLimiter.ts` to manage `localStorage` tracking (date and count).
- [x] 1.2 Implement `checkAlphaLimit()` to verify if the daily limit (1) has been reached.
- [x] 1.3 Implement `recordAlphaUsage()` to increment the daily usage count.

## 2. Implement Clear Limit Communication (UI)

-[x] 2.1 Create a `LimitReachedModal.tsx` component to clearly communicate *why* limits exist (early alpha costs) when a user tries to run a heavy AI task.
-[x] 2.2 Add a clear call to action (button) in the modal to "Request Limit Increase" that redirects the user to the Support/Feedback portal.
-[x] 2.3 Integrate `LimitReachedModal` into `src/App.tsx`.
-[x] 2.4 Update `handleGlobalSync`, `runDiscovery`, and `runNewsDiscovery` in `src/App.tsx` to display the `LimitReachedModal` instead of a simple error toast when `!checkAlphaLimit()`.
- [x] 2.5 Ensure `isSuperadmin` completely bypasses these limit checks and the modal is never shown to them.

## 3. Implement Support & Feedback Portal (UI)

- [x] 3.1 Create `src/components/SupportHelpPage.tsx` with a feedback form.
-[x] 3.2 Update the feedback form types to include "Limit Increase Request" alongside Bug, Feature, and General.
- [x] 3.3 Ensure the form submits data directly to a Firestore collection (`alpha_feedback`).
- [x] 3.4 Display a success state upon submission.

## 4. Implement Superadmin Dashboard (UI)

- [x] 4.1 Create `src/components/SuperadminDashboard.tsx` to fetch and display feedback from Firestore.
- [x] 4.2 Restrict access to `isSuperadmin` users only.
- [x] 4.3 Format the dashboard to clearly show the feedback type, user email, timestamp, and message.
- [x] 4.4 Add navigation items for Support and Superadmin in `src/App.tsx`.
