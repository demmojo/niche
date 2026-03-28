## Why

Currently, NicheAI provides a rich set of data, including Raw Data, generated Insights, and high-level Product details. However, this intelligence is locked within the application. For product, business, and tech teams to effectively utilize this data, they need robust, multi-level export options that allow them to extract data in various structured formats. Furthermore, as NicheAI grows, we need to ensure that compute/AI-intensive features (like exporting complex documentation) have the foundation to be linked to subscription limitations in the future.

## What Changes

Introduce a "Comprehensive Data Export & Documentation Generator" feature across the application.

- **Universal Export Buttons**: Add clear "Export" buttons to pages containing externally useful data (Raw Data Library, Insight Library, My Product).
- **Product Documentation Wizard**: On the "My Product" page, add a beautiful, multi-step wizard to generate structured documentation (One-Pager, PRD, OpenSpec Files).
- **Format Selection & Export Actions**: Support copying to clipboard and downloading as files (e.g., archived .zip for OpenSpec).
- **Subscription Stubs**: Set up architectural hooks (wrapper logic) for subscription-based limitations targeting high-value or AI-intensive features, though these limits will remain toggled off for now.

## Capabilities

### New Capabilities
- `data-export`: Universal functionality to export raw data and insights.
- `documentation-generator`: A multi-step UI wizard on the My Product page to generate and format product documentation.
- `subscription-hooks`: Underlying state and middleware stubs to support future tier-based feature limitations.

## Impact

This will require UI updates across multiple views (`Raw Data Library`, `Insight Library`, `My Product`). We must build a new multi-step wizard modal (`DocumentationWizardModal`) and implement file generation/zipping logic. State management (`src/types.ts` and context) will need minor updates to include subscription stub logic.
