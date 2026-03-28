import React from 'react';
import { AlertTriangle, X, Zap } from 'lucide-react';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestIncrease: () => void;
  message?: string;
}

/**
 *
 */
export function RateLimitModal({ isOpen, onClose, onRequestIncrease, message }: RateLimitModalProps) {
  if (!isOpen) return null;

  const isCustomKey = message?.includes('RateLimit:CustomKey:');
  const isGlobalKey = message?.includes('RateLimit:GlobalKey:');
  
  let displayMessage = "We've hit an API rate limit. Please try again in a few moments.";
  let displayTitle = "API Rate Limit Exceeded";
  
  if (isCustomKey) {
    displayTitle = "Custom Key Rate Limit";
    displayMessage = "The API key you provided has reached its quota or rate limit. Please check your provider's dashboard or upgrade your tier.";
  } else if (isGlobalKey) {
    displayTitle = "System Quota Reached";
    displayMessage = "NicheAI's shared API quota has been temporarily exhausted due to high demand. Please add your own API keys in Settings to continue without interruption, or request a higher limit.";
  }

  // Check if we passed a raw message from the upstream error we want to expose
  const rawMessageMatch = message?.replace('RateLimit:CustomKey:', '')?.replace('RateLimit:GlobalKey:', '');
  const rawDetails = rawMessageMatch;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-paper-light rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-ink-dark/10 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-ink-dark/5 rounded-full transition-colors z-10"
        >
          <X size={20} className="text-ink-dark/60" />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
            <AlertTriangle size={32} />
            <div className="absolute -bottom-2 -right-2 bg-paper-light rounded-full p-1 border border-red-500/20">
              <Zap size={14} className="text-red-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold font-serif text-ink-dark mb-3">{displayTitle}</h2>
          
          <p className="text-sm text-ink-dark/70 mb-4 leading-relaxed">
            {displayMessage}
          </p>
          
          {rawDetails && (
            <div className="bg-red-50 text-red-900 rounded-lg p-3 mb-6 text-xs text-left overflow-x-auto whitespace-pre-wrap border border-red-100">
              {rawDetails}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button 
              onClick={() => {
                onClose();
                onRequestIncrease();
              }}
              className="w-full py-3 bg-ink-dark text-paper-light rounded-xl font-medium hover:bg-black transition-colors shadow-sm"
            >
              Request Higher Limits / Support
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-transparent text-ink-dark/70 hover:bg-ink-dark/5 rounded-xl font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
