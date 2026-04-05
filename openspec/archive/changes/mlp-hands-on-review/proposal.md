# Proposal: MLP Deep Hands-On Product Review

## Why

As NicheAI approaches its Minimum Lovable Product (MLP) launch, we must ensure the application delivers on its Product-Led Growth (PLG) strategy. Founders often drop off during onboarding if the Time-To-First-Value (TTFV) is too high or if the UI induces cognitive overload. AI-native applications introduce unique UX challenges such as long wait times, hallucinatory outputs, and complex state transitions from anonymous teaser sessions to authenticated workspaces. We must ensure our "Reverse Demo Hook" works flawlessly.

## What Changes

We are conducting a comprehensive, hands-on product review spanning four key areas:

1. **Anonymous / PLG Flow (The Hook):** Security and anti-abuse mechanisms, rate-limit upsell UX, and explainable AI states.
2. **The Auth Transition (The PQL Gate):** PQL triggers, state freeze to prevent flickering, and seamless account merging with immediate value resume.
3. **Authenticated Workspace (The Value Delivery):** Opinionated wizards, cognitive load management, and Human-in-the-Loop (HITL) triage.
4. **Technical UX & AI Stress Test (The Trust Builder):** Stream cancellation, split React contexts for performance, and keyboard accessibility.

## Capabilities

- **Anonymous Tarpit Handling:** Active pushback and education on overly broad ideas before hitting a paywall.
- **Seamless Activation:** Preservation of anonymous state through OAuth popups with automatic continuation.
- **Explainable States:** Replacing generic spinners with low-latency trust anchors while LLMs process.
- **Secure Anti-Abuse Integration:** Strict Express backend validation, AppCheck integration, and truncation limits to protect resources.

## Impact

- **TTFV:** Reduced to < 60 seconds for a cold user.
- **PQL Conversion Rate:** Maximized via seamless transition from `pql_gate` event to authenticated workspace.
- **UI Responsiveness:** Zero fatal Error Boundaries during rapid tab switching or stream cancellations.
