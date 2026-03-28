import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { createContext, useContext, useRef, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

export interface AuditLogEntry {
  id: string;
  status: "PENDING_CONSENT" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  proposedAction: any;
  context: any;
  createdAt: number;
}

interface ActionAuditState {
  logs: AuditLogEntry[];
  autonomyMode: "Co-Pilot" | "Auto-Pilot";

  // Actions
  setLogs: (logs: AuditLogEntry[]) => void;
  setAutonomyMode: (mode: "Co-Pilot" | "Auto-Pilot") => void;
  approveAction: (taskId: string) => Promise<void>;
}

export const createActionAuditStore = () =>
  createStore<ActionAuditState>((set, get) => ({
    logs: [],
    autonomyMode: "Co-Pilot",

    setLogs: (logs) => set({ logs }),

    setAutonomyMode: (mode) => set({ autonomyMode: mode }),

    approveAction: async (taskId) => {
      try {
        const taskRef = doc(db, "Tasks", taskId);
        await updateDoc(taskRef, { status: "QUEUED" });
        // The onSnapshot listener will automatically update the local state
      } catch (err) {
        console.error("Failed to approve action:", err);
      }
    },
  }));

export const testActionAuditStore = createActionAuditStore();
export const ActionAuditContext = createContext<ReturnType<
  typeof createActionAuditStore
> | null>(null);

export function ActionAuditProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<ReturnType<typeof createActionAuditStore>>(null);
  if (!storeRef.current) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    storeRef.current =
      typeof process !== "undefined" && process.env.NODE_ENV === "test"
        ? testActionAuditStore
        : createActionAuditStore();
  }

  useEffect(() => {
    // Subscribe to Firestore for live audit log projection
    const q = query(
      collection(db, "Tasks"),
      orderBy("updatedAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs: AuditLogEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        newLogs.push({
          id: docSnap.id,
          status: data.status,
          proposedAction: data.proposedAction,
          context: data.context,
          createdAt: data.updatedAt?.toMillis() || Date.now(),
        });
      });
      storeRef.current?.getState().setLogs(newLogs);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ActionAuditContext.Provider value={storeRef.current}>
      {children}
    </ActionAuditContext.Provider>
  );
}

export function useActionAuditStore(): ActionAuditState;
export function useActionAuditStore<T>(
  selector: (state: ActionAuditState) => T,
): T;
export function useActionAuditStore<T>(
  selector?: (state: ActionAuditState) => T,
) {
  const store = useContext(ActionAuditContext);
  if (!store) throw new Error("Missing ActionAuditProvider");
  return useStore(store, selector!);
}
