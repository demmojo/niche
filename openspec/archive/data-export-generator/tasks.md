## 1. UI: Universal Export Buttons

-[x] 1.1 Create a reusable `ExportButton` component with standard styling and tooltip support.
-[x] 1.2 Integrate `ExportButton` into the Raw Data Library, allowing export of raw data sources (e.g., as CSV/JSON).
-[x] 1.3 Integrate `ExportButton` into the Insight Library, allowing export of generated insights.
-[x] 1.4 Integrate `ExportButton` into the My Product page to trigger the new Documentation Wizard.

## 2. Product Documentation Wizard (My Product Page)

-[x] 2.1 Build the base `DocumentationWizardModal` component with a multi-step progress indicator and smooth transitions.
-[x] 2.2 **Step 1:** Implement "Feature & Next Steps Selection" UI with multi-select controls for product features.
-[x] 2.3 **Step 2:** Implement "Insights Selection" UI with multi-select controls for product insights.
-[x] 2.4 **Step 3:** Implement "Format Selection" UI allowing choice between One-Pager, PRD, and OpenSpec Files.
-[x] 2.5 **Step 4:** Implement "Review & Export" view displaying the generated content.
-[x] 2.6 Add "Copy to Clipboard" functionality with success toast notifications.
-[x] 2.7 Add "Download/Export" functionality, including `.zip` generation logic for OpenSpec files (e.g., using `jszip`).

## 3. Subscription & Limitation Infrastructure (Stubs)

-[x] 3.1 Define a `SubscriptionTier` type and add a stubbed `subscriptionTier` field to the global user/app state.
-[x] 3.2 Create a `checkSubscriptionTier(action: string)` utility function that currently always allows the action.
-[x] 3.3 Wrap high-value actions (Export button clicks, AI generation steps in the wizard, global sync) with the `checkSubscriptionTier` utility.

## 4. Polish and State Handling

-[x] 4.1 Implement loading states (spinners) during data formatting or AI generation in the wizard.
-[x] 4.2 Add error handling boundaries for failed exports or generations.
-[x] 4.3 Ensure the export system blends naturally with the existing FhibliUI and design system.