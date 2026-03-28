import React, { useState, useEffect } from "react";
import { B_H2, B_Card, B_Button, B_TextBody, B_Badge } from "../BrutalistUI";
import { Check, X } from "lucide-react";

interface TinderForFeaturesProps {
  features: { id: string; title: string; desc: string; status: string }[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export default function TinderForFeatures({
  features,
  onAccept,
  onReject,
}: TinderForFeaturesProps) {
  const [currentFeature, setCurrentFeature] = useState(features[0]);

  useEffect(() => {
    setCurrentFeature(features[0]);
  }, [features]);

  if (!currentFeature) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--color-brutal-chartreuse)] font-mono text-xl uppercase tracking-widest bg-[#1E293B]">
        [ ALL FEATURES REVIEWED ]
        <B_TextBody className="mt-4 text-white text-sm">
          Return to chat to extract strategy and proceed.
        </B_TextBody>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col items-center justify-center bg-[#0F172A] relative overflow-hidden">
      <div className="absolute top-8 left-8">
        <B_Badge variant="success">FEATURE SCOPING</B_Badge>
        <B_H2 className="text-white mt-2">NICHE FEATURE SELECTION</B_H2>
        <B_TextBody className="text-slate-400 text-sm mt-1 max-w-md">
          Explicitly Accept or Reject hyper-niche features to build the perfect
          MVP and train the strategy engine.
        </B_TextBody>
      </div>

      {/* Feature Card */}
      <div className="relative w-full max-w-lg mt-12">
        <div className="absolute inset-0 bg-[var(--color-brutal-chartreuse)] translate-x-2 translate-y-2 border-4 border-black" />
        <B_Card className="relative z-10 border-4 border-black bg-white p-8 rounded-none transition-transform duration-200">
          <div className="flex justify-between items-start mb-6">
            <B_H2 className="text-black uppercase tracking-tight">
              {currentFeature.title}
            </B_H2>
            <B_Badge variant="info">AI PROPOSED</B_Badge>
          </div>

          <B_TextBody className="text-black text-lg mb-8 font-mono">
            {currentFeature.desc}
          </B_TextBody>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={() => onReject(currentFeature.id)}
              className="w-20 h-20 rounded-full border-4 border-black bg-[var(--color-brutal-red)] flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <X size={32} strokeWidth={3} />
            </button>

            <button
              onClick={() => onAccept(currentFeature.id)}
              className="w-20 h-20 rounded-full border-4 border-black bg-[var(--color-brutal-chartreuse)] flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <Check size={32} strokeWidth={3} />
            </button>
          </div>
        </B_Card>
      </div>

      <div className="absolute bottom-8 font-mono text-slate-500 text-sm">
        [ {features.length} FEATURES REMAINING IN QUEUE ]
      </div>
    </div>
  );
}
