# NicheAI PLG Builder Journey: Design Proposal & Heuristics

## 1. Visual & Structural Iteration Summary

I have iteratively developed a high-fidelity HTML/CSS prototype of the **"Intelligence Sidebar"** and **"Director Node Graph"** to engineer the Endowment Effect and eliminate "AI Slop."

The final design (Iteration 3) achieves a "Technical Luxury" aesthetic:

- **Color Palette:** Deep true black (`#050505`) and graphite (`#121212`) create focus, while Vivid Orange (`#F97316`) serves as the strict accent for actionable, high-leverage UI elements (e.g., Active Nodes, Execution buttons).
- **Typography:** `Plus Jakarta Sans` for dense, highly legible structural UI, paired with `IBM Plex Mono` for data and code. This avoids generic "startup" fonts and grounds the UI in a "builder/developer" ethos.
- **Node Graph Architecture:** Smooth, messy curves were replaced with rigid, orthogonal SVG lines with animated dashes. This visually communicates structured execution (a DAG) rather than a chaotic brainstorming whiteboard.

---

## 2. Design Heuristics to Engineer the GTM Loop (Endowment Effect)

To ensure the product acts as its own growth engine, the UX enforces the following psychological heuristics:

### H1: The IKEA Effect via "Tactile Vectors"

**Implementation:** The "Thesis Vectors" in the sidebar are designed as dragged-and-dropped "tags" (e.g., `Target Solo-Preneurs`, `Offline-First Arch`).
**Psychology:** By forcing the user to assemble these constraints rather than passively reading a generated paragraph, the user feels ownership over the idea. They _built_ the thesis.

### H2: The "Blue Ocean" Gratification (Data Density)

**Implementation:** The Intelligence Sidebar features a "Market Validation" section with a prominent **Viability Index (e.g., 92/100)** and a circular SVG gauge, supported by sparklines showing competitor density.
**Psychology:** This replaces subjective AI cheerleading with objective-looking data. Finding a "Validated Niche" with only 3 competitors triggers a dopamine hit. The user is highly unlikely to abandon an idea mathematically proven to be a "Blue Ocean" (driving PQL conversion).

### H3: The "Cockpit" Paradigm (Anti-Slop)

**Implementation:** The Director Node Graph presents code generation as discrete, blockable nodes (e.g., `schema.ts`). The active node contains a native IDE-like code snippet with `Approve & Merge` vs. `Request Changes` buttons.
**Psychology:** The AI is framed as a junior developer submitting PRs, not an omniscient chat bot. The user retains executive control (Human-In-The-Loop). There are zero text-generation "chat bubbles."

### H4: The Vault Gate (Friction as a Feature)

**Implementation:** The primary Call-to-Action (`GENERATE EXECUTION SPEC`) is styled as a massive, heavy button locked behind an `Authentication Required` state.
**Psychology:** Because the user has already invested time assembling the vectors (H1) and validating the market data (H2), the auth-wall feels like a necessary step to "save their hard work," rather than an annoying marketing blockade.

---

_You can view the interactive HTML/Tailwind prototype I generated at `canvas-nicheai-director.html` in the workspace root._
