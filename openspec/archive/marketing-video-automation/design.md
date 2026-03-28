## Context

Currently, hardcoding dummy data inside Playwright scripts leads to massive, unmaintainable testing files. Moving it to the `src/` directory is appropriate only if decoupled from production logic. Additionally, triggering side effects (like video generation) upon version changes should natively hook into the `npm` lifecycle rather than relying entirely on manual AI prompts.

## Goals / Non-Goals

**Goals:**

- Provide realistic, marketing-ready mock data without impacting the production bundle size.
- Hydrate Zustand stores smoothly for Playwright video recordings.
- Automate the video regeneration process natively on version bumps.

**Non-Goals:**

- Do not hardcode mock data inside individual UI components.
- Do not rely on brittle Playwright `page.route` interceptions for complex frontend state if native state hydration is cleaner.

## Decisions

**1. Mock Data Storage and Injection**

- **Decision**: Create `src/utils/demoMockData.ts` and conditionally import it using dynamic imports when the URL contains `demo_data=true`.
- **Rationale**: Dynamic imports ensure the mock data is completely excluded from the production bundle. Hydrating Zustand stores directly is easier to maintain for complex frontend state than intercepting every API call in Playwright.

**2. The 5 Impactful Features**

- **Decision**: Focus video generation strictly on: Automated Market Intelligence, Visual Intelligence, Strategic Market Analysis, Actionable Outputs, and Team Collaboration.
- **Rationale**: These 5 features represent the core B2B product value (Discover -> Synthesize -> Analyze -> Document -> Collaborate) rather than secondary infrastructure tools (like API keys).

**3. NPM Lifecycle Automation**

- **Decision**: Add a `postversion` script to `package.json` that runs `npm run generate-videos && git add public/videos/*.webm`.
- **Rationale**: Node natively supports lifecycle hooks for `npm version`. This guarantees that whenever a developer or AI agent bumps the minor or major version, the videos are perfectly synced with the latest UI and staged automatically.
