---
title: Self-Healing Live Project Documentation
type: brainstorm
status: complete
date: 2026-03-27
---

# Self-Healing Live Project Documentation

## What We're Building

A completely automated, "self-healing" central documentation system for NicheAI. The core artifact will be the main `README.md`, which acts as the definitive developer portal and source of truth.

Instead of manually updating the README when new specs are added or commits are made, a deterministic script (`generate-docs.ts`) will compile a `README.template.md` by injecting live data (OpenSpec proposal tables, recent commit history, roadmap goals) alongside static, high-level project information (architecture, setup, env vars, contributing guidelines). This compilation will be triggered automatically on `pre-push` via Lefthook.

## Why This Approach

- **Prevents Documentation Rot:** AI-assisted coding moves faster than manual documentation. By treating docs as a compiled artifact from the codebase and OpenSpec DAG, the README is always accurate.
- **Zero Friction for Developers:** Running this on `pre-push` (instead of `pre-commit`) ensures the rapid local `git commit` loop remains instant.
- **Centralized Source of Truth:** Developers, new hires, and AI agents will have a single entry point that explains the entire system, linking out to specific OpenSpec directories for deep dives.
- **Data over LLM Hallucination:** We avoid letting an LLM arbitrarily rewrite the README (which destroys formatting and human voice). Instead, we use strict AST parsing of the `.openspec.yaml` files to build markdown tables deterministically.

## Key Decisions

### 1. Template-Driven Architecture

- Create `docs/templates/README.template.md`.
- This template will contain static sections written by humans/AI once:
  - Product Vision & Philosophy
  - Data Sources, Integrations, Security
  - Environment Variables
  - Setup, Run, Test, Contribute Instructions
- It will contain injection markers like `<!-- OPENSPEC_TABLE_START -->` and `<!-- GIT_HISTORY_START -->`.

### 2. The Generator Script (`generate-docs.ts`)

- Add a new command to `scripts/openspec-cli/index.ts`: `generate-docs`.
- The script will:
  1. Call `getAllSpecs()` from `utils.ts` to get all OpenSpecs.
  2. Parse the specs to build a Markdown table: Name, High-Level Summary (from `proposal.md`), Status, and relative Link.
  3. Execute `git log -n 10 --oneline` to grab recent momentum.
  4. Inject these into the template and overwrite the root `README.md`.
  5. Automatically `git add README.md` so the changes are included in the push.

### 3. Lefthook Integration

- Update `lefthook.yml` to include a `pre-push` hook that runs `npx tsx scripts/openspec-cli/index.ts generate-docs` and amends the commit or ensures the README is up to date before pushing.

## Open Questions

- _None left._

## Resolved Questions

- **When to trigger generation?** `pre-push` via Lefthook is chosen to balance accuracy with developer velocity.
- **How to prevent LLM formatting destruction?** Use a strict `.template.md` file with injection markers, entirely bypassing LLMs for the final markdown compilation.
