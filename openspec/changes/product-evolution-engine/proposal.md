> **NOTICE:** This spec has been **superseded** by `unified-ideation-and-evolution`. Do not implement tasks from this spec.

## Why

The bottleneck for small teams has structurally shifted in 2026. Code generation is commoditized; the true challenges are **Distribution** and **Finding a Defensible Niche**. Building another horizontal CRM is a death sentence for an indie hacker, while building one for a specific, underserved niche is a goldmine. NicheAI must act as an opinionated product strategist that helps teams iterate on their product definition organically based on real market data, ensuring they are building something highly specific, underserved, and distribution-ready.

## What Changes

NicheAI will evolve from tracking a static "My Product" object into an **Evolution Engine**. Users can start with a seed idea, ingest market data, competitor features, and AI-identified gaps. The system will proactively suggest features via a "Suggestion Feed," intelligently flag horizontal "tarpit" ideas with iterative constraint loops, and orchestrate the generation of Validation Specs (smoke tests) and PRDs to feed into AI coding agents.

## Capabilities

### New Capabilities

- `tarpit-analyzer`: Automatically scores user product definitions against tracked competitors and AI capabilities, intervening with educational warnings and iterative refinement loops for horizontal, commoditized ideas.
- `market-feature-injection`: A hybrid "Suggestion Feed" that silently analyzes incoming data (e.g., G2 reviews, competitor updates) and surfaces actionable features linked directly to their provenance.
- `validation-spec-generator`: An extension of the Documentation Wizard that outputs ready-to-deploy React/Next.js landing page code (optimized for Cloudflare Pages) for immediate smoke testing. Includes embedded Cloudflare Web Analytics to measure visitor-to-lead conversion intent natively.
- `seamless-deployment-wizard`: A new consumer-grade UI flow that guides non-technical founders through connecting their Cloudflare account (via OAuth or deep-linked API token), auto-provisioning analytics, deploying the React app to the edge, and fetching the resulting analytics via GraphQL to display a "Fake Door Metrics" dashboard within NicheAI.
- `proactive-pm-chat`: Grants the `MarketAnalysis` AI chat (Archivist Burt) write-access to the `MyProductData` state to propose and instantly track features during conversations.
- `visual-feature-extraction`: Uses the Visual Intelligence Sync Engine to parse uploaded screenshots of competitors ("The Lens") or the user's own product ("The Mirror"). Utilizes a two-step multi-modal ML pipeline (OmniParser + Claude 3.5 Sonnet / Gemini 1.5 Pro Vision) to extract UI elements, map them to abstract features with competitive importance scores, and surface them in a split-screen "Actionable Overlay" triage UI with bounding boxes and "Provenance Popovers".
- `byok-secure-gateway`: A secure proxy architecture for handling user API keys (BYOK - Bring Your Own Key) for both text and image workloads. Includes token cap enforcement, image downscaling for LLM context optimization, and a Zero-Knowledge approach to user keys via secret vault logic.
- `telemetry-sync-bridge`: A CLI webhook tool (and manual UI button) to sync local OpenSpec progress (e.g., in Cursor) back to the NicheAI cloud dashboard for real-time "Version History" and "Capability Gap" analysis.

### Modified Capabilities

- `my-product-state`: Expanded `MyProductData` schema to handle feature provenance, webhook sync statuses, and AI write-access permissions.
- `documentation-wizard`: Expanded to offer "Validation Specs" alongside OpenSpecs and One-Pagers.

## Impact

- **UI/UX:** Major updates to the Product Definition flow, introducing the Tarpit Warning modal and iterative constraint UI. New "Suggestion Feed" widget and "Provenance Popovers."
- **Data Model:** `MyProductData` will require schema modifications.
- **Backend/Integrations:** New CLI webhook endpoints for telemetry syncing, integration with external generative UI tools/patterns (v0, Lovable, shadcn/ui) for landing page generation, and visual intelligence processing pipelines.
- **AI Core:** Enhanced prompts and tools for Archivist Burt to manage product state directly.
