import React, { useState } from "react";
import {
  X,
  Upload,
  Loader2,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { Tooltip } from "./Tooltip";
import { MyProductData, ProductFeature } from "./MyProduct";

interface VisualSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  myProductData: MyProductData;
  setMyProductData: React.Dispatch<React.SetStateAction<MyProductData>>;
}

/**
 *
 */
export const VisualSyncModal: React.FC<VisualSyncModalProps> = ({
  isOpen,
  onClose,
  myProductData,
  setMyProductData,
}) => {
  const [step, setStep] = useState<"upload" | "processing" | "reality-check">(
    "upload",
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [proposedUpdates, setProposedUpdates] = useState<any[]>([]);

  if (!isOpen) return null;

  /**
   *
   */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      /**
       *
       */
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   *
   */
  const processImage = async (base64: string) => {
    setStep("processing");
    try {
      const res = await fetch("/api/visual/reality-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          currentFeatures: myProductData.features,
        }),
      });
      const data = await res.json();
      setProposedUpdates(data.proposedUpdates || []);
      setStep("reality-check");
    } catch (err) {
      console.error(err);
      setStep("upload");
    }
  };

  /**
   *
   */
  const applyUpdates = () => {
    setMyProductData((prev) => {
      const newFeatures = [...prev.features];
      proposedUpdates.forEach((update) => {
        const featureIndex = newFeatures.findIndex(
          (f) => f.name.toLowerCase() === update.featureName.toLowerCase(),
        );
        if (featureIndex !== -1) {
          newFeatures[featureIndex].status = update.proposedStatus;
        } else {
          newFeatures.push({
            id: Math.random().toString(36).substring(7),
            name: update.featureName,
            description: update.reason,
            status: update.proposedStatus,
            provenance: { sourceType: "visual_lens" },
          });
        }
      });
      return { ...prev, features: newFeatures };
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-dark/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-paper-light rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl border border-ink-dark/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-dark/20 bg-paper-base/50">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink-dark">
              Visual Sync Engine
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              Upload screenshots to sync product state instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-muted hover:text-ink-dark transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
          {step === "upload" && (
            <div className="w-full max-w-md border-2 border-dashed border-ink-dark/20 rounded-2xl p-12 text-center hover:border-ink-dark/40 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleUpload}
              />
              <Upload size={48} className="mx-auto text-ink-dark/40 mb-4" />
              <h3 className="text-xl font-bold text-ink-dark mb-2">
                Upload Screenshot
              </h3>
              <p className="text-sm text-ink-muted">
                Drag and drop or click to browse.
              </p>
            </div>
          )}

          {step === "processing" && (
            <div className="text-center space-y-6">
              <div className="relative w-32 h-32 mx-auto">
                <Loader2 size={128} className="animate-spin text-ink-dark/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={32} className="text-ink-dark animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-ink-dark">
                Extracting Visual Intelligence...
              </h3>
              <p className="text-sm text-ink-muted">
                Running OmniParser bounding boxes and Multi-Modal Semantic
                Mapping.
              </p>
            </div>
          )}

          {step === "reality-check" && (
            <div className="w-full grid grid-cols-2 gap-8 h-full">
              <div className="h-full flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-4">
                  The Lens (Screenshot)
                </h3>
                <div className="flex-1 bg-paper-base border border-ink-dark/20 rounded-xl overflow-hidden relative">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {/* Mock Bounding Box */}
                  <div className="absolute top-[20%] left-[10%] w-[30%] h-[15%] border-2 border-sky bg-sky/20 transition-all cursor-crosshair group">
                    <span className="absolute -top-6 left-0 bg-sky text-white text-[10px] px-2 py-1 font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Dark Mode Toggle
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-full flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted mb-4">
                  Reality Check Diff
                </h3>
                <div className="flex-1 bg-white border border-ink-dark/20 rounded-xl p-6 space-y-4">
                  {proposedUpdates.length > 0 ? (
                    proposedUpdates.map((update, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-sky/5 border border-sky/20 rounded-lg flex gap-4 items-start"
                      >
                        <CheckCircle2 className="text-sky shrink-0" size={20} />
                        <div>
                          <h4 className="font-bold text-ink-dark text-sm">
                            {update.featureName}
                          </h4>
                          <p className="text-xs text-ink-muted mt-1">
                            {update.reason}
                          </p>
                          <p className="text-[10px] uppercase font-bold text-sky mt-2">
                            Proposed Status: {update.proposedStatus}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-ink-muted">
                      No updates proposed.
                    </p>
                  )}

                  <div className="pt-8">
                    <button
                      onClick={applyUpdates}
                      className="w-full py-3 bg-ink-dark text-white font-bold rounded-lg hover:bg-black transition-colors"
                    >
                      Apply Sync Updates to MyProduct
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
