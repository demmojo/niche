import React, { useState, useEffect } from "react";
import { supabase } from "../utils/hashing";
import { Database, Search, FileText, Image, Code } from "lucide-react";
import { RawDataDetailModal } from "./RawDataDetailModal";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalDbOffline, setIsLocalDbOffline] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetVersion | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!supabase) {
          setIsLocalDbOffline(true);
          throw new Error(
            "Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
          );
        }

        const { data: versions, error: fetchError } = await supabase
          .from("raw_data_versions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (fetchError) {
          if (
            fetchError.message?.includes("Failed to fetch") ||
            fetchError.code === "TypeError"
          ) {
            setIsLocalDbOffline(true);
          }
          console.warn("Supabase fetch failed:", fetchError);
          loadMockData();
        } else {
          setData(versions || []);
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
        {
          id: "v2",
          logical_asset_id: "asset-2",
          data_type: "markdown",
          blob_uri: "s3://bucket/scrape.md",
          extracted_metadata: {
            url: "https://competitor.com/features",
            word_count: 450,
          },
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
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

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading raw data library...
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Database size={20} className="text-blue-600" />
          Raw Data Library
        </h2>
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
        {data.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No raw data ingested yet.
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
