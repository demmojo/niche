# Plan: Automated Versioning & Marketing-Ready Feature Videos

## 1. Semantic Release Setup (Blocking Major Bumps)

To maintain control over major version upgrades while fully automating the release pipeline, we will use `semantic-release` with a customized commit analyzer. Breaking changes will be intentionally downgraded to trigger `minor` releases.

**Implementation Details:**

- **Commit Analyzer Customization**: Override the default behavior of `@semantic-release/commit-analyzer`.
- **Release Rules**: Explicitly map `breaking: true` and `feat!` commits to `minor`.

**Example Configuration (`.releaserc.json`):**

```json
{
  "branches": ["main", "master"],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [{ "breaking": true, "release": "minor" }]
      }
    ],
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        "npmPublish": false
      }
    ],
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "npm run generate-videos"
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": [
          "package.json",
          "package-lock.json",
          "CHANGELOG.md",
          "public/videos/*.webm"
        ],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

## 2. Automating Feature Video Generation

To ensure our documentation and marketing assets are tightly coupled with the code they represent, video generation will run as an automated step in the release lifecycle.

**Implementation Details:**

- **Hooking the Pipeline**: We will use the `@semantic-release/exec` plugin during the `prepare` step.
- **Execution**: The step will trigger `npm run generate-videos`.
- **Commit integration**: `@semantic-release/git` will be configured to include the `public/videos/*.webm` assets so they are committed alongside the `CHANGELOG.md` and `package.json` bump.

## 3. Marketing-Ready Video Validation

Automatically generated videos must be strictly validated to prevent publishing broken, empty, or glitchy assets to the marketing site.

**Implementation Details:**

1. **Strict Playwright Assertions**:
   - **No Silent Failures**: All UI interactions must have strict visibility checks. If an element doesn't render, the test must fail and halt the release. Remove silent `try/catch` blocks in `generate_feature_videos.cjs`.
   - **UI Polish**: Inject CSS to hide native browser scrollbars (`::-webkit-scrollbar { display: none; }`) for a clean, marketing-ready aesthetic.

2. **File Size & Integrity Validation (`scripts/generate_feature_videos.cjs`)**:
   - **Minimum File Size**: Implement `fs.statSync` at the end of the script to check the generated `.webm` files. Any video under a threshold (e.g., `< 100KB`) indicates a broken render or blank screen and must throw a `process.exit(1)`.
   - **Expected Asset Verification**: Verify that exactly the 5 expected videos are generated and correctly named.

## 4. Agent Skills Update

Create a `.cursor/skills/bump-version/SKILL.md` (or update `.cursor/rules/release-workflow.mdc`) instructing the AI on the release workflow:

1. Explain that versions are bumped automatically by CI based on Conventional Commits.
2. If manual version bumping is requested locally, the AI must use `npm version minor` (or major).
3. Explain that this natively triggers the `version` hook in `package.json` (which we will also add as a fallback: `"version": "npm run generate-videos && git add public/videos/*.webm"`).
