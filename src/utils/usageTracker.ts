export interface KeyUsage {
  key: string;
  requestsToday: number;
  totalRequests: number;
  errors: number;
  lastUsed: string | null;
  service: 'gemini' | 'apollo' | 'exa' | 'openai' | 'anthropic';
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

const USAGE_STORAGE_KEY = 'api_usage_stats';
const KEYS_STORAGE_KEY = 'api_keys_usage';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const createEmptyServiceStats = (): ServiceUsageStats => ({
  requests: 0,
  requestsPerModel: {},
  estimatedInputTokens: 0,
  estimatedOutputTokens: 0,
  rateLimit: {
    limit: null,
    remaining: null,
    resetDate: null,
  }
});

export const getUsageStats = (): UsageStats => {
  const data = localStorage.getItem(USAGE_STORAGE_KEY);
  const today = getTodayDateString();
  
  if (data) {
    try {
      const parsed = JSON.parse(data) as UsageStats;
      if (parsed.date === today && parsed.services) {
        // Ensure all services exist
        ['gemini', 'apollo', 'exa', 'openai', 'anthropic'].forEach(service => {
          if (!parsed.services[service as keyof UsageStats['services']]) {
            parsed.services[service as keyof UsageStats['services']] = createEmptyServiceStats();
          }
        });
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse usage stats", e);
    }
  }
  
  return {
    date: today,
    services: {
      gemini: createEmptyServiceStats(),
      apollo: createEmptyServiceStats(),
      exa: createEmptyServiceStats(),
      openai: createEmptyServiceStats(),
      anthropic: createEmptyServiceStats(),
    }
  };
};

export const getKeyUsage = (): Record<string, KeyUsage> => {
  const data = localStorage.getItem(KEYS_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse key usage", e);
    }
  }
  return {};
};

export const updateRateLimits = (
  service: 'gemini' | 'apollo' | 'exa' | 'openai' | 'anthropic',
  limit: number | null,
  remaining: number | null,
  resetSec: number | null
) => {
  const stats = getUsageStats();
  const serviceStats = stats.services[service];

  let resetDate = null;
  if (resetSec) {
    resetDate = new Date(Date.now() + resetSec * 1000).toISOString();
  }

  serviceStats.rateLimit = {
    limit: limit !== null ? limit : serviceStats.rateLimit?.limit || null,
    remaining: remaining !== null ? remaining : serviceStats.rateLimit?.remaining || null,
    resetDate: resetDate !== null ? resetDate : serviceStats.rateLimit?.resetDate || null,
  };

  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(stats));
};

export const trackRequest = (
  service: 'gemini' | 'apollo' | 'exa' | 'openai' | 'anthropic',
  key: string,
  isError: boolean = false,
  model?: string
) => {
  const today = getTodayDateString();
  
  // Update global stats
  const stats = getUsageStats();
  const serviceStats = stats.services[service];

  if (!isError) {
    serviceStats.requests += 1;
    if (service === 'gemini' || service === 'openai' || service === 'anthropic') {
      const gModel = model || (service === 'gemini' ? 'gemini-3.1-flash-preview' : 'default');
      if (!serviceStats.requestsPerModel) {
        serviceStats.requestsPerModel = {};
      }
      serviceStats.requestsPerModel[gModel] = (serviceStats.requestsPerModel[gModel] || 0) + 1;
      // Rough estimation for AI
      serviceStats.estimatedInputTokens = (serviceStats.estimatedInputTokens || 0) + 1500; 
      serviceStats.estimatedOutputTokens = (serviceStats.estimatedOutputTokens || 0) + 500;
    }
  }
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(stats));
  
  if (!key) return; // Don't track key stats if no key is provided

  // Update key specific stats
  const keyUsage = getKeyUsage();
  if (!keyUsage[key]) {
    keyUsage[key] = {
      key,
      service,
      requestsToday: 0,
      totalRequests: 0,
      errors: 0,
      lastUsed: null
    };
  }
  
  // Reset daily counter if it's a new day
  const lastUsedDate = keyUsage[key].lastUsed ? keyUsage[key].lastUsed.split('T')[0] : null;
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
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keyUsage));
};

export const getResetTime = () => {
  // Gemini limits typically reset at midnight Pacific Time (PT)
  const now = new Date();
  const ptString = now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
  const ptDate = new Date(ptString);
  const diffMs = now.getTime() - ptDate.getTime();
  ptDate.setHours(24, 0, 0, 0);
  return new Date(ptDate.getTime() + diffMs);
};
