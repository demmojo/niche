import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { FeedbackMessage } from '../types';
import { AlertCircle, Lightbulb, MessageSquare, Loader2 } from 'lucide-react';

/**
 *
 */
export function SuperadminDashboard({ isSuperadmin }: { isSuperadmin: boolean }) {
  const [feedback, setFeedback] = useState<FeedbackMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperadmin) return;

    /**
     *
     */
    const fetchFeedback = async () => {
      try {
        const q = query(collection(db, 'alpha_feedback'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackMessage));
        setFeedback(results);
      } catch (err) {
        console.error("Error fetching feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [isSuperadmin]);

  if (!isSuperadmin) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center text-ink-dark/60">
        <AlertCircle size={32} className="mb-4 text-accent-coral mx-auto" />
        <p>Access Denied. You must be a superadmin to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-ink-dark/40" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-ink-dark tracking-tight mb-2">Alpha Feedback Dashboard</h1>
        <p className="text-ink-dark/60">Review feature requests and bug reports submitted by early alpha testers.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {feedback.length === 0 ? (
          <div className="bg-paper-light border border-ink-dark/20 rounded-2xl p-12 text-center text-ink-dark/50">
            No feedback submitted yet.
          </div>
        ) : (
          feedback.map(item => (
            <div key={item.id} className="bg-paper-light border border-ink-dark/20 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    item.type === 'Bug' ? 'bg-accent-coral/10 text-accent-coral' :
                    item.type === 'Feature' ? 'bg-accent-teal/10 text-accent-teal' :
                    'bg-accent-purple/10 text-accent-purple'
                  }`}>
                    {item.type === 'Bug' ? <AlertCircle size={16} /> : item.type === 'Feature' ? <Lightbulb size={16} /> : <MessageSquare size={16} />}
                  </div>
                  <div>
                    <span className="font-semibold text-ink-dark">{item.type}</span>
                    <span className="text-ink-dark/40 text-sm ml-3">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <span className="text-ink-dark/70 font-mono">{item.userEmail || 'Unknown User'}</span>
                </div>
              </div>
              
              <div className="bg-paper-base rounded-xl p-4 text-sm font-sans whitespace-pre-wrap text-ink-dark/90 border border-ink-dark/5">
                {item.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
