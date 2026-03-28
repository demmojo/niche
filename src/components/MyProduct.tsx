import React, { useState } from "react";
import {
  Package,
  Target,
  MapPin,
  List,
  Plus,
  Sparkles,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { withModelFallback } from "../utils/aiClient";
import Markdown from "react-markdown";
import { Tooltip } from "./Tooltip";
import ExportButton from "./ExportButton";
import { DocumentationWizardModal } from "./DocumentationWizardModal";
import { DerivedInsight } from "../types";

export interface FeatureProvenance {
  sourceType:
    | "competitor_matrix"
    | "raw_data"
    | "ai_suggestion"
    | "visual_lens";
  sourceId?: string;
  sourceText?: string;
  confidenceScore?: number;
}

export interface ProductFeature {
  id: string;
  name: string;
  description: string;
  status: "planned" | "in-progress" | "completed" | "pending-review";
  webhookSyncStatus?: "planned" | "in-development" | "shipped";
  provenance?: FeatureProvenance;
}

export interface ProductStrategy {
  id: string;
  content: string;
  status: "todo" | "doing" | "done";
}

export interface MyProductData {
  name: string;
  description: string;
  targetRegions: string[];
  features: ProductFeature[];
  strategy: ProductStrategy[];
  verifiedFields?: Record<string, boolean>;
  allowAiWriteAccess?: boolean;
}

interface MyProductProps {
  productData: MyProductData;
  setProductData: React.Dispatch<React.SetStateAction<MyProductData>>;
  competitors: any[];
  insights: DerivedInsight[];
}

export const MyProduct: React.FC<MyProductProps> = ({
  productData,
  setProductData,
  competitors,
  insights,
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState(productData.name);
  const [editDescription, setEditDescription] = useState(
    productData.description,
  );
  const [editRegions, setEditRegions] = useState(
    productData.targetRegions.join(", "),
  );

  const [newFeatureName, setNewFeatureName] = useState("");
  const [newStrategyContent, setNewStrategyContent] = useState("");

  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editingFeatureName, setEditingFeatureName] = useState("");
  const [editingFeatureDesc, setEditingFeatureDesc] = useState("");

  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isAnalyzingTarpit, setIsAnalyzingTarpit] = useState(false);
  const [tarpitWarning, setTarpitWarning] = useState<any>(null);

  const analyzeTarpit = async (name: string, description: string) => {
    setIsAnalyzingTarpit(true);
    try {
      const response = await fetch("/api/tarpit-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: name,
          productDescription: description,
        }),
      });
      const result = await response.json();
      if (result.isTarpit) {
        setTarpitWarning(result);
      } else {
        setTarpitWarning(null);
      }
    } catch (err) {
      console.error("Tarpit analysis failed", err);
    } finally {
      setIsAnalyzingTarpit(false);
    }
  };

  const handleSaveDetails = async () => {
    // Before saving, run tarpit analysis
    await analyzeTarpit(editName, editDescription);
    if (tarpitWarning) return; // Wait for user to resolve warning

    setProductData((prev) => ({
      ...prev,
      name: editName,
      description: editDescription,
      targetRegions: editRegions
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
    }));
    setIsEditingDetails(false);
  };

  const overrideTarpitWarning = () => {
    setProductData((prev) => ({
      ...prev,
      name: editName,
      description: editDescription,
      targetRegions: editRegions
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
    }));
    setIsEditingDetails(false);
    setTarpitWarning(null);
  };

  const handleAcceptTarpitConstraint = (niche: string) => {
    setEditDescription((prev) => prev + "\nConstraint: " + niche);
    setTarpitWarning(null);
  };

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return;
    setProductData((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        {
          id: Math.random().toString(36).substring(2, 9),
          name: newFeatureName.trim(),
          description: "",
          status: "planned",
        },
      ],
    }));
    setNewFeatureName("");
  };

  const handleRemoveFeature = (id: string) => {
    setProductData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f.id !== id),
    }));
  };

  const handleUpdateFeatureStatus = (
    id: string,
    status: ProductFeature["status"],
  ) => {
    setProductData((prev) => ({
      ...prev,
      features: prev.features.map((f) => (f.id === id ? { ...f, status } : f)),
    }));
  };

  const handleEditFeature = (feature: ProductFeature) => {
    setEditingFeatureId(feature.id);
    setEditingFeatureName(feature.name);
    setEditingFeatureDesc(feature.description || "");
  };

  const handleSaveFeature = (id: string) => {
    if (!editingFeatureName.trim()) return;
    setProductData((prev) => ({
      ...prev,
      features: prev.features.map((f) =>
        f.id === id
          ? {
              ...f,
              name: editingFeatureName.trim(),
              description: editingFeatureDesc.trim(),
            }
          : f,
      ),
    }));
    setEditingFeatureId(null);
  };

  const handleAddStrategy = () => {
    if (!newStrategyContent.trim()) return;
    setProductData((prev) => ({
      ...prev,
      strategy: [
        ...prev.strategy,
        {
          id: Math.random().toString(36).substring(2, 9),
          content: newStrategyContent.trim(),
          status: "todo",
        },
      ],
    }));
    setNewStrategyContent("");
  };

  const handleRemoveStrategy = (id: string) => {
    setProductData((prev) => ({
      ...prev,
      strategy: prev.strategy.filter((s) => s.id !== id),
    }));
  };

  const handleUpdateStrategyStatus = (
    id: string,
    status: ProductStrategy["status"],
  ) => {
    setProductData((prev) => ({
      ...prev,
      strategy: prev.strategy.map((s) => (s.id === id ? { ...s, status } : s)),
    }));
  };

  const generateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const context = `
        Product Name: ${productData.name}
        Description: ${productData.description}
        Target Regions: ${productData.targetRegions.join(", ")}
        Current Features: ${productData.features.map((f) => f.name).join(", ")}
        Competitors Tracked: ${competitors.length}
        Competitors: ${competitors.map((c) => c.name).join(", ")}
        Competitor Features: ${competitors
          .map((c) => c.features?.join(", "))
          .filter(Boolean)
          .join(" | ")}
      `;

      const prompt = `Based on the following product context and competitor landscape, generate 3 strategic next steps or action items to improve the product's market position. Consider missing features, target regions, and potential differentiators. Return ONLY a JSON array of strings.
      
      Context: ${context}
      `;

      const response = await withModelFallback(
        async (ai, model) => {
          return ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });
        },
        { tier: "pro" },
      );

      const text = response.text || "[]";
      const suggestions = JSON.parse(text);

      if (Array.isArray(suggestions)) {
        const newStrategies = suggestions.map((s: string) => ({
          id: Math.random().toString(36).substring(2, 9),
          content: s,
          status: "todo" as const,
        }));

        setProductData((prev) => ({
          ...prev,
          strategy: [...prev.strategy, ...newStrategies],
        }));
      }
    } catch (error) {
      console.error("Error generating strategy:", error);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-end mb-8 mt-4">
          <div>
            <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
              マイプロダクト
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
              My Product
            </h1>
            <p className="text-[#8A8A8A] text-sm font-sans mt-2">
              Manage your product details, features, and strategy.
            </p>
          </div>
          <ExportButton
            onExport={() => setIsWizardOpen(true)}
            label="Generate Docs"
            tooltipText="Export product documentation or OpenSpec files"
            actionName="generate_docs"
          />
        </div>

        {/* Header / Details Section */}
        <div className="p-6 rounded-xl border border-ink-dark bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-ink-dark text-white rounded-xl shadow-md">
                <Package size={24} />
              </div>
              <h2 className="text-2xl font-bold text-ink-dark">
                Product Details
              </h2>
            </div>
            {!isEditingDetails ? (
              <button
                onClick={() => setIsEditingDetails(true)}
                className="flex items-center gap-2 px-4 py-2 bg-paper-base border border-ink-dark/20 text-ink-dark rounded-lg hover:bg-ink-dark/5 transition-colors text-sm font-medium"
              >
                <Edit2 size={16} />
                Edit Details
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingDetails(false)}
                  className="p-2 text-ink-dark/60 hover:bg-paper-base rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={handleSaveDetails}
                  disabled={isAnalyzingTarpit}
                  className="flex items-center gap-2 px-4 py-2 bg-ink-dark text-white rounded-lg hover:bg-black transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isAnalyzingTarpit ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="relative z-10">
            {!isEditingDetails ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-ink-dark mb-2">
                    {productData.name || "Unnamed Product"}
                  </h2>
                  <p className="text-lg text-ink-dark/80 leading-relaxed max-w-3xl">
                    {productData.description ||
                      "Add a description for your product to help AI generate better insights."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-sky" />
                  <span className="font-medium text-ink-dark">
                    Target Regions:
                  </span>
                  <div className="flex flex-wrap gap-2 ml-2">
                    {productData.targetRegions.length > 0 ? (
                      productData.targetRegions.map((region, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-sky/10 text-sky border border-sky/20 rounded-full text-sm font-medium"
                        >
                          {region}
                        </span>
                      ))
                    ) : (
                      <span className="text-ink-dark/50 text-sm italic">
                        No regions specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <label className="block text-sm font-medium text-ink-dark mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-paper-base border border-ink-dark/20 rounded-lg focus:outline-none focus:border-ink-dark"
                    placeholder="e.g. Acme Analytics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-dark mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-paper-base border border-ink-dark/20 rounded-lg focus:outline-none focus:border-ink-dark min-h-[100px]"
                    placeholder="What does your product do? Who is it for?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-dark mb-1">
                    Target Regions (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editRegions}
                    onChange={(e) => setEditRegions(e.target.value)}
                    className="w-full px-4 py-2 bg-paper-base border border-ink-dark/20 rounded-lg focus:outline-none focus:border-ink-dark"
                    placeholder="e.g. North America, Europe, APAC"
                  />
                </div>
              </div>
            )}
          </div>
          {tarpitWarning && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl relative z-10">
              <h4 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
                ⚠️ Tarpit Warning (Score: {tarpitWarning.score}/100)
              </h4>
              <p className="text-amber-800 text-sm mb-4">
                {tarpitWarning.reasoning}
              </p>

              {tarpitWarning.suggestedNiches &&
                tarpitWarning.suggestedNiches.length > 0 && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-amber-200/50">
                    <p className="text-sm font-medium text-amber-900">
                      Suggested Pivots:
                    </p>
                    <div className="flex flex-col gap-2">
                      {tarpitWarning.suggestedNiches.map(
                        (niche: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleAcceptTarpitConstraint(niche)}
                            className="text-left p-3 text-sm bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 transition-colors"
                          >
                            {niche}
                          </button>
                        ),
                      )}
                    </div>
                    <p className="text-xs text-amber-700/70 mt-2">
                      Select a suggestion above, or manually update your
                      description to be more specific.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Features Section */}
          <div className="p-6 rounded-xl border border-ink-dark bg-white shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center gap-2 mb-6">
              <List size={20} className="text-ink-dark" />
              <h3 className="text-xl font-bold text-ink-dark">
                Product Features
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
              {productData.features.length === 0 ? (
                <div className="text-center py-12 text-ink-dark/50 border-2 border-dashed border-ink-dark/10 rounded-xl">
                  <Package size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No features added yet.</p>
                  <p className="text-sm mt-1">
                    Add features below or from the Competitor Matrix.
                  </p>
                </div>
              ) : (
                productData.features.map((feature) => (
                  <div
                    key={feature.id}
                    className="p-4 bg-paper-base border border-ink-dark/10 rounded-xl group hover:border-ink-dark/30 transition-colors"
                  >
                    {editingFeatureId === feature.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingFeatureName}
                          onChange={(e) =>
                            setEditingFeatureName(e.target.value)
                          }
                          className="w-full px-3 py-1.5 bg-white border border-ink-dark/20 rounded-lg focus:outline-none focus:border-ink-dark text-sm font-semibold"
                          placeholder="Feature Name"
                        />
                        <textarea
                          value={editingFeatureDesc}
                          onChange={(e) =>
                            setEditingFeatureDesc(e.target.value)
                          }
                          className="w-full px-3 py-1.5 bg-white border border-ink-dark/20 rounded-lg focus:outline-none focus:border-ink-dark text-sm resize-none h-20"
                          placeholder="Feature Description (optional)"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingFeatureId(null)}
                            className="px-3 py-1.5 text-sm font-medium text-ink-dark/70 hover:text-ink-dark transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveFeature(feature.id)}
                            disabled={!editingFeatureName.trim()}
                            className="px-3 py-1.5 text-sm font-medium bg-ink-dark text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-ink-dark">
                            {feature.name}
                          </h4>
                          {feature.description && (
                            <p className="text-sm text-ink-dark/70 mt-1">
                              {feature.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={feature.status}
                            onChange={(e) =>
                              handleUpdateFeatureStatus(
                                feature.id,
                                e.target.value as any,
                              )
                            }
                            className={`text-xs font-medium px-2 py-1 rounded border focus:outline-none ${
                              feature.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : feature.status === "in-progress"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : feature.status === "pending-review"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            <option value="pending-review">
                              Pending Review
                            </option>
                            <option value="planned">Planned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            onClick={() => handleEditFeature(feature)}
                            className="text-ink-dark/40 hover:text-sky opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleRemoveFeature(feature.id)}
                            className="text-ink-dark/40 hover:text-rose-500 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-ink-dark/10">
              <input
                type="text"
                value={newFeatureName}
                onChange={(e) => setNewFeatureName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFeature()}
                placeholder="Add a new feature..."
                className="flex-1 px-4 py-2 bg-paper-base border border-ink-dark/20 rounded-lg focus:outline-none focus:border-ink-dark text-sm"
              />
              <button
                onClick={handleAddFeature}
                disabled={!newFeatureName.trim()}
                className="p-2 bg-ink-dark text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Strategy Section */}
          <div className="p-6 rounded-xl border border-ink-dark bg-white shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-ink-dark" />
                <h3 className="text-xl font-bold text-ink-dark">
                  Strategy & Next Steps
                </h3>
              </div>
              <button
                onClick={generateStrategy}
                disabled={isGeneratingStrategy}
                className="flex items-center gap-2 px-3 py-1.5 bg-sky/10 text-sky border border-sky/20 rounded-lg hover:bg-sky/20 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isGeneratingStrategy ? (
                  <Sparkles size={16} className="animate-pulse" />
                ) : (
                  <Sparkles size={16} />
                )}
                {isGeneratingStrategy ? "Generating..." : "AI Suggest"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4">
              {productData.strategy.length === 0 ? (
                <div className="text-center py-12 text-ink-dark/50 border-2 border-dashed border-ink-dark/10 rounded-xl">
                  <Target size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No strategic steps defined.</p>
                  <p className="text-sm mt-1">
                    Add your own or use AI to suggest next steps.
                  </p>
                </div>
              ) : (
                productData.strategy.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-paper-base border border-ink-dark/10 rounded-xl group hover:border-ink-dark/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-ink-dark text-sm leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateStrategyStatus(
                              item.id,
                              e.target.value as any,
                            )
                          }
                          className={`text-xs font-medium px-2 py-1 rounded border focus:outline-none ${
                            item.status === "done"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "doing"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <option value="todo">To Do</option>
                          <option value="doing">Doing</option>
                          <option value="done">Done</option>
                        </select>
                        <button
                          onClick={() => handleRemoveStrategy(item.id)}
                          className="text-ink-dark/40 hover:text-rose-500 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-ink-dark/10">
              <input
                type="text"
                value={newStrategyContent}
                onChange={(e) => setNewStrategyContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddStrategy()}
                placeholder="Add a strategic step..."
                className="flex-1 px-4 py-2 bg-paper-base border border-ink-dark/20 rounded-lg focus:outline-none focus:border-ink-dark text-sm"
              />
              <button
                onClick={handleAddStrategy}
                disabled={!newStrategyContent.trim()}
                className="p-2 bg-ink-dark text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <DocumentationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        myProductData={productData}
        insights={insights}
      />
    </div>
  );
};
