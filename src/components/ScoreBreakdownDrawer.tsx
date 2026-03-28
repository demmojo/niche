import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Activity, Target, Zap, Info } from "lucide-react";

interface ScoringFeature {
  id: string;
  name: string;
  weight: number;
  description?: string;
  current_val: number;
}

interface ScoreBreakdownDrawerProps {
  baseScore: number;
  drivers: ScoringFeature[];
  title?: string;
  description?: string;
}

export const ScoreBreakdownDrawer: React.FC<ScoreBreakdownDrawerProps> = ({
  baseScore,
  drivers,
  title = "Explainable AI Score",
  description = "Real-time mathematical decomposition of the heuristic score.",
}) => {
  // We use local state for the interactive "What-If" sliders
  const [localDrivers, setLocalDrivers] = useState<ScoringFeature[]>(drivers);

  const currentScore = useMemo(() => {
    let score = baseScore;
    for (const d of localDrivers) {
      score += d.weight * d.current_val;
    }
    return Math.min(100, Math.max(0, Math.round(score)));
  }, [baseScore, localDrivers]);

  const handleSliderChange = (id: string, newVal: number) => {
    setLocalDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, current_val: newVal } : d)),
    );
  };

  return (
    <div className="w-full bg-white border border-ink-dark/10 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[600px]">
      <div className="p-6 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sky-900 flex items-center gap-2 text-lg">
            <Activity size={20} />
            {title}
          </h3>
          <p className="text-xs text-sky-700/80 mt-1 max-w-sm">{description}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1">
            Calculated Score
          </span>
          <div className="text-4xl font-black text-sky-900">
            {currentScore}
            <span className="text-lg text-sky-700/50">/100</span>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-y-auto bg-paper-base flex-1 space-y-6">
        <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-900 rounded-xl text-sm font-medium border border-amber-200">
          <Info size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <p>
            This score is <strong>not a black box</strong>. It is driven by an
            additive heuristic model. Use the counterfactual sliders below to
            test "What-If" scenarios and instantly see how different market
            conditions impact your score.
          </p>
        </div>

        <div className="space-y-5">
          {localDrivers.map((driver) => {
            const isPositive = driver.weight > 0;
            const impact = (driver.weight * driver.current_val).toFixed(1);

            return (
              <div
                key={driver.id}
                className="bg-white p-4 rounded-xl border border-ink-dark/5 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-ink-dark flex items-center gap-2">
                      <Target size={14} className="text-sky-500" />
                      {driver.name}
                    </h4>
                    {driver.description && (
                      <p className="text-xs text-ink-dark/50 mt-1">
                        {driver.description}
                      </p>
                    )}
                  </div>
                  <div
                    className={`text-xs font-bold px-2 py-1 rounded-md ${
                      isPositive
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    Weight: {driver.weight > 0 ? "+" : ""}
                    {driver.weight}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={driver.current_val}
                    onChange={(e) =>
                      handleSliderChange(driver.id, parseInt(e.target.value))
                    }
                    className="flex-1 h-2 bg-ink-dark/10 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="w-16 text-right font-mono text-sm font-bold text-ink-dark">
                    {driver.current_val}
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span className="text-xs font-semibold text-ink-dark/40">
                    Net Impact:{" "}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      parseFloat(impact) > 0
                        ? "text-emerald-500"
                        : parseFloat(impact) < 0
                          ? "text-rose-500"
                          : "text-ink-dark/40"
                    }`}
                  >
                    {parseFloat(impact) > 0 ? "+" : ""}
                    {impact} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
