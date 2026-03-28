# Marketing Video Automation & Mock Data

This feature provides a robust architecture for injecting realistic dummy data during automated feature video recording, and hooks the video generation process into the native npm version lifecycle.

## Features

### 1. Mock Data Hydration

- **Requirement**: Create `src/utils/demoMockData.ts` exporting structured JSON objects matching the app's TypeScript interfaces (e.g., realistic `demoCompetitors`, `demoSwot`, and detailed mindmap node structures).
- **Requirement**: Implement a listener (e.g., inside a `useEffect` in `src/App.tsx` or a top-level `DemoDataHydrator` component) that checks for `new URLSearchParams(window.location.search).get('demo_data') === 'true'`.
- **Requirement**: If the parameter is present, use a dynamic import (`import('./utils/demoMockData')`) to fetch the data and hydrate the Zustand stores (e.g., `useVisualKnowledgeStore.getState().setInitialData(demoCompetitors)`).

### 2. Video Generation Updates

- **Requirement**: Update `scripts/generate_feature_videos.cjs` to navigate using the hydration parameters: `/?w=${wid}&mock_auth=true&demo_data=true`.
- **Requirement**: Ensure the script targets the 5 selected core features: Automated Market Intelligence, Visual Intelligence, Strategic Market Analysis, Actionable Outputs, and Team Collaboration.

### 3. NPM Automation & AI Skill

- **Requirement**: Update `package.json` to include `"generate-videos": "node scripts/generate_feature_videos.cjs"`.
- **Requirement**: Update `package.json` to include `"postversion": "npm run generate-videos && git add public/videos/*.webm"`.
- **Requirement**: Create `.cursor/skills/release-version/SKILL.md` (or update `.cursor/rules/release-workflow.mdc`) dictating that the AI must use `npm version minor` (or major) to bump versions, and explaining that this natively triggers the video regeneration hook.
