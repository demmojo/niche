# Specification: OAuth & Explainable UI Flow

## Core State Machine

The `<ExplainableLoader>` will react to the following strict enum, utilizing `aria-live="polite"` for accessibility:
`type AuthMergeState = 'IDLE' | 'REQUESTING_GRANT' | 'AWAITING_OAUTH' | 'RESOLVING_CONFLICT' | 'EXECUTING_MERGE' | 'SUCCESS' | 'ERROR';`

## Scenarios

### Scenario 1: Standard Popup Authentication

**GIVEN** an anonymous user with generated workspace data
**AND** the environment supports popups (Desktop/Standard Mobile)
**WHEN** the user clicks "Save Workspace"
**THEN** the system fetches a Claim Ticket (`REQUESTING_GRANT`)
**AND** opens the Google/GitHub popup (`AWAITING_OAUTH`)
**AND** upon completion, securely writes the data to the backend (`EXECUTING_MERGE`)
**AND** renders a success state before returning to the main UI.

### Scenario 2: Active Streaming Block

**GIVEN** an anonymous user with an active AI stream (`isStreaming === true`)
**WHEN** the user attempts to save the workspace
**THEN** the action is disabled/queued to prevent cutting the SSE connection mid-auth-swap.

### Scenario 3: WebView/Redirect Rehydration

**GIVEN** an anonymous user operating inside an Instagram/in-app WebView
**WHEN** the user clicks "Save Workspace"
**THEN** the system falls back to `linkWithRedirect`
**AND** stores the current state and Claim Ticket in `sessionStorage`
**AND** upon redirect return, rehydrates the AuthMergeState via `getRedirectResult()` to resume the `EXECUTING_MERGE` step.

### Scenario 4: Credential Conflict Resolution

**GIVEN** an anonymous user executing the OAuth swap
**WHEN** Firebase throws `auth/credential-already-in-use`
**THEN** the global auth provider intercepts the error (`RESOLVING_CONFLICT`)
**AND** extracts the credential
**AND** silently signs the user in with the extracted credential
**AND** resumes the atomic `executeMerge` flow.

### Scenario 5: Error Recovery (Network Failure)

**GIVEN** a user who has successfully completed the OAuth swap
**WHEN** the backend `executeMerge` payload fails due to network timeout
**THEN** the `<ExplainableLoader>` transitions to `ERROR`
**AND** presents a "Retry Sync" button that uses the `sessionStorage` Claim Ticket to re-attempt the atomic append.
