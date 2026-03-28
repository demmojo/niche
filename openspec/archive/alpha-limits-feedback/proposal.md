# Alpha Limits and Feedback System

## Why

As NicheAI enters its early alpha phase, it is critical to manage API usage costs (especially Exa and Gemini) while simultaneously capturing valuable user feedback. Imposing a strict daily usage limit ensures the free tiers of our underlying APIs are not exhausted, and implementing a robust feedback loop allows early adopters to shape the product's future. Furthermore, we must ensure these limits are very clearly and seamlessly communicated to the user, explaining why they exist, while providing an easy avenue for them to get in touch if they want their limits increased.

## What Changes

This proposal introduces a "Usage Limiter" and a "Support/Feedback Portal" targeted at alpha testers.

- **Alpha UI Badging**: The application will prominently display an "Early Alpha - Limits Apply" badge in the main navigation to set user expectations.
- **Daily Usage Limits**: Users will be restricted to exactly 1 manual search or sync per day. This limit will encompass both the existing `runDiscovery` flow and the new Exa-powered `runNewsDiscovery` flow. 
- **Clear Limit Communication**: When limits are hit, users will see a comprehensive modal or well-designed alert explaining the "Why" (managing costs during early alpha) and offering a "Contact Us" or "Request Limit Increase" action that directs them to the Support/Feedback Portal.
- **User Feedback Portal**: A dedicated Support/Help page will be added where users can submit feature recommendations, bug reports, or **requests to increase their usage limits** via a form.
- **Superadmin Dashboard**: Feedback submitted by alpha users will be stored in the database. A secure, restricted view will be created that allows only designated `superadmins` to read and manage these messages.

## Capabilities

### New Capabilities
- `alpha-usage-limiter`: A service/utility to track when a user last initiated a heavy AI task (sync or discovery) and block subsequent requests if they occur on the same calendar day.
- `feedback-submission`: A user-facing form to collect structured feedback (Type: Bug/Feature/Limit Increase, Message, Timestamp, UserID).
- `superadmin-dashboard`: A restricted UI component that aggregates and displays all submitted feedback, accessible only to users with the `superadmin` role.
- `limit-reached-dialog`: A UI component that transparently communicates the reason for limits and provides a call to action to request an increase.

### Modified Capabilities
- `live-discovery` & `news-discovery`: Both orchestration flows will now check the `alpha-usage-limiter` before executing and display the `limit-reached-dialog` if the user has exhausted their daily quota.

## Impact

- **`src/types.ts`**:
  - Introduce `UserUsage` interface to track `lastSearchTimestamp` and `searchCountToday`.
  - Introduce `FeedbackMessage` interface defining the schema for bugs/feature requests/limit increases.
  - Introduce `UserRole` or update existing user profiles to support a `superuser` flag.
- **UI Components**:
  - Add `AlphaBadge` to the main navigation header.
  - Create `SupportHelpPage.tsx` for the feedback form.
  - Create `SuperadminDashboard.tsx` to display feedback data.
  - Create `LimitReachedModal.tsx` to communicate limits clearly.
- **State/Database**: 
  - Ensure feedback messages and user usage metrics are correctly persisted to the database (Firebase/Firestore) so limits survive page reloads and feedback is permanently stored.
- **Cost/Performance**:
  - The 1/day limit acts as a hard ceiling on API spend per user during the alpha, drastically reducing financial risk while gathering qualitative feedback and allowing power users to request exceptions.
