import React, { useState, useEffect } from "react";
import { supabase } from "../utils/hashing";
import { executeActionLogic } from "../utils/backgroundProcessor";

interface DLQItem {
  id: string;
  job_type: string;
  status: "pending" | "retrying" | "resolved" | "terminal";
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string;
  created_at: string;
  error_details: any;
  payload: any;
}

/**
 *
 */
export function DLQViewer() {
  const [items, setItems] = useState<DLQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "pending" | "retrying" | "resolved" | "terminal" | "all"
  >("all");

  /**
   *
   */
  const fetchDLQ = async () => {
    setLoading(true);
    let query = supabase
      .from("dead_letter_queue")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    } else {
      query = query.in("status", ["pending", "retrying", "terminal"]);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching DLQ:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDLQ();
  }, [filterStatus]);

  /**
   *
   */
  const handleRetry = async (job: DLQItem) => {
    try {
      console.log(`Manual retry for job ${job.id}`);
      if (job.job_type === "inbox_action") {
        const { item, action } = job.payload;
        await executeActionLogic(item, action);

        // Mark inbox item as resolved
        const { error: inboxError } = await supabase
          .from("raw_data_inbox")
          .update({
            status: `resolved_${action}`,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (inboxError)
          throw new Error(
            `Failed to update inbox status: ${inboxError.message}`,
          );
      }

      // Mark DLQ item as resolved
      await supabase
        .from("dead_letter_queue")
        .update({
          status: "resolved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      alert(`Job ${job.id} resolved successfully!`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      const newAttemptCount = job.attempt_count + 1;
      const isTerminal = newAttemptCount >= job.max_attempts;
      const status = isTerminal ? "terminal" : "retrying";

      await supabase
        .from("dead_letter_queue")
        .update({
          status,
          attempt_count: newAttemptCount,
          error_details: { message: errorMsg, manual_retry: true },
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      alert(`Retry failed: ${errorMsg}`);
    }
    fetchDLQ();
  };

  /**
   *
   */
  const handleBulkRetry = async () => {
    const pendingJobs = items.filter(
      (i) =>
        i.status === "pending" ||
        i.status === "retrying" ||
        i.status === "terminal",
    );
    for (const job of pendingJobs) {
      await handleRetry(job);
    }
    fetchDLQ();
  };

  /**
   *
   */
  const handleDelete = async (job: DLQItem) => {
    if (
      !window.confirm("Are you sure you want to permanently discard this job?")
    )
      return;

    await supabase.from("dead_letter_queue").delete().eq("id", job.id);
    fetchDLQ();
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Dead-Letter Queue
        </h2>
        <div className="flex gap-4">
          <select
            className="border p-2 rounded bg-white dark:bg-gray-700 dark:text-gray-200"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Pending / Terminal</option>
            <option value="pending">Pending</option>
            <option value="retrying">Retrying</option>
            <option value="terminal">Terminal (Dead)</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={fetchDLQ}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            onClick={handleBulkRetry}
          >
            Bulk Retry All
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading DLQ...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Queue is empty! Great job.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  ID / Date
                </th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Type / Status
                </th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Attempts
                </th>
                <th className="py-3 px-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Error Details
                </th>
                <th className="py-3 px-4 text-right font-semibold text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-4">
                    <span className="block font-mono text-xs text-gray-500 truncate w-32">
                      {job.id}
                    </span>
                    <span className="block text-gray-700 dark:text-gray-300">
                      {new Date(job.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="block font-semibold text-gray-800 dark:text-gray-200">
                      {job.job_type}
                    </span>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded mt-1 
                      ${
                        job.status === "terminal"
                          ? "bg-red-100 text-red-800"
                          : job.status === "retrying"
                            ? "bg-yellow-100 text-yellow-800"
                            : job.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {job.attempt_count} / {job.max_attempts}
                  </td>
                  <td className="py-3 px-4">
                    <div className="max-w-xs overflow-hidden">
                      <p
                        className="text-red-600 dark:text-red-400 font-medium truncate"
                        title={job.error_details?.message}
                      >
                        {job.error_details?.message || "Unknown error"}
                      </p>
                      <details className="text-xs text-gray-500 mt-1 cursor-pointer">
                        <summary>Payload</summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                          {JSON.stringify(job.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {job.status !== "resolved" && (
                      <button
                        onClick={() => handleRetry(job)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 font-medium"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(job)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 font-medium ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
