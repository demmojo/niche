import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function AlphaBadge() {
  return (
    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded text-[10px] uppercase font-bold tracking-wider w-fit" title="Daily API limits apply during Alpha">
      <AlertTriangle size={12} />
      Early Alpha - Limits Apply
    </div>
  );
}
