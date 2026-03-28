import { dictionary, tMessage } from "../content/dictionary";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Upload,
  FileText,
  Loader2,
  Database,
  FileJson,
  FileCode2,
  FileSpreadsheet,
  Image as ImageIcon,
} from "lucide-react";
import { Tooltip } from "./Tooltip";
import { Type } from "@google/genai";
import { withModelFallback } from "../utils/aiClient";
import { compressImage } from "../utils/imageUtils";
import { calculateImageHash } from "../utils/hashWorkerAPI";

interface UploadDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataAnalyzed: (newSources: any[], newInsights: any[]) => void;
  competitors: any[];
}

export const UploadDataModal: React.FC<UploadDataModalProps> = ({
  isOpen,
  onClose,
  onDataAnalyzed,
  competitors,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs when modal closes or files change
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setPreviews((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return {};
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const newPreviews: Record<string, string> = {};
    files.forEach((f) => {
      if (f.type.startsWith("image/")) {
        // Reuse existing preview if available, otherwise create new
        newPreviews[f.name] = previews[f.name] || URL.createObjectURL(f);
      }
    });

    // Revoke any previews for files that were removed
    Object.keys(previews).forEach((name) => {
      if (!newPreviews[name]) {
        URL.revokeObjectURL(previews[name]);
      }
    });

    setPreviews(newPreviews);
  }, [files]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            // Give pasted files a unique name
            const ext = file.type.split("/")[1] || "png";
            const renamedFile = new File(
              [file],
              `pasted-image-${Date.now()}.${ext}`,
              { type: file.type },
            );
            pastedFiles.push(renamedFile);
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        processNewFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const processNewFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith("image/"));
    const textFiles = newFiles.filter((f) => !f.type.startsWith("image/"));

    if (textFiles.length > 0) {
      // If there's a text file, it overrides everything and we only take the first one
      setFiles([textFiles[0]]);
    } else if (imageFiles.length > 0) {
      // If only images, append to existing images (if any text file was there, clear it)
      setFiles((prev) => {
        const prevImages = prev.filter((f) => f.type.startsWith("image/"));
        // Filter out duplicates by name
        const uniqueImages = imageFiles.filter(
          (img) => !prevImages.some((p) => p.name === img.name),
        );
        const combined = [...prevImages, ...uniqueImages];
        // Limit to 5 images
        if (combined.length > 5) {
          alert("Maximum of 5 images allowed per analysis.");
        }
        return combined.slice(0, 5);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processNewFiles(Array.from(e.target.files));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    try {
      const parts: any[] = [];

      const promptText = `You are a market intelligence analyst. Analyze the following raw data uploaded by the user.
      
Existing Competitors:
${competitors.map((c) => c.name).join(", ")}

Extract raw data points and derive strategic insights from this input.
Return the result as a JSON object with two arrays: "newSources" and "newInsights".

"newSources" should be an array of objects matching this structure:
{
  "competitorId": "ID of the competitor this relates to (use existing or 'general')",
  "type": "website", "api", "github", "screenshot", "linkedin", "crunchbase", or "news",
  "sourceUrl": "The filename or inferred URL",
  "excerpt": "A relevant quote or summary of the data point",
  "tags": ["tag1", "tag2"],
  "confidenceLevel": "High", "Medium", or "Low"
}

"newInsights" should be an array of objects matching this structure:
{
  "title": "Short, punchy title",
  "description": "Detailed explanation of the insight",
  "category": "Pricing", "Feature Gap", "Market Shift", "UX/UI", or "Integration",
  "impact": "critical", "high", "medium", or "low",
  "actionableSteps": ["Step 1", "Step 2"]
}
`;

      parts.push({ text: promptText });

      // Add text file contents
      const textFile = files.find((f) => !f.type.startsWith("image/"));
      if (textFile) {
        let text = "";
        if (typeof textFile.text === "function") {
          text = await textFile.text();
        } else {
          text = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (e) => reject(e);
            reader.readAsText(textFile);
          });
        }
        parts.push({
          text: `\nData Content (${textFile.name}):\n${text.substring(0, 15000)}`,
        });
      }

      // Add image contents sequentially to aid Garbage Collection and avoid mobile memory OOM
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        for (const img of imageFiles) {
          try {
            // 1. Calculate dHash client-side via Web Worker
            const hash = await calculateImageHash(img);
            console.log(`Computed dHash for ${img.name}: ${hash}`);

            // 2. Check deduplication API
            const hashRes = await fetch("/api/images/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hash }),
            });
            const hashData = await hashRes.json();

            // NOTE: Even if duplicate, for this analysis we still need to process it
            // In a full implementation, we'd pass the existing URL to the backend or use the base64 just for the prompt

            // 3. Compress and append image
            const { base64Data, mimeType } = await compressImage(img);
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType,
              },
            });
            parts.push({
              text: `\nFilename: ${img.name}\nSource URL: ${hashData.url || hashData.presignedUrl}`,
            });

            // Sleep briefly to yield thread and allow GC to collect temporary buffers
            await new Promise((r) => setTimeout(r, 50));
          } catch (err) {
            console.error("Failed to process image:", img.name, err);
          }
        }
      }

      const response = await withModelFallback(
        async (ai, model) => {
          return ai.generateContent(model, {
            contents: parts,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  newSources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        competitorId: { type: Type.STRING },
                        type: { type: Type.STRING },
                        sourceUrl: { type: Type.STRING },
                        excerpt: { type: Type.STRING },
                        tags: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        confidenceLevel: { type: Type.STRING },
                      },
                      required: ["type", "excerpt"],
                    },
                  },
                  newInsights: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: { type: Type.STRING },
                        impact: { type: Type.STRING },
                        actionableSteps: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                      required: ["title", "description", "category", "impact"],
                    },
                  },
                },
              },
            },
          });
        },
        { tier: "fast" },
      );

      const result = JSON.parse(response.text || "{}");

      const sources = (result.newSources || []).map((s: any) => ({
        ...s,
        id: "src-" + Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        isDeduced: true,
        source: "Human",
        linkedInsightIds: [],
      }));

      const insights = (result.newInsights || []).map((i: any) => ({
        ...i,
        id: "ins-" + Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        sourceIds: [],
        source: "AI",
      }));

      onDataAnalyzed(sources, insights);
      onClose();
    } catch (error) {
      console.error("Error analyzing file:", error);
      alert("Failed to analyze file. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith(".json"))
      return <FileJson size={32} className="text-sky" />;
    if (filename.endsWith(".csv"))
      return <FileSpreadsheet size={32} className="text-emerald-500" />;
    if (filename.endsWith(".md"))
      return <FileCode2 size={32} className="text-purple-500" />;
    if (filename.match(/\.(jpg|jpeg|png|webp)$/i))
      return <ImageIcon size={32} className="text-rose-500" />;
    return <FileText size={32} className="text-ink-dark/40" />;
  };

  const hasFiles = files.length > 0;
  const isMultiple = files.length > 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-ink-dark/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-paper-light rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-ink-dark/20 flex flex-col"
          >
            {/* Header */}
            <div className="relative p-6 sm:p-8 border-b border-ink-dark/10 bg-gradient-to-br from-paper-base to-paper-light overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white border border-ink-dark/10 flex items-center justify-center shadow-sm mb-4">
                    <Database size={24} className="text-sky" />
                  </div>
                  <h2 className="text-2xl font-bold text-ink-dark tracking-tight">
                    Import Raw Data
                  </h2>
                  <p className="text-ink-dark/60 mt-1 text-sm">
                    Upload competitor research, pricing tables, or paste
                    screenshots. Our AI will automatically extract insights and
                    data points.
                  </p>
                </div>
                <Tooltip
                  content={tMessage(dictionary.tooltips.common.closeModal)}
                  position="left"
                >
                  <button
                    onClick={onClose}
                    className="p-2 text-ink-dark/40 hover:text-ink-dark hover:bg-white rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 bg-white">
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all duration-200 overflow-hidden
                  ${
                    dragActive
                      ? "border-sky bg-sky/5 scale-[1.02]"
                      : hasFiles
                        ? "border-emerald-500/50 bg-emerald-50/50"
                        : "border-ink-dark/20 hover:border-ink-dark/40 hover:bg-paper-base cursor-pointer"
                  }
                `}
                onClick={() => !hasFiles && fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept=".txt,.csv,.json,.md,image/png,image/jpeg,image/webp"
                />

                <div className="relative z-10 flex flex-col items-center w-full">
                  {hasFiles ? (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="w-full flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-ink-dark/60 uppercase tracking-wider">
                          {files.length} {files.length === 1 ? "File" : "Files"}{" "}
                          selected
                        </span>
                        {files[0].type.startsWith("image/") &&
                          files.length < 5 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="text-xs font-semibold text-sky hover:text-sky-dark uppercase tracking-wider px-3 py-1 bg-white rounded-lg border border-sky/20"
                            >
                              Add More Images
                            </button>
                          )}
                      </div>

                      <div
                        className={`grid gap-3 w-full ${isMultiple ? "grid-cols-2" : "grid-cols-1"}`}
                      >
                        {files.map((f, idx) => (
                          <div
                            key={`${f.name}-${idx}`}
                            className="relative group bg-white p-3 rounded-xl border border-ink-dark/10 flex items-center gap-3 text-left"
                          >
                            {f.type.startsWith("image/") ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-ink-dark/5 bg-paper-base flex items-center justify-center">
                                <img
                                  src={previews[f.name]}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg shrink-0 border border-ink-dark/5 bg-paper-base flex items-center justify-center">
                                {getFileIcon(f.name)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-semibold text-ink-dark truncate"
                                title={f.name}
                              >
                                {f.name}
                              </p>
                              <p className="text-xs text-ink-dark/50 font-medium">
                                {(f.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              onClick={(e) => removeFile(e, f.name)}
                              className="p-1.5 text-ink-dark/40 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {files.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles([]);
                          }}
                          className="mt-6 text-xs font-semibold text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                        >
                          Clear All
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-ink-dark/10 flex items-center justify-center mb-4 text-ink-dark/30 group-hover:text-sky transition-colors">
                        <Upload size={32} />
                      </div>
                      <p className="text-ink-dark font-semibold text-lg">
                        Click, drag and drop, or paste (Cmd+V)
                      </p>
                      <p className="text-sm text-ink-dark/50 mt-2 max-w-xs mx-auto">
                        Supported: TXT, CSV, JSON, Markdown, Screenshots (max
                        5MB)
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 sm:px-8 sm:py-6 border-t border-ink-dark/10 bg-paper-base flex items-center justify-between">
              <p className="text-xs text-ink-dark/40 hidden sm:block">
                Data is processed securely.
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-ink-dark/70 hover:text-ink-dark font-semibold transition-colors rounded-xl hover:bg-ink-dark/5"
                  disabled={isAnalyzing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!hasFiles || isAnalyzing}
                  className="relative flex items-center justify-center gap-2 px-6 py-2.5 bg-ink-dark text-white rounded-xl font-semibold hover:bg-black transition-all disabled:opacity-50 disabled:hover:bg-ink-dark shadow-md hover:shadow-lg overflow-hidden group min-w-[160px]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload
                        size={18}
                        className="group-hover:-translate-y-1 transition-transform"
                      />
                      <span>Analyze Data</span>
                    </>
                  )}
                  {/* Shine effect */}
                  {!isAnalyzing && hasFiles && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
