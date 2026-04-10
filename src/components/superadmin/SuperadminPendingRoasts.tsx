import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

interface Report {
  id: string;
  userEmail: string;
  draft_markdown: string;
  status: string;
  lineage_data: any;
  ref: any;
}

export function SuperadminPendingRoasts({ user }: { user: any }) {
  const isSuperadmin =
    user?.email === "mo.hassaniv@gmail.com" ||
    user?.email === "admin@test.com" ||
    user?.email === "mo@nicheai.com" ||
    user?.email === "erdemunal89@gmail.com";

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [draftMarkdown, setDraftMarkdown] = useState("");

  useEffect(() => {
    if (!isSuperadmin) return;

    const q = query(
      collection(db, "pending_reports"),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d: any) => ({
        id: d.id,
        userEmail: d.data().userEmail,
        draft_markdown: d.data().draft_markdown,
        status: d.data().status,
        lineage_data: d.data().lineage_data,
        ref: d.ref,
      }));
      setReports(docs);
    });

    return () => unsubscribe();
  }, [isSuperadmin]);

  if (!isSuperadmin) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Unauthorized. Superadmin only.
      </div>
    );
  }

  const handleSelect = (report: Report) => {
    setSelectedReport(report);
    setDraftMarkdown(report.draft_markdown);
  };

  const handleApprove = async () => {
    try {
      await updateDoc(selectedReport!.ref, {
        status: "approved",
        draft_markdown: draftMarkdown,
      });
      // Optionally trigger email backend or rely on Firebase Functions
      setSelectedReport(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    try {
      await updateDoc(selectedReport!.ref, {
        status: "rejected",
      });
      setSelectedReport(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-100 overflow-hidden">
      {/* Sidebar: Queue */}
      <div className="w-1/3 border-r border-zinc-800 bg-zinc-900 overflow-y-auto">
        <h2 className="text-xl font-bold p-4 border-b border-zinc-800 bg-zinc-950 sticky top-0">
          Pending Roasts ({reports.length})
        </h2>
        <ul className="divide-y divide-zinc-800">
          {reports.map((r) => (
            <li
              key={r.id}
              onClick={() => handleSelect(r)}
              className={`p-4 cursor-pointer hover:bg-zinc-800 transition-colors ${
                selectedReport?.id === r.id
                  ? "bg-zinc-800 border-l-4 border-emerald-500"
                  : ""
              }`}
            >
              <div className="font-medium">{r.userEmail}</div>
              <div className="text-xs text-zinc-400 truncate mt-1">
                {r.draft_markdown}
              </div>
            </li>
          ))}
          {reports.length === 0 && (
            <li className="p-8 text-center text-zinc-500">
              No pending reports in queue.
            </li>
          )}
        </ul>
      </div>

      {/* Main Content: Review Editor */}
      <div className="w-2/3 flex flex-col bg-zinc-950">
        {selectedReport ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
              <h3 className="font-bold">
                Review for: {selectedReport.userEmail}
              </h3>
              <div className="space-x-3 flex">
                <button
                  onClick={handleReject}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500/10 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shadow-lg"
                >
                  Approve Report
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Lineage Panel */}
              <div className="w-1/3 p-4 overflow-y-auto border-r border-zinc-800 bg-zinc-900/50">
                <h4 className="font-semibold text-zinc-400 uppercase text-xs mb-4 tracking-wider">
                  Lineage Context
                </h4>
                <div className="space-y-4">
                  <div className="bg-zinc-800 rounded p-3 text-sm">
                    <span className="block text-zinc-500 mb-1">
                      Tarpit Score:
                    </span>
                    <span className="font-mono text-lg font-bold text-amber-400">
                      {selectedReport.lineage_data?.tarpitScore || "N/A"}
                    </span>
                    {selectedReport.lineage_data?.wasOverridden && (
                      <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                        MATH OVERRIDE
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block text-zinc-500 text-xs mb-2">
                      Exa References:
                    </span>
                    <ul className="space-y-2">
                      {selectedReport.lineage_data?.exaResults?.map(
                        (res: any, idx: number) => (
                          <li
                            key={idx}
                            className="bg-zinc-800 p-2 rounded text-xs border border-zinc-700"
                          >
                            <strong
                              className="block mb-1 truncate"
                              title={res.title}
                            >
                              {res.title}
                            </strong>
                            <p className="text-zinc-400 line-clamp-3">
                              {res.text}
                            </p>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Editor Panel */}
              <div className="w-2/3 p-4 flex flex-col bg-[#1e1e1e]">
                <textarea
                  className="w-full flex-1 p-4 bg-transparent text-zinc-300 font-mono text-sm leading-relaxed outline-none resize-none border-none"
                  value={draftMarkdown}
                  onChange={(e) => setDraftMarkdown(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Select a report from the queue to review and edit.
          </div>
        )}
      </div>
    </div>
  );
}
