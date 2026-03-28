import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Activity, Clock, DollarSign, Cpu, Link as LinkIcon, Copy, CheckCircle2, Key } from 'lucide-react';
import { getUsageStats, getResetTime, UsageStats } from '../utils/usageTracker';
import { fetchAvailableModels, getSelectedModels, setSelectedModels, AIModel } from '../utils/aiClient';
import { getCustomApiKey, setCustomApiKey } from '../utils/apiKeys';

// Gemini 3.1 Pro Preview Pricing (Estimated)
// Input: $1.25 / 1M tokens
// Output: $5.00 / 1M tokens
const INPUT_PRICE_PER_M = 1.25;
const OUTPUT_PRICE_PER_M = 5.00;

export const Settings: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [selectedModels, setLocalSelectedModels] = useState<string[]>(getSelectedModels());
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [copied, setCopied] = useState(false);

  // API Key State
  const [geminiKey, setGeminiKeyState] = useState(getCustomApiKey('gemini') || '');
  const [apolloKey, setApolloKeyState] = useState(getCustomApiKey('apollo') || '');
  const [exaKey, setExaKeyState] = useState(getCustomApiKey('exa') || '');
  const [openaiKey, setOpenaiKeyState] = useState(getCustomApiKey('openai') || '');
  const [anthropicKey, setAnthropicKeyState] = useState(getCustomApiKey('anthropic') || '');

  // Determine daily limit based on model (fallback if no rate limit headers)
  const primaryModel = selectedModels[0] || 'gemini-3.1-flash-preview';
  const isProModel = primaryModel.includes('pro');
  const dailyRequestLimit = isProModel ? 50 : 1500;

  useEffect(() => {
    // Load initial data
    setStats(getUsageStats());
    
    // Fetch models
    const loadModels = async () => {
      setIsFetchingModels(true);
      try {
        const models = await fetchAvailableModels();
        setAvailableModels(models);
      } catch (e) {
        console.error("Failed to fetch models", e);
      } finally {
        setIsFetchingModels(false);
      }
    };
    loadModels();
    
    // Update countdown timer
    const updateTimer = () => {
      const resetTime = getResetTime().getTime();
      const now = new Date().getTime();
      const diff = resetTime - now;
      
      if (diff <= 0) {
        setTimeUntilReset('Resetting soon...');
        return;
      }
      
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    // Poll for usage updates every 5 seconds
    const usageInterval = setInterval(() => {
      setStats(getUsageStats());
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(usageInterval);
    };
  }, []);

  const handleModelChange = (index: number, e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModels = [...selectedModels];
    newModels[index] = e.target.value;
    
    // Remove empty strings from the middle, ensuring priority order is compact
    const filtered = newModels.filter((m, i) => m || i === 0);
    // Ensure primary model is never empty
    if (!filtered[0]) filtered[0] = 'gemini-3.1-flash-preview';
    
    setLocalSelectedModels(filtered);
    setSelectedModels(filtered);
  };

  const handleSaveKeys = async () => {
    setCustomApiKey('gemini', geminiKey);
    setCustomApiKey('apollo', apolloKey);
    setCustomApiKey('exa', exaKey);
    setCustomApiKey('openai', openaiKey);
    setCustomApiKey('anthropic', anthropicKey);
    // Could add a toast here
    
    setIsFetchingModels(true);
    try {
      const models = await fetchAvailableModels();
      setAvailableModels(models);
    } catch (e) {} finally {
      setIsFetchingModels(false);
    }
  };

  const copyWorkspaceLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stats) return null;

  const geminiStats = stats.services.gemini;
  const apolloStats = stats.services.apollo;
  const exaStats = stats.services.exa;

  const inputCost = ((geminiStats.estimatedInputTokens || 0) / 1000000) * INPUT_PRICE_PER_M;
  const outputCost = ((geminiStats.estimatedOutputTokens || 0) / 1000000) * OUTPUT_PRICE_PER_M;
  const totalCost = inputCost + outputCost;
  
  const requestsForModel = geminiStats.requestsPerModel?.[primaryModel] || 0;
  
  // Use real rate limits if available, otherwise fall back to local tracking & estimated limits
  const geminiLimit = geminiStats.rateLimit?.limit || dailyRequestLimit;
  const geminiRemaining = geminiStats.rateLimit?.remaining !== null && geminiStats.rateLimit?.remaining !== undefined 
                          ? geminiStats.rateLimit.remaining 
                          : Math.max(0, dailyRequestLimit - requestsForModel);
  const geminiUsagePerc = Math.min(100, ((geminiLimit - geminiRemaining) / geminiLimit) * 100);

  const apolloLimit = apolloStats.rateLimit?.limit || 100; // default assumed
  const apolloRemaining = apolloStats.rateLimit?.remaining !== null && apolloStats.rateLimit?.remaining !== undefined 
                          ? apolloStats.rateLimit.remaining 
                          : Math.max(0, 100 - apolloStats.requests);
  const apolloUsagePerc = Math.min(100, ((apolloLimit - apolloRemaining) / apolloLimit) * 100);

  const exaLimit = exaStats.rateLimit?.limit || 1000; // default assumed
  const exaRemaining = exaStats.rateLimit?.remaining !== null && exaStats.rateLimit?.remaining !== undefined 
                          ? exaStats.rateLimit.remaining 
                          : Math.max(0, 1000 - exaStats.requests);
  const exaUsagePerc = Math.min(100, ((exaLimit - exaRemaining) / exaLimit) * 100);


  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end mb-8 mt-4">
          <div>
            <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
              設定
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
              Settings
            </h1>
            <p className="text-[#8A8A8A] text-sm font-sans mt-2">
              Manage models, API keys, and monitor your usage.
            </p>
          </div>
        </div>

        {/* Workspace Link */}
        <div className="p-6 rounded-xl border border-ink-dark bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon size={18} className="text-ink-dark" />
            <h3 className="text-lg font-medium text-ink-dark">Workspace Collaboration</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-dark">
                Share this workspace
              </p>
              <p className="text-xs text-ink-dark/60 mt-1">
                Anyone with this link can access and edit this workspace. No login required.
              </p>
            </div>
            <button 
              onClick={copyWorkspaceLink}
              className="flex items-center gap-2 px-4 py-2 bg-ink-dark text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div className="p-6 rounded-xl border border-ink-dark bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-ink-dark" />
            <h3 className="text-lg font-medium text-ink-dark">Model Selection (Fallback Strategy)</h3>
          </div>
          <p className="mb-4 text-xs text-ink-dark/60">
            Select up to 3 models. If the primary model fails or hits a rate limit, the system will automatically fall back to the next model in the list.
          </p>
          <div className="max-w-md space-y-4">
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-ink-dark/80 mb-2">
                  {index === 0 ? "Primary AI Model" : `Fallback Model ${index}`}
                </label>
                <div className="flex gap-2">
                  <select 
                    value={selectedModels[index] || ''}
                    onChange={(e) => handleModelChange(index, e)}
                    className="w-full bg-paper-base border border-ink-dark/20 text-ink-dark text-sm rounded-lg focus:ring-ink-dark focus:border-ink-dark block p-2.5"
                  >
                    {index !== 0 && <option value="">-- None (Stop retrying) --</option>}
                    {availableModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys Management */}
        <div className="p-6 rounded-xl border border-ink-dark bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} className="text-ink-dark" />
            <h3 className="text-lg font-medium text-ink-dark">API Keys (BYOK)</h3>
          </div>
          <p className="text-sm text-ink-dark/60 mb-4">
            Override the default system quotas by providing your own API keys. Keys are stored locally in your browser.
          </p>
          <div className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="geminiKey" className="block text-sm font-medium text-ink-dark/80 mb-1">Gemini API Key</label>
              <input 
                id="geminiKey"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKeyState(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-paper-base border border-ink-dark/20 text-ink-dark text-sm rounded-lg focus:ring-ink-dark focus:border-ink-dark block p-2.5"
              />
            </div>
            <div>
              <label htmlFor="apolloKey" className="block text-sm font-medium text-ink-dark/80 mb-1">Apollo API Key</label>
              <input 
                id="apolloKey"
                type="password"
                value={apolloKey}
                onChange={(e) => setApolloKeyState(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-paper-base border border-ink-dark/20 text-ink-dark text-sm rounded-lg focus:ring-ink-dark focus:border-ink-dark block p-2.5"
              />
            </div>
            <div>
              <label htmlFor="exaKey" className="block text-sm font-medium text-ink-dark/80 mb-1">Exa API Key</label>
              <input 
                id="exaKey"
                type="password"
                value={exaKey}
                onChange={(e) => setExaKeyState(e.target.value)}
                placeholder="ex-..."
                className="w-full bg-paper-base border border-ink-dark/20 text-ink-dark text-sm rounded-lg focus:ring-ink-dark focus:border-ink-dark block p-2.5"
              />
            </div>
            <div>
              <label htmlFor="openaiKey" className="block text-sm font-medium text-ink-dark/80 mb-1">OpenAI API Key (ChatGPT)</label>
              <input 
                id="openaiKey"
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKeyState(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-paper-base border border-ink-dark/20 text-ink-dark text-sm rounded-lg focus:ring-ink-dark focus:border-ink-dark block p-2.5"
              />
            </div>
            <div>
              <label htmlFor="anthropicKey" className="block text-sm font-medium text-ink-dark/80 mb-1">Anthropic API Key (Claude)</label>
              <input 
                id="anthropicKey"
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKeyState(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-paper-base border border-ink-dark/20 text-ink-dark text-sm rounded-lg focus:ring-ink-dark focus:border-ink-dark block p-2.5"
              />
            </div>
            <button 
              onClick={handleSaveKeys}
              disabled={isFetchingModels}
              className="mt-2 px-4 py-2 bg-ink-dark text-white rounded-lg hover:bg-black transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isFetchingModels ? "Saving & Fetching Models..." : "Save Keys"}
            </button>
          </div>
        </div>

        {/* Real-time Quota Dashboard */}
        <div className="p-6 rounded-xl border border-ink-dark bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-ink-dark" />
            <h3 className="text-lg font-medium text-ink-dark">Real-time Quota Dashboard (Estimated Local Usage)</h3>
          </div>
          <div className="space-y-6">
            
            {/* Primary AI Quota */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-ink-dark">AI Requests ({primaryModel})</span>
                <span className="text-ink-dark/60">
                  {geminiLimit - geminiRemaining} / {geminiLimit} 
                </span>
              </div>
              <div className="w-full bg-ink-dark/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${geminiUsagePerc > 90 ? 'bg-red-500' : geminiUsagePerc > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: `${geminiUsagePerc}%` }}
                ></div>
              </div>
            </div>

            {/* Apollo Quota */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-ink-dark">Apollo Enrichment Requests</span>
                <span className="text-ink-dark/60">
                  {apolloLimit - apolloRemaining} / {apolloLimit}
                </span>
              </div>
              <div className="w-full bg-ink-dark/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${apolloUsagePerc > 90 ? 'bg-red-500' : apolloUsagePerc > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: `${apolloUsagePerc}%` }}
                ></div>
              </div>
              {apolloStats.rateLimit?.resetDate && (
                <div className="text-xs text-ink-dark/40 mt-1">Resets: {new Date(apolloStats.rateLimit.resetDate).toLocaleString()}</div>
              )}
            </div>

            {/* Exa Quota */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-ink-dark">Exa Search Requests</span>
                <span className="text-ink-dark/60">
                  {exaLimit - exaRemaining} / {exaLimit}
                </span>
              </div>
              <div className="w-full bg-ink-dark/10 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${exaUsagePerc > 90 ? 'bg-red-500' : exaUsagePerc > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: `${exaUsagePerc}%` }}
                ></div>
              </div>
              {exaStats.rateLimit?.resetDate && (
                <div className="text-xs text-ink-dark/40 mt-1">Resets: {new Date(exaStats.rateLimit.resetDate).toLocaleString()}</div>
              )}
            </div>

          </div>
        </div>

        {/* Cost & Token Estimation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-ink-dark bg-white shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-ink-dark/60 mb-2">
              <DollarSign size={16} />
              <span className="text-sm font-medium uppercase tracking-wider">Projected Cost</span>
            </div>
            <div className="text-3xl font-semibold text-ink-dark mb-1">${totalCost.toFixed(4)}</div>
            <div className="text-xs text-ink-dark/50">
              Based on Gemini 3.1 Pro Preview rates
            </div>
            <div className="mt-auto pt-4 flex justify-between text-xs text-ink-dark/60">
              <span>In: ${(inputCost).toFixed(4)}</span>
              <span>Out: ${(outputCost).toFixed(4)}</span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-ink-dark bg-white shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-ink-dark/60 mb-2">
              <Clock size={16} />
              <span className="text-sm font-medium uppercase tracking-wider">Gemini Quota Reset</span>
            </div>
            <div className="text-3xl font-semibold text-ink-dark mb-1 font-mono">{timeUntilReset || 'Calculating...'}</div>
            <div className="text-xs text-ink-dark/50">
              Resets daily at Midnight PT
            </div>
          </div>
        </div>

        {/* Token Estimation */}
        <div className="p-6 rounded-xl border border-ink-dark bg-white shadow-sm">
          <h3 className="text-lg font-medium text-ink-dark mb-4">Token Usage Estimation</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-sm text-ink-dark/60 mb-1">Estimated Input Tokens</div>
              <div className="text-2xl font-mono text-ink-dark">{(geminiStats.estimatedInputTokens || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-ink-dark/60 mb-1">Estimated Output Tokens</div>
              <div className="text-2xl font-mono text-ink-dark">{(geminiStats.estimatedOutputTokens || 0).toLocaleString()}</div>
            </div>
          </div>
          <p className="text-xs text-ink-dark/40 mt-4">
            * Token counts are estimated based on average request sizes (1500 in / 500 out) as exact token counts are not returned by the streaming API in this implementation.
          </p>
        </div>

      </div>
    </div>
  );
};
