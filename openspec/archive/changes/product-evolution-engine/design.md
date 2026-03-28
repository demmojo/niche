## Context

Small, AI-empowered teams in 2026 can rapidly launch high-quality apps, making distribution the primary bottleneck. Generic software is commoditized, but hyper-niche micro-SaaS is thriving. NicheAI currently facilitates rapid competitor analysis and product development, but users need help proactively identifying defensible niches and injecting market-driven features into their products to evolve organically with AI.

## Goals / Non-Goals

**Goals:**

- Guide users away from horizontal "tarpit" ideas towards specific, underserved niches using evidence-based reasoning and iterative constraints.
- Provide a seamless "Suggestion Feed" that injects market data directly into the user's product features, complete with "Provenance Popovers."
- Enable users to rapidly deploy validation landing pages (smoke tests) with best-in-class React/Next.js code on Cloudflare Pages through a seamless Deployment Wizard.
- Provide native, in-dashboard "Fake Door" analytics by securely provisioning and querying Cloudflare Web Analytics via GraphQL.
- Facilitate organic product evolution via chat (Archivist Burt) with write-access to the product state.
- Establish a "Telemetry Bridge" (CLI webhook & manual UI) to sync local development progress back to the cloud dashboard for real-time capability gap analysis.
- Leverage the "Visual Intelligence Sync Engine" to parse competitor and self screenshots using a robust multi-modal ML pipeline (OmniParser + Claude 3.5 Sonnet / Gemini 1.5 Pro Vision).
- Integrate a Zero-Knowledge BYOK API gateway for secure image/text processing, ensuring API token limits are managed efficiently via image downscaling and pre-processing.

**Non-Goals:**

- NicheAI will not generate full backend application code. It focuses on the intelligence layer (validation specs, OpenSpecs), while tools like Cursor handle the execution layer.
- NicheAI will not force users into a single generic framework or hosting platform (e.g., Vercel's hobby tier for commercial use), but rather recommend modern, scalable, free-tier-friendly options like Cloudflare Pages.

## Decisions

**1. The "Niche Defensibility" Score (Tarpit Analyzer)**

- **Decision**: Automatically score product definitions against tracked competitors and AI capabilities to detect "Tarpits". Provide an educational "Tarpit Warning" with a flexible, iterative constraint loop rather than a rigid hard block.
- **Rationale**: NicheAI acts as an opinionated product strategist. If a user attempts to build a generic AI email client, the system explains _why_ it's a bad idea using reasoning and sources. Users can endlessly generate specific niche suggestions or write their own pivot, which NicheAI re-analyzes. The goal is to educate and guide through evidence.
- **Alternatives Considered**:
  - _Hard Block (3 Options)_: Initially considered, but rejected because users might feel arbitrarily locked out and abandon the app if none of the 3 options appeal to them.

**2. Market-Driven Feature Injection (The Suggestion Feed)**

- **Decision**: Surface a matter-of-fact "Suggestion Feed" that analyzes incoming data (e.g., G2 reviews, competitor matrix insights) and links every suggested feature back to its source using a "Provenance Popover."
- **Rationale**: This hybrid approach empowers users. They can review silent AI suggestions or explicitly highlight a cell in the Competitor Matrix to extract features. Transparency builds trust.
- **Alternatives Considered**:
  - _Auto-adding features directly to the roadmap_: Too aggressive; users need to maintain control and understand the "why" behind an addition.

**3. Validation Before Infrastructure (Fake Door Planning & Seamless Deployment Wizard)**

- **Decision**: The Documentation Wizard will offer a "Validation Spec" that outputs Markdown specs AND React/Next.js frontend code (leveraging shadcn/ui and Magic UI/Aceternity UI). Furthermore, it includes a "Seamless Deployment Wizard" that securely connects to the user's Cloudflare account (OAuth or Deep Link), auto-provisions Cloudflare Web Analytics, deploys the Next.js app to the edge (via OpenNext), and fetches the analytics via GraphQL to display "Fake Door Metrics" natively within NicheAI.
- **Rationale**: Tests the niche's distribution viability before writing backend code. The "AI Aesthetic" converts high-intent users. Crucially, non-technical founders abandon complex DevOps. By abstracting the Cloudflare deployment and embedding the analytics (focusing on the Visitor-to-Lead conversion metric, targeting 5%+ benchmarks), NicheAI provides a complete, frictionless validation loop.
- **Alternatives Considered**:
  - _Only Markdown specs_: Leaves users to figure out the landing page themselves, increasing the time to validation.
  - _Using Vercel or Netlify for hosting_: Vercel's Hobby tier prohibits commercial use (like collecting leads). Cloudflare Pages allows unlimited commercial smoke tests on its free edge network, making it the strategic choice for indie hackers.

**4. Feature Lifecycle Syncing (The Telemetry Bridge)**

- **Decision**: Support both a manual UI button and an automated CLI webhook tool to sync local OpenSpec progress.
- **Rationale**: Maintains a real-time "Version History" in the cloud dashboard. Enables comparative analyses (e.g., "Capability Gap" dashboard) between live features and competitor announcements.
- **Alternatives Considered**:
  - _Only Manual Syncing_: Too tedious; users forget to update web dashboards while coding locally.

**5. Visual Intelligence Sync Engine (The Mirror & The Lens)**

- **Decision**: Evolve basic visual intelligence into a high-fidelity "Sync Engine" leveraging modern ML pipelines.
- **Rationale**: Frictionless data entry (screenshots) combined with an intelligent diffing UI is crucial. Analyzing the user's own live product ("The Mirror") solves documentation drift by creating a "Reality Check" diff against `MyProductData`. Analyzing competitors ("The Lens") uses a 2-step pipeline (OmniParser bounding boxes + Claude/Gemini) to extract abstract features, rank their competitive importance via multi-modal AI prompt engineering, and display them in an "Actionable Overlay."
- **Alternatives Considered**:
  - _Direct multimodal LLM inference without pre-processing_: Found to cause hallucinations when mapping pixels to semantics. Added a pre-processing step (OmniParser) based on 2026 best practices.
  - _Direct client-side API calls for everything_: Deemed insecure or cost-ineffective for BYOK. Chose a proxy gateway (BYOK Architecture) to downscale images (max 1080p) and enforce token limits.

## Risks / Trade-offs

- **Risk: Tarpit Warning Resistance** -> Users might still insist on building generic products despite the educational warnings.
- **Mitigation**: The iterative constraint loop ensures they are fully informed, but ultimately allows them to proceed if they choose to ignore the evidence, preserving user autonomy while fulfilling the product strategist role.
- **Risk: Syncing Complexity** -> The CLI webhook might be difficult for less technical users to set up initially.
- **Mitigation**: Provide a clear, copy-paste setup guide during the OpenSpec export, and always offer the manual "Mark Complete" UI button as a fallback.
