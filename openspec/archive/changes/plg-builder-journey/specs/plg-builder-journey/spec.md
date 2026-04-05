# Spec

## Post-Gate Execution: The Director

### 1. Embedded Onboarding (Anti-Popup Strategy)

- Implement **Ghost Nodes**: At the top of the node graph, display a static, non-interactive dashed node.
  - _Text:_ "The AI breaks features into atomic phases and pauses. Nothing is coded until you approve."
  - _State:_ Only visible if user mastery state is `NOVICE`.
- Implement **Placeholder Progression**: In the review pane's comment box, use contextual placeholders instead of labels.
  - _Placeholder:_ "See an issue? Ask the AI to revise this schema..."
- Implement **Inline Empty States**: For nodes that are blocked by a pending approval, show a lock icon with contextual text.
  - _Text:_ "Locked. The AI will draft these routes after you approve the Database Schema in Phase 02."

### 2. Node Graph & HITL Review Pane

- **Active Node State:** The node currently awaiting user input should have a pulsating `Acid Yellow` (`#E3FF00`) border indicator.
- **Node Content:** Nodes must display raw technical artifacts (e.g., Markdown tables, JSON schemas, syntax-highlighted code blocks). **No conversational AI filler.**
- **Action Buttons:**
  - `[Approve]`: Primary button (`Acid Yellow`). Collapses the node and triggers the next step in the pipeline.
  - `[Reject]`: Danger button. Discards the proposal and requests a new generation.
  - `[Revise]`: Triggered via the comment box. Submits specific constraints back to the LLM.

### 3. Progressive Commitment State (Pre-Gate to Post-Gate)

- **Pre-Gate:** The "Custom Features" and node graph area are overlaid with `backdrop-filter: blur(4px)` and a `grayscale(50%)` filter, centered with a lock icon.
- **Transition:** Upon successful Firebase `linkWithPopup` authentication, remove the blur and grayscale classes immediately. Do not trigger a full page reload.

### 4. Technical Constants

- Typography: Headers (`Bricolage Grotesque`), Monospace/Data (`IBM Plex Mono`).
- Backgrounds: Dark mode (`#050505`) for the right pane, stark white for the left pane (Strategy Canvas).
