import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { MessageSquare, AlertCircle, Lightbulb, Check } from 'lucide-react';
import { FeedbackMessage } from '../types';

export function SupportHelpPage({ user, initialType = 'General' }: { user: any, initialType?: 'Bug' | 'Feature' | 'General' | 'Limit Increase Request' }) {
  const [type, setType] = useState<'Bug' | 'Feature' | 'General' | 'Limit Increase Request'>(initialType);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const feedback: Omit<FeedbackMessage, 'id'> = {
        type,
        message,
        timestamp: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email,
      };
      
      await addDoc(collection(db, 'alpha_feedback'), feedback);
      setSubmitted(true);
      setMessage('');
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-accent-teal/10 text-accent-teal rounded-full flex items-center justify-center mb-6">
          <Check size={32} />
        </div>
        <h2 className="text-2xl font-bold font-serif text-ink-dark mb-2">Thank You!</h2>
        <p className="text-ink-dark/70 mb-8">Your feedback has been successfully submitted to the NicheAI team. We appreciate your help in shaping the future of our product during this Alpha phase.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="px-6 py-2 bg-paper-base border border-ink-dark/20 rounded-xl hover:bg-ink-dark/5 text-ink-dark font-medium transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-ink-dark tracking-tight mb-2">Support & Feedback</h1>
        <p className="text-ink-dark/60">Help us improve NicheAI. Let us know if you found a bug, have a feature request, or just want to share your thoughts.</p>
      </div>

      <div className="bg-paper-light border border-ink-dark/20 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-ink-dark mb-3">Feedback Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setType('Bug')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  type === 'Bug' ? 'bg-accent-coral/10 border-accent-coral text-accent-coral' : 'bg-paper-base border-ink-dark/10 text-ink-dark/70 hover:border-ink-dark/30'
                }`}
              >
                <AlertCircle size={18} /> Bug Report
              </button>
              
              <button
                type="button"
                onClick={() => setType('Feature')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  type === 'Feature' ? 'bg-accent-teal/10 border-accent-teal text-accent-teal' : 'bg-paper-base border-ink-dark/10 text-ink-dark/70 hover:border-ink-dark/30'
                }`}
              >
                <Lightbulb size={18} /> Feature Request
              </button>
              
              <button
                type="button"
                onClick={() => setType('General')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  type === 'General' ? 'bg-accent-purple/10 border-accent-purple text-accent-purple' : 'bg-paper-base border-ink-dark/10 text-ink-dark/70 hover:border-ink-dark/30'
                }`}
              >
                <MessageSquare size={18} /> General Feedback
              </button>
              
              <button
                type="button"
                onClick={() => setType('Limit Increase Request')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  type === 'Limit Increase Request' ? 'bg-ink-dark text-paper-light border-ink-dark' : 'bg-paper-base border-ink-dark/10 text-ink-dark/70 hover:border-ink-dark/30'
                }`}
              >
                <AlertCircle size={18} /> Increase Limits
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-dark mb-2">Your Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe the issue, share your idea, or provide details..."
              className="w-full h-40 p-3 bg-paper-base border border-ink-dark/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-teal/50 resize-none font-sans text-sm"
              required
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-ink-dark/10">
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="px-6 py-2.5 bg-ink-dark text-paper-light rounded-xl font-medium transition-colors hover:bg-black disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
