import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, ArrowRight, ShieldAlert, Check } from "lucide-react";

interface CompetitorIngestionProps {
  onStart: (urls: string[]) => void;
}

/**
 *
 */
export const CompetitorIngestion: React.FC<CompetitorIngestionProps> = ({
  onStart,
}) => {
  const [urls, setUrls] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");

  /**
   *
   */
  const handleAddUrl = () => {
    let trimmed = currentInput.trim();
    if (!trimmed) return;

    // basic url formatting if missing http
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      trimmed = "https://" + trimmed;
    }

    if (urls.includes(trimmed)) {
      alert("URL already added");
      return;
    }

    if (urls.length >= 5) {
      alert("Maximum of 5 competitors allowed.");
      return;
    }

    setUrls([...urls, trimmed]);
    setCurrentInput("");
  };

  /**
   *
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUrl();
    }
  };

  /**
   *
   */
  const removeUrl = (idx: number) => {
    setUrls(urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-paper-base flex-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-ink-dark tracking-tight mb-4">
            Identify Your Targets
          </h1>
          <p className="text-xl text-ink-dark/60 max-w-2xl mx-auto">
            Paste the URLs of the competitors you want to analyze and
            outmaneuver.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-ink-dark/10 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-6 relative">
              <input
                type="url"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. https://www.salesforce.com"
                className="w-full h-14 bg-paper-base border border-ink-dark/20 rounded-xl px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-sky/50 transition-shadow"
                disabled={urls.length >= 5}
              />
              <button
                onClick={handleAddUrl}
                disabled={urls.length >= 5 || !currentInput.trim()}
                className="h-14 px-6 bg-ink-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
              >
                <Plus size={20} /> Add
              </button>
            </div>

            {urls.length > 0 && (
              <ul className="space-y-3 mb-8">
                {urls.map((url, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center bg-paper-base p-4 rounded-xl border border-ink-dark/5"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-sky/10 text-sky flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-ink-dark font-medium truncate">
                        {url}
                      </span>
                    </div>
                    <button
                      onClick={() => removeUrl(i)}
                      className="text-ink-dark/40 hover:text-rose-500 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}

            {urls.length === 5 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 mb-6">
                <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>Constraint Enforced:</strong> Analyzing more than 5
                  competitors leads to feature parity traps. Let's focus on your
                  top 3 to 5 threats.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-ink-dark/10 p-6 sm:px-8 bg-paper-light flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-dark/50">
              {urls.length}/5 Competitors Added
            </span>
            <button
              onClick={() => onStart(urls)}
              disabled={urls.length === 0}
              className="px-8 py-3 bg-sky text-white rounded-xl font-bold flex items-center gap-2 hover:bg-sky-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky/20"
            >
              Start Analysis <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
