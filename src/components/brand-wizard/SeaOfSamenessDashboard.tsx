import React, { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import { CompetitorBrand } from "../../hooks/useBrandWizardJob";

// A deterministic pseudo-random number generator to replace Math.random()
/**
 *
 */
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Generates a simple 2D projection from an embedding or deterministically from a string
/**
 *
 */
function simple2DProjection(comp: CompetitorBrand & { vector?: number[] | Float32Array }): { x: number; y: number } {
  if (comp.vector && comp.vector.length >= 2) {
    // Naive dimensionality reduction for MVP: Project 768D onto 2 axes
    let xSum = 0;
    let ySum = 0;
    const half = Math.floor(comp.vector.length / 2);
    for (let i = 0; i < half; i++) xSum += comp.vector[i];
    for (let i = half; i < comp.vector.length; i++) ySum += comp.vector[i];
    
    // Normalize to 20-80% for visual padding within the matrix
    const x = 20 + ((Math.abs(xSum * 100) % 100) * 0.6);
    const y = 20 + ((Math.abs(ySum * 100) % 100) * 0.6);
    return { x, y };
  } else {
    // Fallback: deterministic projection based on URL
    let hash = 0;
    for (let i = 0; i < comp.url.length; i++) {
      hash = Math.imul(31, hash) + comp.url.charCodeAt(i) | 0;
    }
    const prng = mulberry32(hash);
    return { x: 20 + prng() * 60, y: 20 + prng() * 60 };
  }
}

/**
 *
 */
export const SeaOfSamenessDashboard: React.FC<{
  competitors: CompetitorBrand[];
  onContinue: () => void;
}> = ({ competitors, onContinue }) => {
  const [hoveredReasoning, setHoveredReasoning] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Memoize positions so they don't recalculate on every render
  const projectedPositions = useMemo(() => {
    return competitors.map(comp => simple2DProjection(comp));
  }, [competitors]);

  // 1. Apply the 7±2 Rule for Cognitive Load (limit colors shown per competitor)
  /**
   *
   */
  const extractDominantColors = (colors: { primary: string[]; background: string[] }) => {
    const all = [...(colors.primary || []), ...(colors.background || [])];
    return Array.from(new Set(all)).slice(0, 5); // Max 5 colors to avoid overload
  };

  /**
   *
   */
  const handleMouseMove = (e: React.MouseEvent, reasoning: string) => {
    setHoveredReasoning(reasoning);
    setHoverPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-full bg-[#0C0C0C] text-[#F2F2F2] font-['JetBrains_Mono'] relative">
      <h2 className="text-2xl font-bold mb-6 font-['Clash_Display']">
        The "Sea of Sameness"
      </h2>

      {/* Mood Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {competitors.map((comp) => (
          <div
            key={comp.id}
            className="border border-[#333333] p-4 bg-[#1A1A1A] rounded flex flex-col gap-4 relative"
            onMouseEnter={(e) => handleMouseMove(e, comp.positioning._reasoning)}
            onMouseMove={(e) => handleMouseMove(e, comp.positioning._reasoning)}
            onMouseLeave={() => setHoveredReasoning(null)}
          >
            {/* Visuals */}
            <div className="flex items-center gap-3">
              {comp.visual_identity.logo_url ? (
                <img
                  src={comp.visual_identity.logo_url}
                  alt={`${comp.url} Logo`}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-[#333333] rounded flex items-center justify-center text-xs">
                  logo
                </div>
              )}
              <div className="text-sm truncate w-full">{comp.url}</div>
            </div>

            {/* Dominant Palette (7±2 Rule) */}
            <div className="flex gap-2 h-6">
              {extractDominantColors(comp.visual_identity.colors).map((c, i) => (
                <div
                  key={i}
                  className="w-6 h-full rounded shadow-sm"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Typography */}
            <div className="text-xs text-[#888888]">
              <strong>H:</strong> {comp.visual_identity.typography.headings[0] || "Unknown"}
              <br />
              <strong>P:</strong> {comp.visual_identity.typography.body[0] || "Unknown"}
            </div>

            {/* Positioning Tags */}
            <div className="flex flex-wrap gap-2 mt-auto">
              {comp.positioning.tone.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 bg-[#333333] text-xs rounded text-[#CCCCCC]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 2x2 Positioning Matrix (Generative Axes Mock) */}
      <h3 className="text-xl font-bold mb-4 font-['Clash_Display']">
        Positioning Matrix
      </h3>
      <div className="relative w-full aspect-square md:aspect-video bg-[#1A1A1A] border border-[#333333] rounded overflow-hidden">
        {/* Axes lines */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-[#444444]" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-[#444444]" />

        {/* Labels (Generative mock based on data) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-[#888888] font-bold">
          High Complexity
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-[#888888] font-bold">
          Low Complexity
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#888888] font-bold -rotate-90 origin-left">
          Corporate Tone
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#888888] font-bold rotate-90 origin-right">
          Playful Tone
        </div>

        {/* Competitor Nodes (CSS Transforms for performance) */}
        {competitors.map((comp, idx) => {
          const { x, y } = projectedPositions[idx];
          
          return (
            <motion.div
              key={`node-${comp.id}`}
              drag
              dragConstraints={{ left: 0, right: 100, top: 0, bottom: 100 }}
              dragElastic={0}
              dragMomentum={false}
              className="absolute w-4 h-4 bg-[#CCFF00] rounded-full cursor-grab active:cursor-grabbing border border-[#0C0C0C] z-10"
              style={{ top: `${y}%`, left: `${x}%` }}
              onMouseEnter={(e) => handleMouseMove(e as any, comp.positioning._reasoning)}
              onMouseMove={(e) => handleMouseMove(e as any, comp.positioning._reasoning)}
              onMouseLeave={() => setHoveredReasoning(null)}
              title={comp.url}
            />
          );
        })}
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={onContinue}
          className="bg-[#CCFF00] text-[#0C0C0C] px-6 py-3 rounded font-bold hover:bg-[#B3E600] transition-colors"
        >
          Proceed to Brand Wizard
        </button>
      </div>

      {/* Transparent AI Popover (Sanitized DOMPurify) */}
      {hoveredReasoning && (
        <div
          className="fixed z-50 max-w-xs bg-[#0C0C0C] border border-[#CCFF00] p-3 rounded shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4"
          style={{ left: hoverPos.x, top: hoverPos.y }}
        >
          <div className="text-[10px] text-[#CCFF00] font-bold mb-1 uppercase tracking-wider">
            AI Reasoning
          </div>
          <div
            className="text-xs text-[#F2F2F2] leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(hoveredReasoning),
            }}
          />
        </div>
      )}
    </div>
  );
};
