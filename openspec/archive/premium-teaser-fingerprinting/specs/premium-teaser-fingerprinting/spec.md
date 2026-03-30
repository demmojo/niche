# Spec

## Detailed Features

1. **Fingerprint Generator (`src/server/utils/fingerprintUtils.ts`):**
   - Extracts IP, User-Agent, and Accept-Language from the request.
   - Appends a daily salt (e.g., current UTC date string + secret).
   - Returns a one-way cryptographic hash (SHA-256).
2. **App Check Middleware:**
   - Enforces valid Firebase App Check tokens for teaser endpoints to ensure traffic originates from the genuine frontend.
3. **Firestore Tracking:**
   - Before executing a premium query, the system reads `anonymous_usage_limits/{fingerprintHash}`.
   - If count >= 3, reject. Otherwise, increment and execute.

## Scenarios

**Scenario 1: Standard Anonymous Run**

- WHEN an anonymous user initiates a teaser flow
- THEN the system generates a daily fingerprint, increments usage, and serves premium results.

**Scenario 2: Run Limit Reached**

- WHEN the fingerprint count reaches 3
- THEN the API blocks further runs and prompts the user to sign up.

**Scenario 3: Incognito Bypass Attempt**

- WHEN an anonymous user clears cookies and attempts a 4th run
- THEN the same daily fingerprint is generated and the request is blocked.

**Scenario 4: Bot Request**

- WHEN a script attempts to hit the premium endpoint directly
- THEN Firebase App Check middleware rejects the request.
