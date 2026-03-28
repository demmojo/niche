# Iterate UI Skill

**Description:** Visually inspects and iterates on UI components using the `cursor-ide-browser` MCP server to ensure top-tier, intent-based design when no Figma files are available.

**Trigger:** Use when the user asks to "iterate on the UI", "check the design visually", "review UX", or "polish the component".

## Workflow

1.  **Understand the Goal:** Identify the component or page being iterated on. Read `.cursor/rules/ui-ux-excellence.mdc` to understand the standard for top-tier UI.
2.  **Start the Dev Server (if not running):** Check the `terminals/` folder to see if the development server (e.g., `npm run dev`) is running. If not, start it in the background on the correct port (usually `localhost:3000` or `localhost:5173`).
3.  **Navigate & Inspect (Using MCP):**
    - Use the `cursor-ide-browser` MCP server to navigate (`browser_navigate`) to the correct local URL for the component/page.
    - Lock the browser (`browser_lock`).
    - Take a snapshot (`browser_snapshot`) to capture the rendered UI and DOM structure.
4.  **Analyze the Snapshot:**
    - Compare the rendered output against the "UI/UX Excellence" principles.
    - Check for: cramped spacing, poor visual hierarchy, lack of progressive disclosure, missing empty states, or confusing primary actions.
    - If there are visual issues (e.g., text bleeding, broken layout), identify the CSS/Tailwind classes responsible.
5.  **Iterate & Fix:**
    - Modify the React/Vue/Svelte code to fix the issues, applying generous whitespace, clear typography, and intent-based design.
    - Wait a few seconds for Hot Module Replacement (HMR) to trigger.
    - Take another snapshot (`browser_snapshot`) to verify the fix.
6.  **Unlock & Report:**
    - Unlock the browser (`browser_unlock`).
    - Present a summary of the UI/UX improvements made to the user.

## Important Notes

- Always rely on the `browser_snapshot` for visual context since you don't have Figma.
- Prioritize reducing cognitive load for the user in your iterations.
