import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../AuthProvider";
import { useAuthDialogDispatch } from "../AuthDialogProvider";
import Markdown from "react-markdown";

interface Report {
  id: string;
  userEmail: string;
  draft_markdown: string;
  status: string;
}

export function MyReports() {
  const { user } = useAuth();
  const { openModal } = useAuthDialogDispatch();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!user || user.isAnonymous || !user.email) return;

    // Query strictly by creatorUid for data integrity and to prevent cross-account injection.
    // This perfectly solves email alias issues (e.g. first.last vs firstlast) since UID is invariant.
    const q = query(
      collection(db, "pending_reports"),
      where("creatorUid", "==", user.uid),
      where("status", "==", "approved"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d: any) => ({
        id: d.id,
        userEmail: d.data().userEmail,
        draft_markdown: d.data().draft_markdown,
        status: d.data().status,
      }));
      setReports(docs);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user || user.isAnonymous) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#F5F3ED] min-h-screen text-[#2C2C2C]">
        <h2 className="text-2xl font-bold mb-4">
          Please sign in to view your reports.
        </h2>
        <button
          onClick={openModal}
          className="px-6 py-2 bg-[#2C2C2C] text-[#F5F3ED] rounded-lg"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#F5F3ED] min-h-screen text-[#2C2C2C]">
      <h1 className="text-3xl font-bold mb-8">My Niche Reports</h1>

      {reports.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow border border-black/10">
          <p className="text-black/60">
            No approved reports found for your account.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-white p-8 rounded-lg shadow border border-black/10"
            >
              <div className="prose max-w-none">
                <Markdown>{r.draft_markdown}</Markdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
