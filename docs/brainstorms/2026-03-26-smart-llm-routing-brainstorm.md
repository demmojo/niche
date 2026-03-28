# Brainstorm: Smart LLM Routing

## What We're Building

A robust, autonomous LLM routing system that balances cost, speed, and intelligence. By default, the system will use "fast" models (like Gemini 3.0 Flash, Claude 3.5 Haiku) for simple tasks and "pro" models (like Gemini 3.1 Pro, Claude 3.7 Sonnet) for critical, complex reasoning flows.

Users will not be burdened with configuring models for every individual feature. Instead, they simply provide their API keys and choose either "Auto (Smart Routing)" or a specific "Main Model" to override the auto-routing globally.

## Why This Approach

Currently, the application relies on a static list of selected models and falls back linearly if one fails. This is inefficient: using a Pro model for a simple formatting task wastes tokens and adds latency, while using a Flash model for deep competitor synthesis yields poor results.
By hardcoding the "tier" (fast vs. pro) into the application code at the call site, we ensure optimal performance. Allowing a single global override gives power users control without UI clutter.

## Key Decisions

1. **Model Tiers**: We will categorize available models into two tiers: `fast` and `pro`.
2. **Auto-Routing Logic**:
   - When the global setting is "Auto", `withModelFallback` will check the requested tier for the current flow.
   - It will then look at the user's available API keys to determine the best provider (prioritizing Gemini as the default free tier, then Claude/OpenAI if custom keys are present).
   - It will select the appropriate model from that provider's tier.
3. **Global Override**: If the user selects a specific model in `Settings.tsx` (e.g., "Claude 3.7 Sonnet"), that model will be used for _all_ flows, ignoring the `fast/pro` requested tier.
4. **Call Site Updates**: Every invocation of `withModelFallback` in the app will need an updated signature to declare its required tier: `withModelFallback(operation, { tier: 'fast' })` or `withModelFallback(operation, { tier: 'pro' })`.

## Open Questions

- **Fallback across providers in Auto mode?** If Auto mode chooses Gemini Pro but it rate limits, should it fall back to Claude Pro (if the key exists)? (Recommendation: Yes, fallback across available providers within the same tier).
- **Default Keys:** How does this interact with the built-in `process.env.GEMINI_API_KEY`? (Recommendation: The built-in key is treated as the lowest-priority fallback for Gemini models).
