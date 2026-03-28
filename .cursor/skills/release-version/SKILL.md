# Release Version

This skill instructs the agent on how to manage and trigger new releases using the `npm version` lifecycle.

## Context

When the user asks to "bump the version", "create a release", or "generate a new version", you should use the standard `npm version` command rather than manually modifying `package.json`.

## Workflow

1. Identify the requested version bump type (`patch`, `minor`, or `major`). If not specified, ask the user or default to `patch` for bug fixes and `minor` for features.
2. Run the command: `npm version <type> -m "chore(release): bump version to %s"`
3. The native NPM lifecycle will execute the `postversion` hook, which automatically triggers `npm run generate-videos` to regenerate the marketing assets and stages them in git.
4. Push the commit and the tags to the remote using `git push --follow-tags`.

**IMPORTANT**: Never modify the `version` field in `package.json` directly. Always use the `npm version` CLI tool so that the lifecycle hooks properly execute to keep the marketing videos in sync.
