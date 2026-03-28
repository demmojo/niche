const fs = require('fs');

const firebaseSyncPath = 'src/hooks/useFirebaseSync.ts';
let fbContent = fs.readFileSync(firebaseSyncPath, 'utf8');

const fbDocs = `/**
 * Synchronizes local component state with a specific Firebase Firestore document.
 * 
 * @description
 * Returns a stateful value and a function to update it, exactly like \`useState\`.
 * The local state is updated immediately (optimistic UI), while the heavy JSON
 * serialization and network request are deferred to a 2000ms debounced timeout.
 * 
 * This hook automatically disables the network via \`safeDisableNetwork()\` if the
 * Firebase "resource-exhausted" quota is reached to prevent repeated failures.
 * 
 * @param key - The unique string key for the data (used as the document ID in Firestore).
 * @param initialValue - The initial state value if the document does not exist.
 * @returns A tuple: \`[currentState, setterFunction]\`
 * 
 * @throws Does not throw directly to the UI, but catches and logs Firestore errors.
 * If the quota is exceeded, the network is disabled automatically.
 * 
 * @example
 * \`\`\`tsx
 * const [notes, setNotes] = useFirebaseSync<string[]>('userNotes', []);
 * 
 * // Updates UI instantly, syncs to Firebase after 2s of inactivity
 * setNotes([...notes, 'New Note']); 
 * \`\`\`
 */
export function useFirebaseSync<T>(`;

fbContent = fbContent.replace("export function useFirebaseSync<T>(", fbDocs);
fs.writeFileSync(firebaseSyncPath, fbContent);


const syncQueuePath = 'src/hooks/useSyncQueue.ts';
let sqContent = fs.readFileSync(syncQueuePath, 'utf8');

const sqDocs = `/**
 * Manages a global background queue for syncing state to external systems.
 * 
 * @description
 * Returns the current state of the global sync queue (idle, syncing, or error).
 * This hook uses the \`SyncEngine\` singleton under the hood, ensuring that multiple
 * components across the React tree can query or trigger a global sync without
 * duplicating network requests or establishing redundant WebSocket connections.
 * 
 * @returns An object containing the current sync \`status\`, the \`lastSynced\` timestamp,
 * any active \`error\`, and a \`triggerSync\` function.
 * 
 * @example
 * \`\`\`tsx
 * const { status, triggerSync, lastSynced } = useSyncQueue();
 * 
 * if (status === 'syncing') return <Spinner />;
 * return <button onClick={triggerSync}>Sync Now (Last: {lastSynced})</button>;
 * \`\`\`
 */
export function useSyncQueue() {`;

sqContent = sqContent.replace("export function useSyncQueue() {", sqDocs);
fs.writeFileSync(syncQueuePath, sqContent);


const localStorePath = 'src/__tests__/useLocalStorage.test.tsx'; 
// Actually it's src/hooks/useLocalStorage.tsx but wait, wait, useLocalStorage is defined in App.tsx or useLocalStorage.ts?
// Wait, the plan says `useLocalStorage`. Let's check where it lives.
