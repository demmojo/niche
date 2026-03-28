# Documentation Wizard

A wizard modal that exports high-level product details and insights into actionable deliverables such as One-Pagers, PRDs, and OpenSpec archives.

## Features

### 1. Wizard Navigation
- **Requirement:** REQ-DOCWIZARD-01: The wizard must consist of four sequential steps: Features & Next Steps, Insights Selection, Format Selection, and Review & Export.
- **Requirement:** REQ-DOCWIZARD-02: The user must be able to navigate to the next step or back to the previous step using the footer navigation buttons.
- **Requirement:** REQ-DOCWIZARD-03: The "Next" button must be disabled on Step 4 (Review & Export), replaced by an option to close the modal ("Done").
- **Requirement:** REQ-DOCWIZARD-04: The "Back" button must be disabled and hidden on Step 1 and Step 4.

### 2. Features & Next Steps Selection (Step 1)
- **Requirement:** REQ-DOCWIZARD-05: The system must prepopulate the selected features and next steps with all available items from `myProductData`.
- **Requirement:** REQ-DOCWIZARD-06: The user must be able to toggle individual features and strategy items on or off.
- **Requirement:** REQ-DOCWIZARD-07: The user must have a "Select All / None" option to bulk toggle features or strategy items.

### 3. Insights Selection (Step 2)
- **Requirement:** REQ-DOCWIZARD-08: The system must display a list of all derived insights.
- **Requirement:** REQ-DOCWIZARD-09: The user must be able to select individual insights to include in the generated document.
- **Requirement:** REQ-DOCWIZARD-10: The user must have a "Select All / None" option to bulk toggle insights.

### 4. Format Selection (Step 3)
- **Requirement:** REQ-DOCWIZARD-11: The system must provide three export format options: "One-Pager", "PRD", and "OpenSpec Archive".
- **Requirement:** REQ-DOCWIZARD-12: The user must select exactly one format to proceed.
- **Requirement:** REQ-DOCWIZARD-13: The "Generate Document" button must be disabled until a format is selected.

### 5. Document Generation & Export (Step 4)
- **Requirement:** REQ-DOCWIZARD-14: The system must display a loading state ("Generating Documentation...") for 1.5 seconds to simulate processing.
- **Requirement:** REQ-DOCWIZARD-15: After generation, the system must display a preview of the text for "One-Pager" and "PRD" formats, or a placeholder message for the "OpenSpec Archive" format.
- **Requirement:** REQ-DOCWIZARD-16: The user must be able to copy the generated text to the clipboard (unless the format is "OpenSpec Archive").
- **Requirement:** REQ-DOCWIZARD-17: The system must provide visual feedback ("Copied!") for 2 seconds when the text is copied.
- **Requirement:** REQ-DOCWIZARD-18: The user must be able to download the generated document. For "One-Pager" and "PRD", it must be a Markdown (`.md`) file. For "OpenSpec Archive", it must be a ZIP (`.zip`) archive containing a defined structure of files (`.openspec.yaml`, `README.md`, `features/`, `insights/`).

## Scenarios
- **WHEN** the user opens the Documentation Wizard Modal
- **THEN** the modal opens on Step 1 (Features & Next Steps) with all available product features and strategies pre-selected.

- **WHEN** the user is on Step 3 and has not yet selected a format
- **THEN** the "Generate Document" button is disabled.

- **WHEN** the user selects the "OpenSpec" format on Step 3 and clicks "Generate Document"
- **THEN** the system simulates generation, transitions to Step 4, and hides the "Copy to Clipboard" button because the output is a ZIP archive.

- **WHEN** the user clicks the "Export Archive (.zip)" button on Step 4
- **THEN** the system generates a ZIP file client-side containing the selected features and insights and initiates a file download.

- **WHEN** the user clicks "Copy to Clipboard" for a generated "One-Pager" or "PRD"
- **THEN** the text is copied to the system clipboard and the button temporarily changes to indicate a successful copy.