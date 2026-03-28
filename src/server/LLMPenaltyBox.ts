export type Provider = "openai" | "anthropic" | "gemini";
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface PenaltyBoxState {
  status: CircuitState;
  failures: number;
  nextAttempt: number;
}

/**
 *
 */
export class LLMPenaltyBox {
  private static instance: LLMPenaltyBox;
  private registry = new Map<Provider, PenaltyBoxState>();

  // 3 failures before penalty, 30s penalty duration
  private constructor(
    private threshold = 3,
    private penaltyMs = 30000,
  ) {}

  public static getInstance(): LLMPenaltyBox {
    if (!this.instance) {
      this.instance = new LLMPenaltyBox();
    }
    return this.instance;
  }

  public canAttempt(provider: Provider): boolean {
    const state = this.registry.get(provider);
    if (!state || state.status === "CLOSED") return true;

    if (state.status === "OPEN" && Date.now() > state.nextAttempt) {
      state.status = "HALF_OPEN";
      return true;
    }

    return state.status === "HALF_OPEN";
  }

  public recordResult(provider: Provider, statusCode: number) {
    if (statusCode < 400) {
      this.registry.set(provider, {
        status: "CLOSED",
        failures: 0,
        nextAttempt: 0,
      });
      return;
    }

    if (statusCode === 429 || statusCode >= 500) {
      const state = this.registry.get(provider) || {
        status: "CLOSED",
        failures: 0,
        nextAttempt: 0,
      };
      state.failures += 1;

      if (state.failures >= this.threshold) {
        state.status = "OPEN";
        state.nextAttempt = Date.now() + this.penaltyMs;
        console.warn(`🚨 [Circuit Breaker] ${provider} sent to Penalty Box!`);
      }
      this.registry.set(provider, state);
    }
  }

  public getResilientProvider(
    preferred: Provider,
    fallback: Provider,
  ): Provider {
    if (this.canAttempt(preferred)) return preferred;
    if (this.canAttempt(fallback)) return fallback;
    throw new Error("503: All configured AI providers are currently degraded.");
  }
}
