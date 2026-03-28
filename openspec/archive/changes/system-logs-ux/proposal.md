## Why

Currently, the system logs expose internal AI and search tool names like "Gemini AI", "Google Search", and "Apollo.io". This exposes our proprietary stack, making it easier for competitors to copycat our product. In addition, the API response details are rendered fully expanded, which can clutter the UI.

## What Changes

1. **Label Obfuscation**: Map internal AI and search tool names to generic action labels in the UI.
2. **Collapsible API Details**: Refactor the "API Call Details" and "Context Data" sections into HTML `<details>` blocks so they are collapsed by default and easily readable when expanded.

## Capabilities

### Modified Capabilities

- `system-logs-ui`: The System Logs UI will display generic tool names and collapsible JSON blocks instead of raw, fully-expanded tool details.

## Impact

The `src/App.tsx` component is primarily affected. The changes are strictly UI-side and do not alter how the backend stores or generates logs.
