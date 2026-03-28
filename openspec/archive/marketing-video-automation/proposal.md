## Why

The current feature videos are generated using a Playwright script that relies heavily on the app's empty state or highly limited mocked inputs injected directly in the script. To meet the requirement of fully populated, marketing-ready videos, the architecture must support robust, realistic mock data hydration without polluting the production environment or creating brittle Playwright selectors. Furthermore, automating video regeneration on version changes requires integrating with Node's native package management lifecycles to prevent stale marketing assets.

## What Changes

We are implementing "Marketing Video Automation & Mock Data" to streamline video generation. We will focus on the 5 most impactful features and generate videos for them using a dedicated demo data file (`src/utils/demoMockData.ts`). This mock data will be injected via a URL parameter (`demo_data=true`) and dynamic imports to ensure zero bundle bloat in production. Finally, we will automate video generation by adding a `postversion` hook in `package.json` and creating a new AI Agent skill to enforce the workflow.

## Capabilities

### New Capabilities

- `demo-data-hydration`: A dynamic import mechanism listening to the `demo_data=true` URL parameter to populate Zustand stores with realistic data for video generation.
- `version-video-automation`: A `postversion` script to automatically regenerate marketing videos and stage them during `npm version` bumps.

### Modified Capabilities

- `scripts/generate_feature_videos.cjs`: Updated to target the 5 core features and load the application using the new mock data hydration parameter.

## Impact

- **`src/utils/demoMockData.ts`**: A new file containing structured JSON mock data.
- **`package.json`**: Updated with new `generate-videos` and `postversion` scripts.
- **`.cursor/skills/release-version/SKILL.md`**: A new skill to enforce the use of `npm version` for releases to trigger the hooks automatically.
