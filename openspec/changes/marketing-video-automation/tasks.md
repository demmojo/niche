## 1. Mock Data & Hydration

- [x] 1.1 Create `src/utils/demoMockData.ts` with comprehensive, realistic JSON data for competitors, SWOT analysis, and mindmap structures.
- [x] 1.2 Update the main application entry point (e.g., `src/App.tsx`) to check for the `demo_data=true` URL parameter.
- [x] 1.3 Implement the dynamic import of `demoMockData.ts` and hydrate the Zustand stores with the mock data when the parameter is active.

## 2. Video Script Refactoring

- [x] 2.1 Update `scripts/generate_feature_videos.cjs` to append the `&demo_data=true` parameter to the base navigation URLs.
- [x] 2.2 Refactor the video recording flows to focus exclusively on the 5 impactful features: Automated Market Intelligence, Visual Intelligence, Strategic Market Analysis, Actionable Outputs, and Team Collaboration.
- [x] 2.3 Remove or skip secondary infrastructure video flows (like API keys or Data Sync Review) from the main recording script.

## 3. Automation Lifecycle

- [x] 3.1 Add `"generate-videos": "node scripts/generate_feature_videos.cjs"` to the `scripts` section in `package.json`.
- [x] 3.2 Add `"postversion": "npm run generate-videos && git add public/videos/*.webm"` to the `scripts` section in `package.json`.
- [x] 3.3 Create the `.cursor/skills/release-version/SKILL.md` file to instruct AI agents on the new `npm version` release workflow.
