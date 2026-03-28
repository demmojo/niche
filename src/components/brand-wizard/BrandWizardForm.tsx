import React, { useState } from "react";
import { z } from "zod";

const urlSchema = z.string().url("Must be a valid URL");

/**
 *
 */
export const BrandWizardForm: React.FC<{
  projectId: string;
  onJobStarted: (jobId: string) => void;
}> = ({ projectId, onJobStarted }) => {
  const [urls, setUrls] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   *
   */
  const handleAddUrl = () => {
    if (urls.length < 5) {
      setUrls([...urls, ""]);
    }
  };

  /**
   *
   */
  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  /**
   *
   */
  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  /**
   *
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const validUrls = urls.filter((url) => url.trim() !== "");

    if (validUrls.length === 0) {
      setError("Please provide at least 1 competitor URL.");
      setIsLoading(false);
      return;
    }

    if (validUrls.length > 5) {
      setError("Maximum of 5 URLs allowed.");
      setIsLoading(false);
      return;
    }

    // Validate URLs
    for (const url of validUrls) {
      const validation = urlSchema.safeParse(url);
      if (!validation.success) {
        setError(`Invalid URL format: ${url}`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const token = await (
        window as any
      ).firebaseAuth?.currentUser?.getIdToken();
      if (!token) throw new Error("User not authenticated.");

      const response = await fetch("/api/brand-wizard/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, urls: validUrls }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start extraction job");
      }

      onJobStarted(data.jobId);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-[#0C0C0C] border border-[#1A1A1A] p-6 rounded-md font-['JetBrains_Mono']">
      <h2 className="text-[#F2F2F2] text-xl font-bold mb-4 font-['Clash_Display']">
        Define the "Sea of Sameness"
      </h2>
      <p className="text-[#888888] text-sm mb-6">
        Enter up to 5 competitor URLs. We will extract their visual and semantic
        brand positioning to find the whitespace in your market.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {urls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              placeholder="https://competitor.com"
              value={url}
              onChange={(e) => handleUrlChange(index, e.target.value)}
              className="flex-1 bg-[#1A1A1A] text-[#F2F2F2] border border-[#333333] px-4 py-2 rounded focus:outline-none focus:border-[#444444]"
            />
            {urls.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveUrl(index)}
                className="text-[#FF2A5F] hover:text-[#FF2A5F]/80 px-4 py-2 bg-[#1A1A1A] border border-[#333333] rounded"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {urls.length < 5 && (
          <button
            type="button"
            onClick={handleAddUrl}
            className="text-[#888888] text-sm hover:text-[#F2F2F2] transition-colors"
          >
            + Add Competitor URL
          </button>
        )}

        {error && <div className="text-[#FF2A5F] text-sm mt-2">{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 bg-[#CCFF00] text-[#0C0C0C] font-bold py-3 rounded hover:bg-[#CCFF00]/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Starting Extraction..." : "Find Whitespace"}
        </button>
      </form>
    </div>
  );
};
