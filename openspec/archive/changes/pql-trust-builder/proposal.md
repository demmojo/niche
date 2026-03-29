# PQL Reverse Demo Hook & Trust Builder

## Why

The current Product Qualified Lead (PQL) flow and ideation validation experience suffers from three critical issues:

1. **Low Trust During Wait Times**: Generic wait states miss opportunities to build anticipation and trust.
2. **AI Forcibly Changing Niche Ideas**: Hyper-niche ideas are frequently overwritten due to standard semantic clustering classifying them into saturated tarpits.
3. **Weak PQL Gate**: The standard sign-up wall fails to leverage the Reverse Demo Hook psychology (Endowment Effect and Loss Aversion).

## What Changes

The ideation flow is being revamped into a Trust-Building Progressive Disclosure journey, culminating in a high-converting PQL gate. Key changes include:

- **Trust Builder Loading Screen**: Streams real market data via an Async Job Queue, decoupled from UI animations to prevent thrashing.
- **Idea Preservation Override**: Modifies the scoring engine to respect hyper-niche ideas using highly optimized vector math.
- **Reverse Demo PQL Gate**: A contextual, loss-aversion-driven modal with blurred generated artifacts and a secure Dual-Token Account Linking Flow to prevent IDOR.

## Capabilities

- PQL Gating
- Idea Validation UI
- Tarpit Analyzer

## Impact

- **UX**: Significant increase in Time-to-Value (TTV) perception and PQL conversion rates.
- **Frontend**: Overhaul of `PQLGateModal.tsx`, new `TrustBuilderScreen`, and strict state machines.
- **Backend/AI**: Highly optimized `tarpitAnalyzer.ts` and `scoringEngine.ts` with streaming intermediate steps.
