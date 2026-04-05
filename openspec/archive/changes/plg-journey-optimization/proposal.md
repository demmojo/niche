## Why

Our PLG "Reverse Demo Hook" suffers from significant friction points that reduce conversion rates. User testing (observed by our Product and Design team) revealed four critical issues:

1. **The Jittering Waterfall:** Unpredictable Cumulative Layout Shifts (CLS) occur during the AI analysis stream in `TrustBuilderScreen`. When an unauthenticated user clicks an intent in `ZeroFrictionEntry`, the sudden collapse of buttons causes violent layout jumps.
2. **Context-Dropping Cliff (The Refresh Trap):** Hitting the PQL gate induces fear of data loss, and post-auth, the user faces "Contextual Whiplash" by landing in a blank workspace instead of a continued flow. Furthermore, if a user refreshes the page mid-flow, their entire local React state is wiped.
3. **Contextual Claustrophobia:** `CompetitorDiscoveryModal` and `DocumentationWizardModal` trap the user in heavy center-screen modals, severing their connection to their dashboard context.
4. **The Cognitive Dump & False Choices:** Generating PRDs/Specs streams as an overwhelming wall of markdown text, violating our progressive disclosure principles. Additionally, the `DocumentationWizardModal` forces users to curate insights _before_ choosing a format that might silently discard their curations (The "False Choice" trap).
5. **The Double-Hit Latency Penalty:** When users authenticate at the PQL gate, the system currently throws away the anonymous stream and re-runs the entire expensive Gemini/Exa operation from scratch, punishing the user with a 10-15 second wait time immediately after signing up.

## What Changes

This OpenSpec overhauls the PLG-to-Workspace journey by stabilizing the streaming UI, ensuring seamless state hydration across the auth boundary (via URL parameters and cached LLM responses), replacing heavy modals with persistent side drawers, and upgrading the document generation to use Generative UI (structured React components) with an inverted wizard flow.

## Capabilities

### New Capabilities

- `generative-ui-specs`: Streams AI output into structured, collapsible React components rather than raw markdown blocks.
- `persistent-side-drawers`: Replaces disruptive center modals with context-preserving side-sheets for complex generative tasks.

### Modified Capabilities

- `pql-auth-transition`: Upgrades the `AuthProvider` and PQL gating to enforce dual-token state hydration, URL-driven intent persistence, and immediate post-login value resume from a _cached_ state (eliminating the Double-Hit penalty).
- `streaming-stabilization`: Implements min-height skeletons (`min-h-[400px]`), strict non-auto-expanding accordions, and scroll anchoring for `TrustBuilderScreen` to eliminate CLS.

## Impact

This will require refactoring the `TrustBuilderScreen`, `ZeroFrictionEntry`, `CompetitorDiscoveryModal`, and `DocumentationWizardModal` components in `src/components/`, as well as updating the routing and state management in `src/App.tsx` and the Express BFF stream handling.
