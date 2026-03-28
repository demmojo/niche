# System Logs UX

We need to obfuscate internal tool names and collapse API call details in the system logs UI to improve readability and protect our proprietary stack.

## Features

### 1. Label Obfuscation

- **Requirement:** Implement a client-side mapping function `getGenericLabel(action)` to convert specific AI and search tool names to generic labels before rendering them in the UI.

### 2. Collapsible API Details

- **Requirement:** Replace the hardcoded `<div>` rendering of `Context Data` and `API Call Details` with interactive HTML `<details>` and `<summary>` elements, hiding the expanded JSON payloads by default and improving typography for readability.

## Scenarios

- **WHEN** the user views the System Logs,
- **THEN** internal tool names like "Gemini AI" or "Apollo.io" appear as generic labels (e.g., "AI Analysis", "Data Enrichment").

- **WHEN** an API call contains details or context data,
- **THEN** the JSON is initially collapsed and can be expanded by clicking the summary. The text is rendered with an increased font size and higher contrast for better readability.
