# Specification: React 19 & Firebase Integration

## Detailed Features

### 1. Pure Read State (Snapshot-Only Approach)

The core hook pattern strictly uses `onSnapshot` equipped with `includeMetadataChanges: true`. It leverages an `AbortController` tied to dependency trees (like `workspaceId`) to cleanly sever operations during unmounts or context switches.

### 2. Decoupled Write Operations

Mutations are extracted into separate handlers wrapped in React 19's `useTransition`. standard writes must use `setDoc(ref, data, {merge: true})` to ensure changes queue locally when offline.

### Implementation Reference

```tsx
import { useState, useEffect, useTransition } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

export function useDataSync(docId: string, workspaceId: string) {
  const [serverData, setServerData] = useState<Data | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isMutating, startMutation] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    const unsubscribe = onSnapshot(
      doc(db, "data", docId),
      { includeMetadataChanges: true },
      (docSnap) => {
        if (controller.signal.aborted) return;
        if (docSnap.exists()) {
          setServerData(docSnap.data() as Data);
          setError(null);
        } else {
          setServerData(null);
        }
      },
      (err) => {
        if (controller.signal.aborted) return;
        console.error("Snapshot error:", err);
        setError(err);
      },
    );
    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [docId, workspaceId]);

  const updateData = (newData: Partial<Data>) => {
    startMutation(async () => {
      try {
        await setDoc(doc(db, "data", docId), newData, { merge: true });
      } catch (err) {
        setError(err as Error);
      }
    });
  };

  return {
    data: serverData,
    status: isMutating ? "STATE_MUTATING" : "STATE_IDLE",
    error,
    updateData,
  };
}
```

## Scenarios

**Scenario 1: Component Mounts and Syncs**

- **WHEN** a component utilizing `useDataSync` mounts
- **THEN** an `onSnapshot` listener is attached immediately.
- **AND** no parallel `getDoc` fetch is executed.

**Scenario 2: Developer applies a Mutation**

- **WHEN** `updateData` is called
- **THEN** the React transition `isMutating` state becomes true.
- **AND** the operation is performed using `setDoc` with `{merge: true}`.
- **AND** the UI immediately reflects the update via Firebase's native latency compensation (`hasPendingWrites`).

**Scenario 3: Offline Writes**

- **WHEN** the user is offline and triggers a mutation
- **THEN** `setDoc` queues the write locally.
- **AND** `runTransaction` is explicitly avoided to prevent immediate failure.

**Scenario 4: Tenant/Workspace Switch**

- **WHEN** the `workspaceId` dependency changes
- **THEN** the cleanup function aborts the `AbortController` and calls `unsubscribe()`.
- **AND** pending state updates are ignored to prevent React state leaks.

**Scenario 5: Auth Account Upgrades**

- **WHEN** an anonymous user links a permanent authentication provider
- **THEN** the `isMergingRef` state freeze is engaged.
- **AND** `onAuthStateChanged` callbacks are paused to avoid `permission-denied` cascading crashes.
