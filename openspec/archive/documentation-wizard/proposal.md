## Why
The application needed a way to export product details and AI-generated insights into actionable documentation formats like PRDs, One-Pagers, and OpenSpec archives.

## What Changes
Introduces the DocumentationWizardModal, allowing users to select features, next steps, and insights, choose an export format, and generate/download the resulting document.

## Capabilities
### New Capabilities
- `document-generation`: Ability to generate Markdown or ZIP archives of product details and insights.
- `wizard-flow`: Step-by-step selection of features, insights, and format.

## Impact
Affects the frontend UI with a new modal and uses `jszip` for creating OpenSpec archive bundles.