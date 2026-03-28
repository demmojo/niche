## ADDED Requirements

### Requirement: Universal Data Export
The system SHALL provide export capabilities for datasets in the Raw Data Library and Insight Library.

#### Scenario: User exports raw data
- **WHEN** a user clicks the "Export" button in the Raw Data Library
- **THEN** the system generates and downloads a structured file (e.g., CSV or JSON) containing the current raw data set.

### Requirement: Product Documentation Wizard
The system SHALL provide a multi-step wizard on the My Product page to generate structured documentation.

#### Scenario: User configures a PRD
- **WHEN** a user opens the wizard, selects specific features and insights, and chooses the "PRD" format
- **THEN** the system generates a comprehensive Product Requirements Document based on the selected criteria.

### Requirement: OpenSpec Archive Export
The system SHALL format OpenSpec File exports as an archived `.zip` file containing separated files for individual features.

#### Scenario: User exports OpenSpec files
- **WHEN** a user selects "OpenSpec Files" and clicks Download/Export
- **THEN** the system generates a `.zip` archive adhering to OpenSpec architectural best practices and triggers a download.

### Requirement: Future-Proofed Limitations
The system SHALL wrap high-value and AI-intensive actions in a subscription limitation check that currently defaults to "allowed".

#### Scenario: User triggers a high-value action
- **WHEN** a user initiates a data export or AI analysis
- **THEN** the system verifies the action against `checkSubscriptionTier()` before proceeding (which currently allows all actions).