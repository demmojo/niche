# Proposal: Superadmin Pipeline (Lean MLP GTM)

## Why

We need to launch a Lean "Minimum Lovable Product" (MLP) asynchronous Go-To-Market strategy. The previous architecture (5-agent DAG and iterative chat dashboard) is too bloated. We need a faster time-to-market with a "Wizard of Oz" approach that guarantees high quality while securely capturing Product-Qualified Leads (PQLs).

## What Changes

- Replaces the complex 5-agent architecture with a focused 2-agent pipeline (DataGatherer and ReportSynthesizer).
- Introduces a "Two-Phase Fetch" on the frontend to provide an instant "Surface Roast" to hook users, followed by an async deep-dive.
- Adds a raw Markdown Superadmin Editor for quick human-in-the-loop approvals.
- Gates final report delivery behind Firebase Auth to capture user data.

## Capabilities

- **Instant Hook:** gemini-3.1-flash provides an immediate 3-bullet point assessment.
- **Async Intelligence:** gemini-3.1-pro synthesizes Exa/Apollo API data for high-quality reports.
- **Admin Queue:** Superadmins can review, edit, and approve drafts in < 5 minutes.
- **Rate Limiting:** Protects the founder by pausing frontend submissions if >50 reports are pending.

## Impact

Prevents the "12-hour dopamine void" for new users, guarantees extremely high-quality outputs via human intervention, avoids compounding AI errors, and securely captures high-intent PQLs for the business.
