import React, { useState } from "react";
import {
  Table,
  LayoutGrid,
  CheckSquare,
  Square,
  Save,
  Loader2,
  Sparkles,
  Edit2,
} from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { withKeyRotation } from "../utils/geminiClient";
import { useFirebaseSync } from "../hooks/useFirebaseSync";
import Markdown from "react-markdown";

/**
 * Props for the MarketDataGrid component.
 */
interface MarketDataGridProps {
  /** Array of structured competitor objects to display in the grid */
  competitors: any[];
  /** Raw scraped data points associated with the market */
  rawData: any[];
}

/**
 * An interactive data grid for viewing, sorting, and inline-editing competitor capabilities.
 * @description
 * This component syncs local edits via `useFirebaseSync` directly to Firestore.
 * It also manages a local SWOT analysis object derived from the grid data.
 * If no competitors are provided, it renders an empty state warning.
 * @example
 * ```tsx
 * <MarketDataGrid competitors={competitorList} rawData={rawScrapes} />
 * ```
 */
export default function MarketDataGrid({
  competitors,
  rawData,
}: MarketDataGridProps) {
  const [competitorEdits, setCompetitorEdits] = useFirebaseSync<
    Record<string, any>
  >("competitorEdits", {});
  const [swotData, setSwotData] = useFirebaseSync<any>("marketSwot", null);

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      name: true,
      website: true,
      score: true,
      features: true,
      differentiation: true,
    },
  );

  const [editingCell, setEditingCell] = useState<{
    id: string;
    key: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  const [isGeneratingSwot, setIsGeneratingSwot] = useState(false);

  // Merge edits
  const mergedCompetitors = competitors.map((c, i) => {
    const id = c.id || c.name || `comp-${i}`;
    return { ...c, id, ...(competitorEdits[id] || {}) };
  });

  if (sortConfig) {
    mergedCompetitors.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  /**
   *
   */
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  /**
   *
   */
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   *
   */
  const startEditing = (id: string, key: string, value: any) => {
    setEditingCell({ id, key });
    setEditValue(value || "");
  };

  /**
   *
   */
  const saveEdit = () => {
    if (editingCell) {
      setCompetitorEdits((prev) => ({
        ...prev,
        [editingCell.id]: {
          ...(prev[editingCell.id] || {}),
          [editingCell.key]: editValue,
        },
      }));
    }
    setEditingCell(null);
  };

  /**
   *
   */
  const generateSwot = async () => {
    setIsGeneratingSwot(true);
    try {
      const prompt = `
        You are an expert market analyst. Based on the following competitors and raw data, generate a comprehensive SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for our position in the market.
        
        Competitors: ${JSON.stringify(competitors.slice(0, 5))}
        Raw Data Signals: ${JSON.stringify(rawData.slice(0, 5))}
        
        Format your response as a JSON object with four keys: "strengths", "weaknesses", "opportunities", "threats". 
        Each key should contain an array of 2-3 short, strategic bullet points.
      `;

      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                opportunities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                threats: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["strengths", "weaknesses", "opportunities", "threats"],
            },
          },
        });
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.strengths) {
        setSwotData(parsed);
      }
    } catch (error) {
      console.error("Failed to generate SWOT:", error);
    } finally {
      setIsGeneratingSwot(false);
    }
  };

  if (!competitors || competitors.length === 0) {
    return (
      <div className="bg-paper-light border border-ink-dark/20 rounded-2xl p-12 text-center shadow-sm">
        <LayoutGrid className="w-12 h-12 mx-auto text-ink-dark/30 mb-4" />
        <h3 className="text-xl font-bold font-serif text-ink-dark mb-2">
          No Competitors Selected
        </h3>
        <p className="text-ink-dark/60 max-w-md mx-auto">
          Please add and select competitors in the <strong>My Product</strong>{" "}
          view to see them in the Data Grid.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="market-data-grid">
      {/* Table Section */}
      <div className="bg-white rounded-xl border border-ink-dark/30 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-ink-dark/20 bg-paper-light flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold text-ink-dark flex items-center gap-2">
            <Table size={18} /> Competitor Data
          </h3>
          <div className="flex gap-4 items-center flex-wrap">
            <span className="text-sm text-ink-dark/70 font-semibold">
              Toggle Columns:
            </span>
            {Object.keys(visibleColumns).map((col) => (
              <label
                key={col}
                className="flex items-center gap-1 text-sm cursor-pointer capitalize"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[col]}
                  onChange={() => toggleColumn(col)}
                  className="rounded border-ink-dark/30 text-moss focus:ring-moss"
                />
                {col}
              </label>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-base/50 text-ink-dark/60 uppercase tracking-wider text-xs">
              <tr>
                {visibleColumns.name && (
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-ink-dark"
                    onClick={() => handleSort("name")}
                  >
                    Name
                  </th>
                )}
                {visibleColumns.website && (
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-ink-dark"
                    onClick={() => handleSort("website")}
                  >
                    Website
                  </th>
                )}
                {visibleColumns.score && (
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-ink-dark"
                    onClick={() => handleSort("score")}
                  >
                    Score
                  </th>
                )}
                {visibleColumns.features && (
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-ink-dark"
                    onClick={() => handleSort("features")}
                  >
                    Features
                  </th>
                )}
                {visibleColumns.differentiation && (
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-ink-dark"
                    onClick={() => handleSort("differentiation")}
                  >
                    Differentiation
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-dark/20">
              {mergedCompetitors.map((comp) => (
                <tr
                  key={comp.id}
                  className="hover:bg-paper-base/50 transition-colors group"
                >
                  {Object.keys(visibleColumns).map((col) => {
                    if (!visibleColumns[col]) return null;
                    const isEditing =
                      editingCell?.id === comp.id && editingCell?.key === col;

                    return (
                      <td
                        key={col}
                        className="px-4 py-3 relative min-w-[150px]"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                              onBlur={saveEdit}
                              className="w-full border border-moss rounded px-2 py-1 text-sm bg-white"
                            />
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-between group-hover:bg-black/5 p-1 rounded -m-1 cursor-pointer"
                            onClick={() =>
                              startEditing(
                                comp.id,
                                col,
                                comp[col] ||
                                  (col === "features"
                                    ? comp.coreFeatures?.join(", ") || ""
                                    : ""),
                              )
                            }
                          >
                            <span className="truncate">
                              {col === "features"
                                ? comp.features ||
                                  comp.coreFeatures?.join(", ") ||
                                  "N/A"
                                : comp[col] || "N/A"}
                            </span>
                            <Edit2
                              size={12}
                              className="opacity-0 group-hover:opacity-50"
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-SWOT Section */}
      <div className="bg-white rounded-xl border border-ink-dark/30 shadow-sm overflow-hidden p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-ink-dark text-lg flex items-center gap-2">
            <LayoutGrid size={20} /> Auto-SWOT Analysis
          </h3>
          <button
            onClick={generateSwot}
            disabled={isGeneratingSwot}
            className="flex items-center gap-2 bg-moss text-paper-light px-4 py-2 rounded-md font-medium hover:bg-moss/90 transition-colors disabled:opacity-50"
          >
            {isGeneratingSwot ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            Generate Auto-SWOT
          </button>
        </div>

        {swotData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
              <h4 className="font-bold text-emerald-800 mb-3 uppercase text-sm tracking-wider">
                Strengths
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-emerald-900/80 text-sm">
                {swotData.strengths?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg">
              <h4 className="font-bold text-rose-800 mb-3 uppercase text-sm tracking-wider">
                Weaknesses
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-rose-900/80 text-sm">
                {swotData.weaknesses?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-sky-50 border border-sky-200 p-4 rounded-lg">
              <h4 className="font-bold text-sky-800 mb-3 uppercase text-sm tracking-wider">
                Opportunities
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sky-900/80 text-sm">
                {swotData.opportunities?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <h4 className="font-bold text-amber-800 mb-3 uppercase text-sm tracking-wider">
                Threats
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-amber-900/80 text-sm">
                {swotData.threats?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-ink-dark/50 bg-paper-base/30 rounded-lg border border-dashed border-ink-dark/20">
            <p>
              No SWOT analysis generated yet. Click the button above to analyze
              the market.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
