import React, { useState, useTransition } from "react";
import { Product, ForkProductInput } from "../types/product";
import { useAuth } from "./AuthProvider";
import { AlertCircle, Target, Users, Zap, Check, ArrowRight, Loader2, Copy } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

type ValidationArenaState = 
  | { type: 'idle' }
  | { type: 'forking', parentId: string }
  | { type: 'doubling_down', productId: string }
  | { type: 'error', message: string }
  | { type: 'success', message: string };

interface ValidationArenaProps {
  products: Product[];
  activeRootId: string;
}

export function ValidationArena({ products, activeRootId }: ValidationArenaProps) {
  const { user } = useAuth();
  const [state, setState] = useState<ValidationArenaState>({ type: 'idle' });
  const [isPending, startTransition] = useTransition();

  // Filter variants for the current root idea
  const variants = products.filter(p => p.rootId === activeRootId && (p.status === 'draft' || p.status === 'deployed_fake_door' || p.status === 'winner'));
  const hasWinner = variants.some(v => v.status === 'winner');

  const handleFork = async (parentId: string, name: string, reason: string, targetAudience?: string, jobToBeDone?: string) => {
    setState({ type: 'forking', parentId });
    try {
      const response = await fetch('/api/campaign/fork-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          parentId,
          name,
          forkReason: reason,
          targetAudience,
          jobToBeDone
        } as ForkProductInput)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fork variant");
      }
      
      startTransition(() => {
        setState({ type: 'success', message: 'Variant successfully created!' });
        setTimeout(() => setState({ type: 'idle' }), 3000);
      });
    } catch (e: any) {
      setState({ type: 'error', message: e.message });
    }
  };

  const handleDoubleDown = async (productId: string) => {
    setState({ type: 'doubling_down', productId });
    try {
      const response = await fetch('/api/campaign/double-down', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to double down");
      }
      
      startTransition(() => {
        setState({ type: 'success', message: 'Winner locked! Generating OpenSpec...' });
        setTimeout(() => setState({ type: 'idle' }), 3000);
      });
    } catch (e: any) {
      setState({ type: 'error', message: e.message });
    }
  };

  return (
    <div className="w-full h-full p-8 bg-paper-base overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-serif text-ink-dark flex items-center gap-3">
            <Target className="w-8 h-8 text-accent-red" />
            Validation Arena
          </h1>
          <p className="text-ink-dark/70 text-lg">
            Compare concurrent variants. Kill the weak, double down on the winner.
          </p>
          
          {state.type === 'error' && (
            <div className="p-4 bg-accent-red/10 text-accent-red border-l-4 border-accent-red mt-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {state.message}
            </div>
          )}
          {state.type === 'success' && (
            <div className="p-4 bg-accent-teal/10 text-accent-teal border-l-4 border-accent-teal mt-4 flex items-center gap-2">
              <Check className="w-5 h-5" />
              {state.message}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {variants.map(variant => (
            <VariantCard 
              key={variant.id} 
              variant={variant} 
              hasWinner={hasWinner}
              state={state}
              onFork={(name, reason, audience, jtbd) => handleFork(variant.id, name, reason, audience, jtbd)}
              onDoubleDown={() => handleDoubleDown(variant.id)}
            />
          ))}

          {variants.length < 3 && !hasWinner && (
            <div className="border-4 border-dashed border-ink-dark/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center min-h-[500px] bg-ink-dark/5">
              <Users className="w-12 h-12 text-ink-dark/30 mb-4" />
              <h3 className="text-xl font-bold text-ink-dark/50">Empty Slot</h3>
              <p className="text-ink-dark/40 mt-2 mb-6">
                You can run up to 3 concurrent hypothesis tests.
              </p>
              <p className="text-sm text-ink-dark/40 font-mono">
                Duplicate an existing variant to test a new niche.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VariantCard({ 
  variant, 
  hasWinner,
  state,
  onFork, 
  onDoubleDown 
}: { 
  variant: Product, 
  hasWinner: boolean,
  state: ValidationArenaState,
  onFork: (name: string, reason: string, audience?: string, jtbd?: string) => void,
  onDoubleDown: () => void
}) {
  const [forkModalOpen, setForkModalOpen] = useState(false);
  
  const { views, ctaClicks, emails } = variant.metricsSnapshot || { views: 0, ctaClicks: 0, emails: 0 };
  
  // The Rule of 5 check
  const isLowN = views < 100;
  
  // Heuristics (Resonance = Top of Funnel, Commitment = Bottom of Funnel)
  const resonance = views > 0 ? (ctaClicks / views) * 100 : 0;
  const commitment = ctaClicks > 0 ? (emails / ctaClicks) * 100 : 0;
  
  const isColdTraffic = variant.distributionChannel?.toLowerCase().includes("ads") || variant.distributionChannel?.toLowerCase().includes("cold");
  
  // Hardcoded contextual benchmarks
  const minWarmResonance = isColdTraffic ? 0.5 : 3.0;
  const minHotResonance = isColdTraffic ? 1.5 : 10.0;
  
  const minWarmCommitment = isColdTraffic ? 2.0 : 10.0;
  const minHotCommitment = isColdTraffic ? 5.0 : 20.0;

  const isResonanceGood = resonance >= minWarmResonance;
  const isCommitmentGood = commitment >= minWarmCommitment;
  
  let heuristicWarning = "";
  if (views > 0 && !isLowN) {
    if (!isResonanceGood && !isCommitmentGood) {
      heuristicWarning = "Dead variant. No one is clicking, no one is buying. Archive immediately.";
    } else if (!isResonanceGood && isCommitmentGood) {
      heuristicWarning = "Niche is correct, but messaging is weak. Improve the hook to drive more traffic.";
    } else if (isResonanceGood && !isCommitmentGood) {
      heuristicWarning = "High resonance, zero commitment. Price too high or product lacks trust. Pivot immediately.";
    } else if (resonance >= minHotResonance && commitment >= minHotCommitment) {
      heuristicWarning = "Scalable hit! Double down on this variant.";
    }
  }

  const isDoublingDown = state.type === 'doubling_down' && state.productId === variant.id;
  const isForking = state.type === 'forking' && state.parentId === variant.id;

  return (
    <div className={`relative border-4 rounded-2xl flex flex-col min-h-[500px] overflow-hidden ${
      variant.status === 'winner' ? 'border-accent-teal bg-accent-teal/5' : 'border-ink-dark bg-paper-base'
    } ${hasWinner && variant.status !== 'winner' ? 'opacity-50 grayscale' : ''}`}>
      
      {variant.status === 'winner' && (
        <div className="absolute top-0 left-0 right-0 bg-accent-teal text-white py-1 px-4 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <Check className="w-3 h-3" />
          Winning Variant
        </div>
      )}

      <div className={`p-6 ${variant.status === 'winner' ? 'pt-10' : ''} border-b-4 border-ink-dark flex-grow`}>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold font-serif text-ink-dark truncate pr-2">{variant.name}</h2>
          <span className={`px-2 py-1 text-xs font-bold uppercase border-2 border-ink-dark rounded-full ${
            variant.status === 'deployed_fake_door' ? 'bg-accent-gold/20' : 'bg-ink-dark/10'
          }`}>
            {variant.status.replace('_', ' ')}
          </span>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase text-ink-dark/50 tracking-wider mb-1">Target Audience</p>
            <p className="text-sm font-medium border-l-2 border-ink-dark pl-3 py-1">
              {variant.targetAudience || "Not defined"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-ink-dark/50 tracking-wider mb-1">Job To Be Done</p>
            <p className="text-sm font-medium border-l-2 border-ink-dark pl-3 py-1">
              {variant.jobToBeDone || "Not defined"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-xs font-bold uppercase text-ink-dark/50 tracking-wider mb-2 border-b-2 border-ink-dark/10 pb-2">
            Funnel Health
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-bold">Resonance (Clicks / Views)</span>
              <span className="font-mono">{ctaClicks} / {views}</span>
            </div>
            <div className="h-4 w-full border-2 border-ink-dark bg-ink-dark/5 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isResonanceGood ? 'bg-accent-teal' : 'bg-accent-red'} transition-all`}
                style={{ width: `${Math.min(100, isLowN ? (views > 0 ? 100 : 0) : resonance)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-bold">Commitment (Emails / Clicks)</span>
              <span className="font-mono">{emails} / {ctaClicks}</span>
            </div>
            <div className="h-4 w-full border-2 border-ink-dark bg-ink-dark/5 rounded-full overflow-hidden">
              <div 
                className={`h-full ${isCommitmentGood ? 'bg-accent-teal' : 'bg-accent-red'} transition-all`}
                style={{ width: `${Math.min(100, isLowN ? (ctaClicks > 0 ? 100 : 0) : commitment)}%` }}
              />
            </div>
          </div>
        </div>

        {views > 0 && (
          <div className="mt-6 p-4 bg-ink-dark/5 border-2 border-ink-dark rounded-xl">
            {isLowN ? (
              <p className="text-sm font-bold">
                Low-N Data Warning: You have {emails} emails. Contact them. If 2 agree to a call, you are validated. Ignore percentages until 100 views.
              </p>
            ) : (
              <p className={`text-sm font-bold ${heuristicWarning.includes('Pivot') || heuristicWarning.includes('Archive') ? 'text-accent-red' : 'text-accent-teal'}`}>
                {heuristicWarning}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-ink-dark/5 flex flex-col gap-3">
        {!hasWinner && variant.status === 'deployed_fake_door' && (
          <button 
            onClick={onDoubleDown}
            disabled={state.type !== 'idle'}
            className="w-full py-4 bg-ink-dark text-paper-base font-bold uppercase tracking-widest hover:bg-ink-dark/90 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isDoublingDown ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            Double Down
          </button>
        )}

        {!hasWinner && (
          <Dialog.Root open={forkModalOpen} onOpenChange={setForkModalOpen}>
            <Dialog.Trigger asChild>
              <button 
                disabled={state.type !== 'idle'}
                className="w-full py-3 border-2 border-ink-dark text-ink-dark font-bold uppercase tracking-wider hover:bg-ink-dark/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isForking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                Duplicate Variant
              </button>
            </Dialog.Trigger>
            
            <ForkModalContent 
              variant={variant}
              onClose={() => setForkModalOpen(false)}
              onSubmit={(name, reason, audience, jtbd) => {
                onFork(name, reason, audience, jtbd);
                setForkModalOpen(false);
              }}
            />
          </Dialog.Root>
        )}
      </div>
    </div>
  );
}

function ForkModalContent({ variant, onClose, onSubmit }: { 
  variant: Product, 
  onClose: () => void,
  onSubmit: (name: string, reason: string, audience?: string, jtbd?: string) => void 
}) {
  const [name, setName] = useState(`${variant.name} (Pivot)`);
  const [reason, setReason] = useState("");
  const [audience, setAudience] = useState(variant.targetAudience || "");
  const [jtbd, setJtbd] = useState(variant.jobToBeDone || "");

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-ink-dark/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
      <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg bg-paper-base border-4 border-ink-dark rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] p-8 z-50 animate-in zoom-in-95 duration-200">
        <Dialog.Title className="text-2xl font-bold font-serif mb-2">Fork Variant</Dialog.Title>
        <Dialog.Description className="text-ink-dark/70 mb-6">
          Define a single, isolated variable to test against the original.
        </Dialog.Description>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">Variant Name</label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border-2 border-ink-dark bg-transparent p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal" 
              placeholder="e.g. Dentists Landing Page"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-2">Fork Reason / Hypothesis</label>
            <input 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border-2 border-ink-dark bg-transparent p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal" 
              placeholder="e.g. Testing a highly specific niche"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">New Target Audience</label>
              <textarea 
                value={audience}
                onChange={e => setAudience(e.target.value)}
                className="w-full h-24 border-2 border-ink-dark bg-transparent p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal resize-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2">New Job To Be Done</label>
              <textarea 
                value={jtbd}
                onChange={e => setJtbd(e.target.value)}
                className="w-full h-24 border-2 border-ink-dark bg-transparent p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal resize-none" 
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 border-2 border-transparent text-ink-dark font-bold uppercase hover:bg-ink-dark/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(name, reason, audience, jtbd)}
            disabled={!name || !reason}
            className="px-6 py-2 bg-ink-dark text-paper-base font-bold uppercase tracking-wider hover:bg-ink-dark/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            Fork <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
