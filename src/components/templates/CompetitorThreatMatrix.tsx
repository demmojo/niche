import React from "react";
import { B_H2, B_Badge, B_TextBody } from "../BrutalistUI";

// Mock Data
const DEFCON_STYLES: Record<number, string> = {
  1: "bg-black text-white animate-pulse border-[var(--color-brutal-red)] border-4 shadow-[4px_4px_0px_0px_var(--color-brutal-red)]", // Critical
  2: "bg-[var(--color-brutal-red)] text-black border-black border-4", // Severe
  3: "bg-yellow-400 text-black border-black border-4", // Elevated
  4: "bg-[var(--color-brutal-chartreuse)] text-black border-black border-4", // Guarded
  5: "bg-white text-black border-black border-4", // Normal
};

/**
 *
 */
const BlockScore = ({ score, max = 4 }: { score: number; max?: number }) => {
  const filled = "█".repeat(score);
  const empty = "░".repeat(max - score);
  return (
    <span className="tracking-[0.2em] font-mono whitespace-nowrap">
      [{filled}
      {empty}]
    </span>
  );
};

const competitors = [
  { name: "TechFlow", defcon: 2, cap: 3, mkt: 4 },
  { name: "AutoScale", defcon: 4, cap: 1, mkt: 2 },
  { name: "DataSync", defcon: 1, cap: 4, mkt: 4 },
  { name: "MetricsOS", defcon: 3, cap: 2, mkt: 3 },
  { name: "AlphaBuild", defcon: 5, cap: 1, mkt: 1 },
];

/**
 *
 */
export function CompetitorThreatMatrix() {
  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0F172A] text-white">
      <div className="mb-8 border-b-2 border-slate-700 pb-4">
        <B_Badge variant="info" className="mb-2">
          COMPETITIVE INTEL
        </B_Badge>
        <B_H2>THREAT MATRIX</B_H2>
        <B_TextBody className="text-sm mt-2 text-slate-400 font-mono">
          High-density DEFCON scoring based on Competitor.competitorScore.
        </B_TextBody>
      </div>

      <div className="w-full bg-[#1E293B] border-4 border-black shadow-[8px_8px_0px_0px_#000000] overflow-x-auto">
        <table className="w-full text-left font-mono text-sm border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b-4 border-black">
              <th className="p-4 border-r-4 border-black uppercase font-black w-24">
                THREAT
              </th>
              <th className="p-4 border-r-4 border-black uppercase font-black">
                COMPETITOR
              </th>
              <th className="p-4 border-r-4 border-black uppercase font-black w-48 text-center">
                CAPABILITY GAP
              </th>
              <th className="p-4 uppercase font-black w-48 text-center">
                MARKET SHARE
              </th>
            </tr>
          </thead>
          <tbody>
            {competitors
              .sort((a, b) => a.defcon - b.defcon)
              .map((comp, idx) => (
                <tr
                  key={comp.name}
                  className={`border-b-4 border-black bg-slate-800 hover:bg-slate-700 transition-colors ${
                    idx === competitors.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-3 border-r-4 border-black text-center">
                    <div
                      className={`inline-block px-2 py-1 font-bold ${
                        DEFCON_STYLES[comp.defcon]
                      }`}
                    >
                      LVL {comp.defcon}
                    </div>
                  </td>
                  <td className="p-4 border-r-4 border-black font-bold uppercase tracking-widest text-lg">
                    {comp.name}
                  </td>
                  <td className="p-4 border-r-4 border-black text-center text-[var(--color-brutal-cyan)]">
                    <BlockScore score={comp.cap} />
                  </td>
                  <td className="p-4 text-center text-[var(--color-brutal-chartreuse)]">
                    <BlockScore score={comp.mkt} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
