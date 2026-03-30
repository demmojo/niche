# Tasks

## Phase 1: Top of Funnel & Lightweight Generation

- [x] Build 'Niche Radar' live feed UI component.
- [x] Implement massive input hero section on `nicheai.com`.
- [x] Integrate Gemini Flash-Lite (and cache retrieval) for unauthenticated report generation.
- [x] Implement Firebase App Check (reCAPTCHA v3) on the Express BFF to prevent DoW attacks.
- [x] Configure Firestore `pqlState` collection with 72-hour TTL index for ghost sessions.

## Phase 2: Teaser Mechanics & Paywall

- [x] Build Market Gap Report UI (TAM, JTBD, Tarpit Score).
- [x] Implement CSS `backdrop-filter: blur(8px)` with padlock icon for locked UI sections.
- [x] Enforce strict backend payload stripping (Omit GTM/Competitor data for unauth requests).
- [x] Implement 'Lock this Market' button.
- [x] Build anonymous-to-auth account linking flow utilizing React 19 `useActionState` and `isMergingRef`.

## Phase 3: Programmatic SEO & Virality

- [x] Refactor report pages (`/reports/[industry-slug]/[niche-slug]`) to use Server-Side Rendering (SSR).
- [x] Create async background worker to auto-generate SEO metadata (title, meta description, JSON-LD schema).
- [x] Build dynamic OpenGraph image generation service (Niche Title, TAM, Tarpit Score dial).
- [x] Add 1-click Twitter and LinkedIn share buttons with pre-filled copy.
- [x] Create dynamic category aggregation pages (`/markets/[category-slug]`).

## Phase 4: Edge Cases

- [x] Implement 'Niche Collision' detection logic in backend.
- [x] Build 'Pivot to Abundance' UI to suggest 3 adjacent niches when a collision occurs.
- [x] Implement 'Watch this Market' lead-gen action for anonymous users.
