import React, { useState, useEffect } from "react";
import { supabase } from "../utils/hashing";
import {
  Database,
  Search,
  FileText,
  Image,
  Code,
  ChevronDown,
  ChevronRight,
  Pin,
} from "lucide-react";
import { RawDataDetailModal } from "./RawDataDetailModal";
import { RawDataMetric } from "../types";
import { aggregateMetrics, ConsolidatedMetric } from "../utils/dataAggregation";

interface AssetVersion {
  id: string;
  logical_asset_id: string;
  data_type: "json" | "markdown" | "image";
  blob_uri: string;
  extracted_metadata: any;
  created_at: string;
}

export const RawDataLibraryTabular: React.FC = () => {
  const [data, setData] = useState<AssetVersion[]>([]);
  const [consolidatedMetrics, setConsolidatedMetrics] = useState<
    ConsolidatedMetric[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalDbOffline, setIsLocalDbOffline] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetVersion | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"assets" | "metrics">("metrics");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          setIsLocalDbOffline(true);
          throw new Error(
            "Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
          );
        }

        const [versionsRes, metricsRes] = await Promise.all([
          supabase
            .from("raw_data_versions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("raw_data_metrics")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

        if (versionsRes.error) {
          if (
            versionsRes.error.message?.includes("Failed to fetch") ||
            versionsRes.error.code === "TypeError"
          ) {
            setIsLocalDbOffline(true);
          }
          console.warn("Supabase fetch failed:", versionsRes.error);
          loadMockData();
        } else {
          setData(versionsRes.data || []);
          if (metricsRes.data) {
            setConsolidatedMetrics(
              aggregateMetrics(metricsRes.data as RawDataMetric[]),
            );
          } else {
            setConsolidatedMetrics([]);
          }
        }
      } catch (err: any) {
        if (err.message?.includes("Failed to fetch") || !supabase) {
          setIsLocalDbOffline(true);
          loadMockData();
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const loadMockData = () => {
      // Mock data for UI development fallback
      setData([
        {
          id: "v1",
          logical_asset_id: "asset-1",
          data_type: "json",
          blob_uri: "s3://bucket/data1.json",
          extracted_metadata: {
            source: "Apollo.io",
            type: "company_enrichment",
            domain: "example.com",
          },
          created_at: new Date().toISOString(),
        },
      ]);

      const mockMetrics: RawDataMetric[] = [
        {
          id: "m1",
          asset_version_id: "v1",
          logical_asset_id: "asset-1",
          metric_name: "employee_count",
          value: 120,
          source_id: "ZoomInfo",
          ai_confidence_score: 90,
          static_source_weight: 80,
          is_pinned: false,
          created_at: new Date().toISOString(),
        },
        {
          id: "m2",
          asset_version_id: "v2",
          logical_asset_id: "asset-2",
          metric_name: "employee_count",
          value: 150,
          source_id: "LinkedIn Scrape",
          ai_confidence_score: 60,
          static_source_weight: 50,
          is_pinned: false,
          created_at: new Date().toISOString(),
        },
        {
          id: "m3",
          asset_version_id: "v1",
          logical_asset_id: "asset-1",
          metric_name: "revenue",
          value: 5000000,
          source_id: "Clearbit",
          ai_confidence_score: 85,
          static_source_weight: 85,
          is_pinned: true,
          created_at: new Date().toISOString(),
        },
      ];
      setConsolidatedMetrics(aggregateMetrics(mockMetrics));
    };

    fetchData();
  }, []);

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

  const toggleRow = (metricName: string) => {
    const next = new Set(expandedRows);
    if (next.has(metricName)) {
      next.delete(metricName);
    } else {
      next.add(metricName);
    }
    setExpandedRows(next);
  };

  const handlePin = async (metric: RawDataMetric) => {
    try {
      // Create synthetic version event for audit trail in a real system:
      // await supabase.from('raw_data_metrics').insert({...metric, is_pinned: true});

      const { error } = await supabase
        .from("raw_data_metrics")
        .update({ is_pinned: true })
        .eq("id", metric.id);

      if (error) throw error;

      // We would re-fetch or optimistically update here:
      const updatedMetrics = consolidatedMetrics.map((cm) => {
        if (cm.metric_name === metric.metric_name) {
          return {
            ...cm,
            value: metric.value,
            is_range: false,
            is_pinned: true,
            sources: cm.sources.map((s) =>
              s.id === metric.id ? { ...s, is_pinned: true } : s,
            ),
          };
        }
        return cm;
      });
      setConsolidatedMetrics(updatedMetrics);
    } catch (err) {
      console.error("Failed to pin metric:", err);
      // Fallback for mock environment
      if (isLocalDbOffline) {
        const updatedMetrics = consolidatedMetrics.map((cm) => {
          if (cm.metric_name === metric.metric_name) {
            return {
              ...cm,
              value: metric.value,
              is_range: false,
              is_pinned: true,
              sources: cm.sources.map((s) =>
                s.id === metric.id ? { ...s, is_pinned: true } : s,
              ),
            };
          }
          return cm;
        });
        setConsolidatedMetrics(updatedMetrics);
      }
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading raw data library...
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Database size={20} className="text-blue-600" />
            Raw Data Library
          </h2>
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === "metrics"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Consolidated Metrics
            </button>
            <button
              onClick={() => setActiveTab("assets")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === "assets"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Raw Assets
            </button>
          </div>
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search metadata..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLocalDbOffline && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 text-sm text-yellow-800 flex items-center justify-center gap-2">
          ⚠️ <strong>Local Database Offline:</strong> Supabase is unreachable.
          Displaying fallback mock data. Ensure `supabase start` is running.
        </div>
      )}

      <div className="overflow-x-auto">
        {activeTab === "assets" ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Asset ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Metadata (JSONB)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Storage URI
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ingested
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedAsset(row)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getIcon(row.data_type)}
                      <span className="text-sm text-gray-900 capitalize">
                        {row.data_type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {row.logical_asset_id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-md overflow-hidden text-ellipsis bg-gray-50 p-2 rounded border font-mono text-xs">
                      {JSON.stringify(row.extracted_metadata)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 truncate max-w-[150px]">
                    {row.blob_uri}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(row.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-6 py-3"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimension Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consolidated Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trust Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consolidatedMetrics.map((cm) => (
                <React.Fragment key={cm.metric_name}>
                  <tr
                    onClick={() => toggleRow(cm.metric_name)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      {expandedRows.has(cm.metric_name) ? (
                        <ChevronDown size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRight
                          size={16}
                          className="text-gray-400 group-hover:text-gray-600"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize flex items-center gap-2">
                      {cm.metric_name.replace(/_/g, " ")}
                      {cm.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          <Pin size={10} className="fill-current" /> Pinned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {cm.is_range ? (
                        <span className="text-amber-600 font-semibold">
                          {cm.value}
                        </span>
                      ) : (
                        <span className="text-gray-900">{cm.value}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          cm.confidence_score >= 80
                            ? "bg-emerald-100 text-emerald-800"
                            : cm.confidence_score >= 50
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {cm.confidence_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cm.sources.length} sources
                    </td>
                  </tr>

                  {/* Expandable Multi-Source Matrix row */}
                  {expandedRows.has(cm.metric_name) && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-inner">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100/50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                  Source Name
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                  Extracted Value
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                  AI Conf
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                  Base Wt
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                                  Date
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {cm.sources.map((src) => (
                                <tr
                                  key={src.id}
                                  className={
                                    src.is_pinned ? "bg-blue-50/50" : ""
                                  }
                                >
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {src.source_id || "Unknown API"}
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium">
                                    {src.value}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {src.ai_confidence_score}%
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {src.static_source_weight}%
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500">
                                    {new Date(
                                      src.created_at,
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <button
                                      onClick={() => handlePin(src)}
                                      disabled={src.is_pinned}
                                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                                        src.is_pinned
                                          ? "bg-blue-100 text-blue-700 cursor-default"
                                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                      }`}
                                    >
                                      <Pin
                                        size={12}
                                        className={
                                          src.is_pinned ? "fill-current" : ""
                                        }
                                      />
                                      {src.is_pinned ? "Pinned" : "Pin Value"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "assets" && data.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No raw data ingested yet.
          </div>
        )}
        {activeTab === "metrics" && consolidatedMetrics.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No metrics extracted yet. Run an AI analysis to populate.
          </div>
        )}
      </div>

      <RawDataDetailModal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
      />
    </div>
  );
};
