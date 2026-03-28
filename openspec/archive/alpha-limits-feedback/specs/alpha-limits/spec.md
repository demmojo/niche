# Alpha Limits, Communication, and Feedback

This specification details the implementation of a daily usage limiter, clear limit communication, and a user feedback portal for early alpha testers.

## Features

### 1. Alpha Usage Tracking

- **Daily Limit:** Users are restricted to exactly 1 manual search, discovery, or global sync per day.
- **Limit Exemptions:** Users with the email `mo@nicheai.com` or marked as `isSuperadmin` must bypass all limits and usage checks.
- **Client-Side Persistence:** Usage counts and timestamps should be persisted in the browser's `localStorage` (`nicheai_alpha_usage`).
- **Trigger Actions:** The limit applies when triggering `runDiscovery`, `runSystemCheck` (if it includes heavy AI), `runNewsDiscovery`, or `handleGlobalSync`.

### 2. Limit Reached Communication

- **Limit Reached UI:** When a user attempts to execute a restricted action after hitting their limit, display a clear, well-designed `LimitReachedModal`.
- **Content:** The modal must explain *why* the limit exists: "We're currently in an Early Alpha phase. To manage the high costs of our AI providers (like Gemini and Exa), we limit accounts to 1 deep discovery or sync per day."
- **Call to Action:** The modal must include a primary button to "Request Limit Increase" or "Contact Us," which redirects the user to the Support/Feedback Portal (or opens a feedback form directly).

### 3. Support & Feedback Portal

- **Feedback Types:** Users can submit "Bug", "Feature", "General", or "Limit Increase Request".
- **Form Fields:** A message text area, the user's ID/email, and the selected feedback type.
- **Submission:** Submissions must be saved to a Firestore collection named `alpha_feedback`.
- **Success State:** Upon successful submission, display a thank you message and clear the form.

### 4. Superadmin Dashboard

- **Access Control:** A dedicated view accessible only if `isSuperadmin` is true.
- **Display:** A list or grid of all submitted feedback messages, ordered by timestamp (newest first).
- **Details:** Display the feedback type, user email, timestamp, and the full message content.

## State Management

- Use `localStorage` to store a JSON object `{ date: 'YYYY-MM-DD', count: number }`.
- Compare the stored date with the current date to reset the count.

## Error Handling

- If Firestore submission fails, display a user-friendly error message within the feedback form.
