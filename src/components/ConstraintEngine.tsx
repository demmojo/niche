import React, { useState } from "react";

export interface ConstraintPayload {
  productType: string;
  audience: string;
  valueProp: string;
}

interface Props {
  onSubmit?: (payload: ConstraintPayload) => void;
}

export function ConstraintEngine({ onSubmit }: Props) {
  const [productType, setProductType] = useState("");
  const [audience, setAudience] = useState("");
  const [valueProp, setValueProp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ productType, audience, valueProp });
  };

  return (
    <div className="flex flex-col space-y-4 max-w-xl mx-auto p-6 bg-white border border-gray-200 shadow-sm font-sans">
      <h2 className="text-2xl font-bold font-serif mb-2">
        Let's constrain your idea.
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        <div className="text-xl leading-relaxed flex flex-wrap items-center gap-2">
          <span>I want to build a</span>
          <input
            type="text"
            className="border-b-2 border-gray-300 focus:border-blue-500 outline-none px-2 py-1 bg-transparent w-48 text-center"
            placeholder="e.g. CRM"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          />
          <span>for</span>
          <input
            type="text"
            className="border-b-2 border-gray-300 focus:border-blue-500 outline-none px-2 py-1 bg-transparent w-48 text-center"
            placeholder="e.g. dentists"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
          <span>that helps them</span>
          <input
            type="text"
            className="border-b-2 border-gray-300 focus:border-blue-500 outline-none px-2 py-1 bg-transparent w-64 text-center"
            placeholder="e.g. book appointments faster"
            value={valueProp}
            onChange={(e) => setValueProp(e.target.value)}
          />
          <span>.</span>
        </div>
        <button
          type="submit"
          className="self-start px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
        >
          Generate Idea
        </button>
      </form>
    </div>
  );
}
