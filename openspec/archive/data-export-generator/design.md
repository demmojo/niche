## Context

NicheAI generates high-value competitive intelligence and product insights. To be truly actionable, this data must be portable. Different teams need data at different levels of granularity: raw data for analysts, insights for strategists, and comprehensive product documentation for engineering teams. 

## Goals / Non-Goals

**Goals:**
- Provide export capabilities on the Raw Data Library, Insight Library, and My Product pages.
- Build a multi-step wizard on the My Product page for generating One-Pagers, PRDs, and OpenSpec files.
- Enable users to select specific features and insights to include in the generated documentation.
- Provide "Copy to Clipboard" and "Export/Download" (including .zip for OpenSpec) functionality.
- Implement stubs for future subscription-based limits on intensive features.

**Non-Goals:**
- Enforcing the subscription limits right now (only building the stubs).
- Building exports for every single minor component; focusing on the three main data hubs.

## Decisions

**1. Universal Export Functionality**
- **Decision**: Introduce a reusable `ExportButton` component that triggers context-aware export logic based on the current view.
- **Rationale**: Ensures a consistent UI/UX across the application while remaining highly discoverable.

**2. Product Documentation Wizard UI**
- **Decision**: Create a `DocumentationWizardModal` with a step-based architecture (Step 1: Features & Next Steps, Step 2: Insights, Step 3: Format, Step 4: Review).
- **Rationale**: A wizard flow breaks down the complex generation process into intuitive, manageable steps with clear progress indicators.

**3. File Generation & Zipping**
- **Decision**: Utilize client-side libraries (like `jszip`) to generate and package OpenSpec files into a `.zip` archive.
- **Rationale**: Avoids unnecessary backend dependency for file formatting when the client already possesses all the necessary data.

**4. Subscription Architecture Stubs**
- **Decision**: Create a `checkSubscriptionTier(action)` utility and state management stubs that currently always return `true` or `allowed`. 
- **Rationale**: Future-proofs the application. When monetization is introduced, the checks are already in place around high-value actions (export, AI analysis, sync).

## Risks / Trade-offs

- **Risk: Large File Exports Freezing UI** -> Generating complex PRDs or large OpenSpec zip files could block the main thread.
- **Mitigation**: Implement robust loading states (spinners) during generation and consider using web workers if payload size becomes a bottleneck.
- **Risk: AI Generation Costs** -> Generating extensive PRDs using AI could be costly if abused.
- **Mitigation**: The subscription stubs being introduced will specifically target and limit these intensive actions in the future.
