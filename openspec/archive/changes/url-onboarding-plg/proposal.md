## Why

Founders and users often struggle to articulate their idea or niche in a blank text field. By allowing them to input a URL (their own website, or a competitor's), we can reduce the "imagination gap" and compress Time-to-Value (TTV) to under 60 seconds. This implements a "Reverse Demo" where the AI instantly analyzes the provided URL, extracts Jobs-to-Be-Done (JTBD), and suggests orthogonal pivot directions before demanding a sign-up.

## What Changes

- Introduce a new intent/flow in `ZeroFrictionEntry` where users can input a URL.
- Implement an Express BFF endpoint using Gemini Flash-Lite to scrape the URL, extract metadata, and identify initial JTBD without invoking expensive APIs for anonymous users.
- Add an "Explainable State" loading UI while the AI is analyzing the URL.
- Implement strict PQL gating (Product Qualified Lead) that requires Firebase Anonymous Auth with App Check to prevent DoW (Denial of Wallet).
- Update the Auth listener with `isMergingRef` to support React 19 State Freeze during the anonymous-to-permanent account linking process.

## Capabilities

### New Capabilities

- `url-ingestion`: Ability to scrape and ingest basic data from a provided URL using Gemini Flash and in-house logic.
- `anonymous-pql-gating`: Track and limit the number of AI operations an anonymous user can perform, protected by App Check.
- `progressive-refinement`: Allow users to tweak AI-suggested niches before signing up.

### Modified Capabilities

- `plg-onboarding`: Enhanced `ZeroFrictionEntry` with URL support and new explainable loading states.
- `auth-linking`: Seamless upgrading from anonymous to permanent accounts without UI flicker or data loss.

## Impact

Affects the primary landing page onboarding flow (`ZeroFrictionEntry`, `TrustBuilderScreen`), Express API routes for scoring/scraping, and the root Firebase Auth provider.
