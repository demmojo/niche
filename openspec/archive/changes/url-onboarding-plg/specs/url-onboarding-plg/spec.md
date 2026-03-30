# URL Onboarding PLG Flow

Enhances the NicheAI onboarding experience by allowing users to input a URL to receive an instant "Reverse Demo" of Jobs-to-Be-Done and pivot directions.

## Features

### 1. Zero Friction URL Entry

- **Requirement:** `ZeroFrictionEntry.tsx` must display a new intent option: "Extract and pivot from a URL".
- **Requirement:** The form accepts a valid URL and submits to a new Express endpoint `/api/scoring/url-teaser`.

### 2. URL Teaser Endpoint (BFF)

- **Requirement:** The endpoint must verify Firebase App Check.
- **Requirement:** The endpoint must verify the user has not exceeded their anonymous PQL limit (e.g., max 3 attempts) via `pqlState` in Firestore.
- **Requirement:** The endpoint performs a basic HTTP GET to fetch the URL's HTML, strips tags, removes potential injection vectors using regex `replace(/[<>]/g, "")`, and passes the raw text to Gemini Flash-Lite.
- **Requirement:** The LLM extracts a primary "Job to Be Done" and 2 "Orthogonal Pivot Directions". The output must be strictly validated against a Zod schema.
- **Requirement:** The endpoint must stream initial metadata (like page `<title>`) back to the client immediately to fulfill the "Explainable States" UI requirement.
- **Requirement:** The SSE stream must handle client disconnects gracefully using `req.on('close')` with an `AbortController`, and set `X-Accel-Buffering: no` to prevent proxy buffering.

### 3. PQL Gate & Auth Linking

- **Requirement:** After displaying the teaser, the UI prompts the user to "Sign Up to Generate Full Strategy".
- **Requirement:** Upon clicking sign up, Firebase `linkWithPopup` (or credential) is used to attach a real identity to the anonymous UID.
- **Requirement:** The React 19 fetch hooks must implement an `AbortController` hooked to dependencies. The `AuthProvider` must handle the merge gracefully without throwing fatal Error Boundaries if the user navigates away mid-merge.

## Scenarios

- **WHEN** an unauthenticated user submits a valid URL
- **THEN** they see an Explainable State loading UI, followed by a teaser of JTBD and pivot directions, and their `pqlState` count increments by 1.

- **WHEN** an anonymous user exceeds the PQL limit (e.g., > 3 submissions)
- **THEN** the API returns a 403 error and the UI displays a hard sign-up wall.

- **WHEN** an anonymous user clicks "Sign Up" and successfully authenticates via Google
- **THEN** their anonymous UID is preserved, `linkWithPopup` merges the account, and they are redirected to the full authenticated dashboard without data loss.
