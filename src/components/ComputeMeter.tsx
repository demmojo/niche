import React from "react";
import { Battery, BatteryMedium, BatteryWarning } from "lucide-react";

/**
 *
 */
export function ComputeMeter({ credits }: { credits: number }) {
  const isLow = credits <= 5;
  const isCritical = credits === 0;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
        isCritical
          ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
          : isLow
            ? "border-orange-500/30 bg-orange-500/10 text-orange-600"
            : "border-slate-200 bg-white text-slate-600"
      }`}
      title={`${credits} validation credits remaining`}
    >
      {isCritical ? (
        <BatteryWarning size={16} className="text-rose-500" />
      ) : isLow ? (
        <BatteryMedium size={16} className="text-orange-500" />
      ) : (
        <Battery size={16} className="text-emerald-500" />
      )}
      <span className="tabular-nums">
        {credits}{" "}
        <span className="opacity-70 text-xs hidden sm:inline">credits</span>
      </span>
    </div>
  );
}
