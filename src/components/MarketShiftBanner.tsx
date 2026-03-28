import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function MarketShiftBanner() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "notifications"),
      where("type", "==", "MARKET_SHIFT"),
      // in reality we'd filter by userId or projectId
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  if (notifications.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-amber-100 border-l-4 border-amber-500 p-4 m-4 rounded shadow-sm flex items-start gap-3"
      >
        <AlertCircle className="text-amber-500 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">
            Market Shift Detected!
          </h3>
          <p className="text-sm text-amber-800 mt-1">
            {notifications[0].message}
          </p>
        </div>
        <button
          onClick={() => setNotifications([])}
          className="text-amber-700 hover:text-amber-900 transition-colors"
        >
          <X size={18} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
