import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  History,
  RotateCcw,
  FileText,
  Code,
  Image,
  Database,
  Loader2,
} from "lucide-react";
import { supabase } from "../utils/hashing";

interface AssetVersion {
  id: string;
  logical_asset_id: string;
  data_type: "json" | "markdown" | "image";
  blob_uri: string;
  extracted_metadata: any;
  created_at: string;
}

interface RawDataDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetVersion | null;
}

/**
 *
 */
export const RawDataDetailModal: React.FC<RawDataDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen || !asset) return;

    /**
     *
     */
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from("raw_data_versions")
          .select("*")
          .eq("logical_asset_id", asset.logical_asset_id)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setHistory(data);
        } else {
          // Fallback to mock data for UI testing if DB isn't fully seeded
          setHistory([
            asset,
            {
              ...asset,
              id: "v-old",
              created_at: new Date(
                new Date(asset.created_at).getTime() - 86400000,
              ).toISOString(),
              extracted_metadata: {
                ...asset.extracted_metadata,
                note: "Previous version",
              },
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [isOpen, asset]);

  /**
   *
   */
  const handleRevert = async (versionId: string) => {
    if (!asset) return;

    try {
      // Update the current_version_id on the asset
      await supabase
        .from("raw_data_assets")
        .update({ current_version_id: versionId })
        .eq("logical_asset_id", asset.logical_asset_id);

      alert(`Successfully reverted to version: ${versionId}`);
      // In a real app, this would refresh the parent component's data
      onClose();
    } catch (err) {
      console.error("Failed to revert:", err);
      alert("Failed to revert to this version.");
    }
  };

  /**
   *
   */
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /**
   *
   */
  const getIcon = (type: string) => {
    switch (type) {
      case "json":
        return <Code size={16} className="text-blue-500" />;
      case "markdown":
        return <FileText size={16} className="text-gray-600" />;
      case "image":
        return <Image size={16} className="text-purple-500" />;
      default:
        return <Database size={16} />;
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              {getIcon(asset.data_type)}
              <h2 className="text-lg font-serif font-semibold text-gray-900">
                Asset Details{" "}
                <span className="text-sm font-mono text-gray-400 font-normal">
                  #{asset.logical_asset_id.substring(0, 8)}
                </span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Primary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Storage URI
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm font-mono text-blue-600 break-all">
                    {asset.blob_uri}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Ingestion Date
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600">
                    {new Date(asset.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Extracted Metadata
                  </h3>
                  <pre className="bg-gray-900 p-4 rounded-lg text-sm font-mono text-green-400 overflow-x-auto">
                    {JSON.stringify(asset.extracted_metadata, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Version History */}
              <div className="pt-8 border-t border-gray-100 mt-8">
                <h3 className="text-lg font-serif font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <History size={18} className="text-gray-500" />
                  Global Snapshot Timeline
                </h3>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-gray-200 ml-4 space-y-8">
                    {history.map((v, index) => {
                      const isCurrent = v.id === asset.id;
                      const isExpanded = !!expandedRows[v.id];

                      return (
                        <div key={v.id} className="relative">
                          {/* Timeline dot */}
                          <div
                            className={`absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 border-white ${isCurrent ? "bg-blue-500" : "bg-gray-300"}`}
                          ></div>

                          <div
                            className={`bg-white border rounded-lg overflow-hidden transition-all ${isCurrent ? "border-blue-200 shadow-sm" : "border-gray-200"}`}
                          >
                            <div
                              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isCurrent ? "bg-blue-50/30" : ""}`}
                              onClick={() => toggleRow(v.id)}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-gray-900">
                                    Version {history.length - index}
                                  </span>
                                  {isCurrent && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">
                                      Current Active
                                    </span>
                                  )}
                                  {v.extracted_metadata?.is_synthetic_pin && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-medium">
                                      Manual Pin
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  <span className="font-mono text-xs">
                                    {v.id.substring(0, 8)}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {new Date(v.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-start sm:self-auto">
                                {!isCurrent && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRevert(v.id);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                                  >
                                    <RotateCcw size={14} /> Restore Snapshot
                                  </button>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                                  Snapshot Data
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">
                                      Storage URI
                                    </div>
                                    <div className="text-xs font-mono bg-white p-2 rounded border border-gray-200 text-blue-600 truncate">
                                      {v.blob_uri}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">
                                      Data Type
                                    </div>
                                    <div className="text-xs bg-white p-2 rounded border border-gray-200 font-medium">
                                      {v.data_type}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 mb-1">
                                  Extracted Metadata
                                </div>
                                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-auto max-h-60">
                                  {JSON.stringify(
                                    v.extracted_metadata,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
