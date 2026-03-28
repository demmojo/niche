## Context

As NicheAI enters early alpha, we are giving a select number of users access to the platform. The platform heavily relies on costly third-party APIs (Gemini and Exa.ai). To prevent abuse and manage financial risk, we need to enforce a strict limit on the most expensive operations: triggering new AI discoveries or full system syncs.

Simultaneously, we want to provide an excellent user experience. Hitting a hard limit with no explanation is frustrating. We need to seamlessly communicate *why* these limits exist (to manage costs during early alpha) and provide a direct path for power users to request a limit increase.

## Goals / Non-Goals

**Goals:**
- Enforce a limit of 1 "heavy" AI task per day (discovery or global sync).
- Exclude `superadmins` from these limits entirely to allow internal testing.
- Clearly and empathetically communicate to the user when they hit the limit, explaining the reasoning.
- Provide a simple UI flow for users to contact us to request a limit increase or provide general feedback.
- Collect all feedback in a central location (Firestore) accessible via a Superadmin dashboard.

**Non-Goals:**
- We are *not* building a complex, paid subscription tier or automated quota increase system.
- We are *not* implementing fine-grained token tracking in this phase (this is covered in `api-usage-limits`).

## Decisions

1. **Client-Side Limit Tracking (Alpha Phase):**
   - For simplicity during the alpha phase, daily usage counts will be tracked in `localStorage`. While easily bypassed by savvy users, it is sufficient for the early alpha phase to prevent accidental abuse by average users. 
   - *Alternative Considered:* Server-side tracking via Firebase functions. *Rejected:* Too much overhead for a temporary alpha safeguard.

2. **Limit Reached Modal over Toasts:**
   - Instead of a simple error toast when limits are hit, we will present a dedicated `LimitReachedModal`.
   - *Rationale:* Toasts disappear too quickly and don't provide enough real estate to explain the "why" and offer a "Contact Us" call to action.

3. **Feedback Submission via Firestore:**
   - User feedback and limit increase requests will be saved to a simple `alpha_feedback` Firestore collection.
   - *Rationale:* This provides a persistent, easy-to-query backend without needing a dedicated server endpoint.

## Risks / Trade-offs

- **Risk:** Client-side `localStorage` limits can be bypassed by clearing browser data.
  - **Mitigation:** Acceptable risk for an early, invite-only alpha. Most users will not attempt to maliciously bypass limits. The `api-usage-limits` BYOK system will handle long-term quota management.
- **Risk:** The modal might disrupt the user flow.
  - **Mitigation:** The modal is only shown when the user explicitly triggers a heavy, limited action (like "Run Data Pipeline" or "News Discovery"). It prevents the action and offers an immediate alternative (requesting an increase).
