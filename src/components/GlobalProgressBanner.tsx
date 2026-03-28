import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  progress: number;
}

interface GlobalProgressBannerProps {
  isSyncing: boolean;
  activeTasks: Task[];
}

/**
 *
 */
export const GlobalProgressBanner: React.FC<GlobalProgressBannerProps> = ({ isSyncing, activeTasks }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Calculate overall progress
  const totalTasks = activeTasks.length;
  const overallProgress = useMemo(() => {
    if (totalTasks === 0) return 0;
    const sum = activeTasks.reduce((acc, task) => acc + task.progress, 0);
    return Math.round(sum / totalTasks);
  }, [activeTasks, totalTasks]);

  // Determine current active task
  const currentTaskIndex = useMemo(() => {
    return activeTasks.findIndex(t => t.progress < 100);
  }, [activeTasks]);
  
  const currentTask = currentTaskIndex !== -1 ? activeTasks[currentTaskIndex] : null;

  useEffect(() => {
    // If we have active tasks and are syncing, we must be visible and not in success state
    if (isSyncing || (activeTasks.length > 0 && overallProgress < 100)) {
      setIsVisible(true);
      setShowSuccess(false);
    } 
    // If we hit 100% and were previously visible, show success state briefly before hiding
    else if (!isSyncing && activeTasks.length > 0 && overallProgress === 100 && isVisible && !showSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // We let the parent App.tsx clear the activeTasks array, we just hide the banner
      }, 3000);
      return () => clearTimeout(timer);
    }
    // If not syncing and no active tasks, just hide
    else if (!isSyncing && activeTasks.length === 0) {
      setIsVisible(false);
      setShowSuccess(false);
    }
  }, [isSyncing, activeTasks.length, overallProgress, isVisible, showSuccess]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-[73px] left-0 right-0 z-40 flex justify-center w-full px-4 pointer-events-none"
      >
        <div 
          className={`pointer-events-auto flex flex-col w-full max-w-2xl bg-white shadow-xl rounded-b-2xl border-x border-b border-ink-dark/10 overflow-hidden transition-colors duration-500 ${
            showSuccess ? 'bg-emerald-50/90 border-emerald-500/30' : 'bg-white/95 backdrop-blur-md'
          }`}
        >
          {/* Progress Bar Track */}
          <div className="h-1.5 w-full bg-ink-dark/5">
            <motion.div 
              className={`h-full ${showSuccess ? 'bg-emerald-500' : 'bg-accent-teal'}`}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Content */}
          <div className="px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {showSuccess ? (
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              ) : (
                <Loader2 size={18} className="text-accent-teal animate-spin shrink-0" />
              )}
              
              <div className="truncate">
                {showSuccess ? (
                  <span className="text-sm font-semibold text-emerald-700">Sync Complete</span>
                ) : (
                  <span className="text-sm font-medium text-ink-dark truncate">
                    <strong className="font-bold text-accent-teal mr-2">
                      Step {currentTaskIndex + 1} of {totalTasks}:
                    </strong>
                    {currentTask?.name || 'Finalizing...'}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-sm font-bold font-mono text-ink-dark/50">
              {overallProgress}%
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
