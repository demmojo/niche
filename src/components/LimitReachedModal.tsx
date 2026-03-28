import React from 'react';
import { AlertTriangle, Lock, X } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestIncrease: () => void;
}

export function LimitReachedModal({ isOpen, onClose, onRequestIncrease }: LimitReachedModalProps) {
  if (!isOpen) return null;

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
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
            <Lock size={32} />
            <div className="absolute -bottom-2 -right-2 bg-paper-light rounded-full p-1 border border-amber-500/20">
              <AlertTriangle size={14} className="text-amber-500" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold font-serif text-ink-dark mb-3">Alpha Limit Reached</h2>
          
          <p className="text-sm text-ink-dark/70 mb-6 leading-relaxed">
            We are currently in our Early Alpha phase. To manage the high costs of our AI and data providers (like Gemini and Exa.ai), we limit accounts to <strong>1 heavy AI discovery or global sync per day</strong>.
          </p>

          <div className="bg-paper-base rounded-xl p-4 mb-8 text-xs text-ink-dark/60 border border-ink-dark/10">
            You'll be able to run another discovery tomorrow. We appreciate your patience as we scale the platform!
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                onClose();
                onRequestIncrease();
              }}
              className="w-full py-3 bg-ink-dark text-paper-light rounded-xl font-medium hover:bg-black transition-colors shadow-sm"
            >
              Contact Us to Increase Limits
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-transparent text-ink-dark/70 hover:bg-ink-dark/5 rounded-xl font-medium transition-colors"
            >
              Okay, I understand
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
