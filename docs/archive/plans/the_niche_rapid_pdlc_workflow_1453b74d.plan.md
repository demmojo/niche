---
name: The Niche Rapid PDLC Workflow
overview: A 10-minute "Idea to Deployed App" workflow utilizing a Copilot Canvas (split-pane) UX to rapidly analyze markets, select niche features, generate code, and deploy via Cloudflare Pages.
todos:
  - id: copilot-canvas-layout
    content: Implement split-pane Copilot Canvas layout (Chat left, Artifacts right)
    status: completed
  - id: feature-selection-artifact
    content: Build the interactive 'Tinder for Features' Artifact for explicit accept/reject decisions
    status: completed
  - id: code-generation-engine
    content: Implement the Code Generation prompt chains and Code Viewer Artifact with Visual Tethering
    status: completed
  - id: cloudflare-integration
    content: Replace mocked Cloudflare endpoints with actual API integration for live deployment
    status: completed
  - id: terminal-ui
    content: Build the embedded terminal UI to stream live deployment logs
    status: completed
isProject: false
---

# The Niche Rapid PDLC Workflow

## Overview

Create the ultimate "Idea to Deployed App" pipeline capable of moving a founder or PM from raw concept to a live Cloudflare Pages deployment in under 10 minutes. This workflow will leverage the "Copilot Canvas" (Artifacts model) UX to seamlessly integrate competitor analysis, feature selection, strategic extraction, code generation, and deployment into a single, high-velocity interface.

## Problem Statement

Currently, building a hyper-niche app requires context switching across multiple disjointed tools (market research, planning, coding, deploying). In NicheAI, onboarding is disjointed (using legacy modals), code generation is only spec'd but not built, and Cloudflare deployment is purely mocked (`DeploymentWizardModal.tsx`). To serve rapid entrepreneurs and PMs, we need a unified, frictionless flow that maximizes the "data flywheel" effect by capturing explicit user decisions at every step.

## Proposed Solution: The Copilot Canvas Model

We will implement a split-pane interface: a conversational AI Copilot on the left, and dynamic, interactive "Artifacts" on the right. This allows users to converse naturally while directly manipulating generated strategies and code.

### The 10-Minute User Flow

1. **Add Product (Idea Ingestion):** User types a 1-2 sentence concept into the Copilot chat.
2. **Competitor/Market Analysis:** The Copilot streams a `CompetitorMatrix` Artifact onto the canvas using real-time web search/Exa data.
3. **Select Niche Features ("Tinder for Features"):** The Copilot generates a list of hyper-niche feature recommendations. Rendered as swipeable/clickable cards, the user explicitly Accepts (✅) or Rejects (❌) each feature. This builds the exact MVP scope and feeds the data flywheel.
4. **Extract Strategy:** Based on accepted features, the system renders a `SWOT` and `Opportunity Solution Tree` Artifact, allowing the user to visually confirm the strategic viability of their niche.
5. **Generate Code:** The canvas transitions to a Code Artifact. The system generates best-in-class React/Next.js frontend code (using shadcn/ui) mapping directly to the accepted features. A **"Strategy-to-Code Visual Tether"** allows users to hover a feature and see the exact lines of code that implement it.
6. **Deploy to Cloudflare Pages:** The user clicks `[🚀 DEPLOY]`. An integrated, read-only terminal replaces the code view, streaming live build logs (`wrangler pages deploy`) and returning the live URL.

## Technical Approach

### Architecture

- **UI Foundation:** Implement a resizable split-pane layout. Left pane: `InsightEngineChat.tsx` (adapted for workflow orchestration). Right pane: `ArtifactRenderer.tsx`.
- **State Management:** Use a finite state machine (e.g., xstate or strict React context) to manage the 6-step progression, ensuring data from Step 3 (Features) perfectly hydrates Step 5 (Code Gen).
- **Deployment:** Replace the mocked endpoints in `server.ts` and `DeploymentWizardModal.tsx` with actual Cloudflare API integrations (`@cloudflare/wrangler` or direct API calls) to provision and deploy projects dynamically.

### Implementation Phases

#### Phase 1: Copilot Canvas UI Foundation

- Build the split-pane layout.
- Create the `ArtifactRenderer` capable of mounting our existing templates (`CompetitorThreatMatrix`, `OpportunitySolutionTree`) dynamically based on Copilot state.
- Implement optimistic streaming with skeleton loaders for zero perceived latency.

#### Phase 2: "Tinder for Features" & Strategy Extraction

- Build the interactive Feature Selection Artifact.
- Wire up the explicit "Accept/Reject" feedback loop to save directly to the database (enriching the system's global data flywheel on feature viability).
- Auto-generate the SWOT/OST based strictly on the accepted feature set.

#### Phase 3: Code Generation Engine

- Implement the LLM prompt chains required to generate modular React/Next.js code matching the selected features.
- Build the Code Viewer Artifact with syntax highlighting and the "Visual Tether" hover interactions.

#### Phase 4: Cloudflare Pages Integration

- Build the backend service to communicate with Cloudflare's API.
- Implement the embedded terminal UI to stream build logs in real-time.
- Return the live `.pages.dev` URL directly in the Copilot chat upon completion.

## Acceptance Criteria

- User can input an idea and receive competitor analysis in < 30 seconds.
- User can explicitly accept/reject features, with rejections immediately updating the underlying strategy models.
- System generates valid React code corresponding to the accepted features.
- User can deploy the generated code to a live Cloudflare Pages URL directly from the UI without opening an external dashboard.
- The entire end-to-end flow can be completed in under 10 minutes.
