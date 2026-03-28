import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Activity, Clock, DollarSign, Cpu, Link as LinkIcon, Copy, CheckCircle2 } from 'lucide-react';
import { getUsageStats, getResetTime, UsageStats } from '../utils/usageTracker';
import { getSelectedModel, setSelectedModel } from '../utils/geminiClient';

// Gemini 3.1 Pro Preview Pricing (Estimated)
// Input: $1.25 / 1M tokens
// Output: $5.00 / 1M tokens
const INPUT_PRICE_PER_M = 1.25;
const OUTPUT_PRICE_PER_M = 5.00;

export const Settings: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [selectedModel, setLocalSelectedModel] = useState(getSelectedModel());
  const [copied, setCopied] = useState(false);

  // Determine daily limit based on model
  const isProModel = selectedModel.includes('pro');
  const dailyRequestLimit = isProModel ? 50 : 1500;

  useEffect(() => {
    // Load initial data
    setStats(getUsageStats());
    
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

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    setLocalSelectedModel(model);
    setSelectedModel(model);
  };

  const copyWorkspaceLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stats) return null;

  const inputCost = (stats.estimatedInputTokens / 1000000) * INPUT_PRICE_PER_M;
  const outputCost = (stats.estimatedOutputTokens / 1000000) * OUTPUT_PRICE_PER_M;
  const totalCost = inputCost + outputCost;
  
  const requestsForModel = stats.requestsPerModel?.[selectedModel] || 0;
  const usagePercentage = Math.min(100, (requestsForModel / dailyRequestLimit) * 100);

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
            <h3 className="text-lg font-medium text-ink-dark">Model Selection</h3>
          </div>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-ink-dark/80 mb-2">Primary AI Model</label>
            <select 
              value={selectedModel}
              onChange={handleModelChange}
              className="w-full bg-paper-base border border-ink-dark/20 text-ink-dark text-sm rounded-lg focus:ring-ink-dark focus:border-ink-dark block p-2.5"
            >
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Best Reasoning)</option>
              <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash Preview (Fastest)</option>
              <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview (Cost Effective)</option>
              <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview</option>
              <option value="gemini-3-flash-preview">Gemini 3.0 Flash Preview</option>
            </select>
            <p className="mt-2 text-xs text-ink-dark/60">
              Select the model to be used for all AI operations. Pro models offer better reasoning for complex tasks, while Flash models are faster and more cost-effective.
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-ink-dark bg-white shadow-sm flex flex-col">
            <div className="flex items-center gap-2 text-ink-dark/60 mb-2">
              <Activity size={16} />
              <span className="text-sm font-medium uppercase tracking-wider">Today's Requests</span>
            </div>
            <div className="text-3xl font-semibold text-ink-dark mb-1">{requestsForModel}</div>
            <div className="text-xs text-ink-dark/50">
              {requestsForModel >= dailyRequestLimit ? 'Quota Exceeded' : `${dailyRequestLimit - requestsForModel} remaining today`}
            </div>
            <div className="mt-4 w-full bg-ink-dark/10 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
          </div>

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
              <span className="text-sm font-medium uppercase tracking-wider">Quota Reset</span>
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
              <div className="text-2xl font-mono text-ink-dark">{stats.estimatedInputTokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-ink-dark/60 mb-1">Estimated Output Tokens</div>
              <div className="text-2xl font-mono text-ink-dark">{stats.estimatedOutputTokens.toLocaleString()}</div>
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
