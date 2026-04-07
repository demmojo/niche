export interface KeyUsage {
  key: string;
  requestsToday: number;
  totalRequests: number;
  errors: number;
  lastUsed: string | null;
  service: "gemini" | "apollo" | "exa" | "openai" | "anthropic";
}

export interface RateLimitData {
  limit: number | null;
  remaining: number | null;
  resetDate: string | null;
}

export interface ServiceUsageStats {
  requests: number;
  requestsPerModel?: Record<string, number>;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  rateLimit?: RateLimitData;
}

import { safeStorageGet, safeStorageSet } from "./storage";

export interface UsageStats {
  date: string;
  services: {
    gemini: ServiceUsageStats;
    apollo: ServiceUsageStats;
    exa: ServiceUsageStats;
    openai: ServiceUsageStats;
    anthropic: ServiceUsageStats;
  };
}

const USAGE_STORAGE_KEY = "api_usage_stats";
const KEYS_STORAGE_KEY = "api_keys_usage";

/**
 *
 */
const getTodayDateString = () => new Date().toISOString().split("T")[0];

/**
 *
 */
const createEmptyServiceStats = (): ServiceUsageStats => ({
  requests: 0,
  requestsPerModel: {},
  estimatedInputTokens: 0,
  estimatedOutputTokens: 0,
  rateLimit: {
    limit: null,
    remaining: null,
    resetDate: null,
  },
});

let cachedUsageStats: UsageStats | null = null;
let cachedKeyUsage: Record<string, KeyUsage> | null = null;
let flushTimeout: any = null;

/**
 *
 */
const flushToStorage = () => {
  if (cachedUsageStats) {
    safeStorageSet(USAGE_STORAGE_KEY, JSON.stringify(cachedUsageStats));
  }
  if (cachedKeyUsage) {
    safeStorageSet(KEYS_STORAGE_KEY, JSON.stringify(cachedKeyUsage));
  }
  flushTimeout = null;
};

/**
 *
 */
const scheduleFlush = () => {
  if (!flushTimeout) {
    flushTimeout = setTimeout(flushToStorage, 3000);
  }
};

/**
 *
 */
export const getUsageStats = (): UsageStats => {
  const today = getTodayDateString();
  if (cachedUsageStats && cachedUsageStats.date === today) {
    return cachedUsageStats;
  }

  const data = safeStorageGet(USAGE_STORAGE_KEY);
  let parsed: any = null;
  if (data) {
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse usage stats", e);
    }
  }

  if (parsed && parsed.date === today && parsed.services) {
    ["gemini", "apollo", "exa", "openai", "anthropic"].forEach((service) => {
      if (!parsed.services[service]) {
        parsed.services[service] = createEmptyServiceStats();
      }
    });
    cachedUsageStats = parsed;
    return cachedUsageStats!;
  }

  cachedUsageStats = {
    date: today,
    services: {
      gemini: createEmptyServiceStats(),
      apollo: createEmptyServiceStats(),
      exa: createEmptyServiceStats(),
      openai: createEmptyServiceStats(),
      anthropic: createEmptyServiceStats(),
    },
  };
  return cachedUsageStats;
};

/**
 *
 */
export const getKeyUsage = (): Record<string, KeyUsage> => {
  if (cachedKeyUsage) return cachedKeyUsage;

  const data = safeStorageGet(KEYS_STORAGE_KEY);
  if (data) {
    try {
      cachedKeyUsage = JSON.parse(data);
      return cachedKeyUsage!;
    } catch (e) {
      console.error("Failed to parse key usage", e);
    }
  }
  cachedKeyUsage = {};
  return cachedKeyUsage;
};

/**
 *
 */
export const updateRateLimits = (
  service: "gemini" | "apollo" | "exa" | "openai" | "anthropic",
  limit: number | null,
  remaining: number | null,
  resetSec: number | null,
) => {
  const stats = getUsageStats();
  const serviceStats = stats.services[service];

  let resetDate = null;
  if (resetSec) {
    resetDate = new Date(Date.now() + resetSec * 1000).toISOString();
  }

  serviceStats.rateLimit = {
    limit: limit !== null ? limit : serviceStats.rateLimit?.limit || null,
    remaining:
      remaining !== null
        ? remaining
        : serviceStats.rateLimit?.remaining || null,
    resetDate:
      resetDate !== null
        ? resetDate
        : serviceStats.rateLimit?.resetDate || null,
  };

  scheduleFlush();
};

/**
 *
 */
export const trackRequest = (
  service: "gemini" | "apollo" | "exa" | "openai" | "anthropic",
  key: string,
  isError: boolean = false,
  model?: string,
  tokens?: { input: number; output: number },
) => {
  const today = getTodayDateString();

  const stats = getUsageStats();
  const serviceStats = stats.services[service];

  if (!isError) {
    serviceStats.requests += 1;
    if (
      service === "gemini" ||
      service === "openai" ||
      service === "anthropic"
    ) {
      const gModel =
        model || (service === "gemini" ? "gemini-3.1-pro-preview" : "default");
      if (!serviceStats.requestsPerModel) {
        serviceStats.requestsPerModel = {};
      }
      serviceStats.requestsPerModel[gModel] =
        (serviceStats.requestsPerModel[gModel] || 0) + 1;

      serviceStats.estimatedInputTokens =
        (serviceStats.estimatedInputTokens || 0) + (tokens?.input || 1500);
      serviceStats.estimatedOutputTokens =
        (serviceStats.estimatedOutputTokens || 0) + (tokens?.output || 500);
    }
  }

  if (key) {
    const keyUsage = getKeyUsage();
    if (!keyUsage[key]) {
      keyUsage[key] = {
        key,
        service,
        requestsToday: 0,
        totalRequests: 0,
        errors: 0,
        lastUsed: null,
      };
    }

    const lastUsedDate = keyUsage[key].lastUsed
      ? keyUsage[key].lastUsed.split("T")[0]
      : null;
    if (lastUsedDate !== today) {
      keyUsage[key].requestsToday = 0;
    }

    if (isError) {
      keyUsage[key].errors += 1;
    } else {
      keyUsage[key].requestsToday += 1;
      keyUsage[key].totalRequests += 1;
    }

    keyUsage[key].lastUsed = new Date().toISOString();
  }

  scheduleFlush();
};

/**
 *
 */
export const getResetTime = () => {
  const now = new Date();
  const ptString = now.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  });
  const ptDate = new Date(ptString);
  const diffMs = now.getTime() - ptDate.getTime();
  ptDate.setHours(24, 0, 0, 0);
  return new Date(ptDate.getTime() + diffMs);
};
