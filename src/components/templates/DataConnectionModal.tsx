import React, { useState } from "react";
import { B_H2, B_H3, B_TextBody, B_Button, B_Badge } from "../BrutalistUI";

interface DataConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (draftConfig: Record<string, string>) => void;
  templateSchema: Array<{ key: string; label: string; type: string }>;
  availableSources: Array<{ key: string; label: string; type: string }>;
}

/**
 *
 */
export function DataConnectionModal({
  isOpen,
  onClose,
  onApply,
  templateSchema,
  availableSources,
}: DataConnectionModalProps) {
  // Draft/Commit State Pattern: isolate modal state until user explicitly applies.
  const [draftConfig, setDraftConfig] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  /**
   *
   */
  const handleSelectChange = (schemaKey: string, sourceKey: string) => {
    setDraftConfig((prev) => ({
      ...prev,
      [schemaKey]: sourceKey,
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white text-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 font-sans">
        <div className="flex justify-between items-center p-6 border-b-4 border-black bg-slate-100">
          <B_H2 className="text-black">DATA MAPPING CONFIG</B_H2>
          <button
            onClick={onClose}
            className="text-black hover:text-slate-600 font-mono text-xl"
          >
            [ X ]
          </button>
        </div>

        <div className="p-6">
          <B_TextBody className="mb-6 text-black">
            Map your raw data fields to the strict template schema requirements.
          </B_TextBody>

          {/* Bento-Box Receipt UI */}
          <div className="border-4 border-black bg-white rounded-none">
            <div className="grid grid-cols-2 border-b-4 border-black bg-slate-200">
              <div className="p-4 border-r-4 border-black font-mono font-bold uppercase tracking-tight">
                Required Schema
              </div>
              <div className="p-4 font-mono font-bold uppercase tracking-tight">
                Live Source Connection
              </div>
            </div>

            {templateSchema.map((field, idx) => (
              <div
                key={field.key}
                className={`grid grid-cols-2 ${
                  idx !== templateSchema.length - 1
                    ? "border-b-2 border-black"
                    : ""
                }`}
              >
                <div className="p-4 border-r-4 border-black flex items-center gap-2">
                  <span className="font-mono text-sm bg-black text-white px-2 py-1 uppercase">
                    {field.type}
                  </span>
                  <span className="font-mono font-medium">{field.label}</span>
                </div>
                <div className="p-4 flex items-center bg-slate-50">
                  <select
                    className="w-full bg-white border-2 border-black p-2 font-mono text-sm uppercase appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-brutal-cyan)]"
                    value={draftConfig[field.key] || ""}
                    onChange={(e) =>
                      handleSelectChange(field.key, e.target.value)
                    }
                  >
                    <option value="" disabled>
                      Select Source Field...
                    </option>
                    {availableSources.map((src) => (
                      <option key={src.key} value={src.key}>
                        {src.label} [{src.type}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t-4 border-black bg-slate-100 flex justify-end gap-4">
          <B_Button
            className="bg-white text-black border-2 border-black hover:bg-slate-200 shadow-none hover:translate-y-0"
            onClick={onClose}
          >
            CANCEL
          </B_Button>
          <B_Button
            className="bg-black text-[var(--color-brutal-chartreuse)] border-2 border-black shadow-[4px_4px_0px_0px_#D9F99D]"
            onClick={() => {
              onApply(draftConfig);
              onClose();
            }}
          >
            APPLY & SYNC
          </B_Button>
        </div>
      </div>
    </div>
  );
}
