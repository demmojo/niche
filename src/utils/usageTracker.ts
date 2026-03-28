export interface KeyUsage {
  key: string;
  requestsToday: number;
  totalRequests: number;
  errors: number;
  lastUsed: string | null;
}

export interface UsageStats {
  date: string;
  requests: number;
  requestsPerModel: Record<string, number>;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

const USAGE_STORAGE_KEY = 'gemini_api_usage';
const KEYS_STORAGE_KEY = 'gemini_api_keys_usage';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const getUsageStats = (): UsageStats => {
  const data = localStorage.getItem(USAGE_STORAGE_KEY);
  const today = getTodayDateString();
  
  if (data) {
    const parsed = JSON.parse(data) as UsageStats;
    if (parsed.date === today) {
      if (!parsed.requestsPerModel) {
        parsed.requestsPerModel = {};
      }
      return parsed;
    }
  }
  
  return {
    date: today,
    requests: 0,
    requestsPerModel: {},
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0
  };
};

export const getKeyUsage = (): Record<string, KeyUsage> => {
  const data = localStorage.getItem(KEYS_STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return {};
};

export const trackRequest = (key: string, isError: boolean = false, model: string = 'gemini-3-flash-preview') => {
  const today = getTodayDateString();
  
  // Update global stats
  const stats = getUsageStats();
  if (!isError) {
    stats.requests += 1;
    if (!stats.requestsPerModel) {
      stats.requestsPerModel = {};
    }
    stats.requestsPerModel[model] = (stats.requestsPerModel[model] || 0) + 1;
    // Rough estimation for 3.1 Pro preview
    stats.estimatedInputTokens += 1500; 
    stats.estimatedOutputTokens += 500;
  }
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(stats));
  
  // Update key specific stats
  const keyUsage = getKeyUsage();
  if (!keyUsage[key]) {
    keyUsage[key] = {
      key,
      requestsToday: 0,
      totalRequests: 0,
      errors: 0,
      lastUsed: null
    };
  }
  
  // Reset daily counter if it's a new day (we'll just use lastUsed to check if it was today)
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
  // Let's calculate the next midnight PT
  const now = new Date();
  
  // Create a date object for current time in PT
  const ptString = now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
  const ptDate = new Date(ptString);
  
  // Calculate the difference between actual UTC time and the parsed PT local time
  const diffMs = now.getTime() - ptDate.getTime();
  
  // Set to next midnight in the parsed local time
  ptDate.setHours(24, 0, 0, 0);
  
  // Add the difference back to get the true absolute time of midnight PT
  return new Date(ptDate.getTime() + diffMs);
};
