# Proposal: Brand Positioning Wizard

## Why

Many founders fall into the "tarpit" of generic branding, leading to an undifferentiated product that struggles to stand out. By leveraging real market data to extract competitor branding, we can intelligently guide founders toward a differentiated, hyper-niche brand positioning. This perfectly aligns with NicheAI's "Guided Experience" and "Niche over Horizontal" principles.

## What Changes

We are introducing a Brand Identity & Positioning Wizard. This feature will scrape 3-5 competitor URLs, parse their visual and tonal identities using AI, and map them onto a "Sea of Sameness" 2x2 matrix. The wizard will then help the founder find the "whitespace" in the market through guided UI flows and proactive contrast warnings.

## Capabilities

- **Competitor Ingestion:** Extracts visual identity (colors, typography) and positioning (tone, audience) from competitor URLs using Firecrawl and Gemini Flash.
- **Sea of Sameness Dashboard:** Visualizes competitors on a Generative 2x2 Positioning Matrix and a Competitor Mood Board.
- **The Magic Button & Guided Wizard:** Founders can Auto-Generate a differentiated brand identity or use a progressive 3-step wizard (Vibe -> Colors -> Typography) with opinionated defaults.
- **Live Competitor Context:** Proactively warns founders via contextual popovers if their stylistic choices drift into the undifferentiated "Tarpit."

## Impact

- **High Value, Low Cost:** Strongly differentiates the platform while remaining extremely cheap (estimated <$0.02 per user execution).
- **User Success:** Empowers founders to build highly differentiated, "Blue Ocean" products.
- **Data Integrity:** Employs rigorous security and graceful degradation fallbacks to handle unpredictable scraping workflows smoothly.
