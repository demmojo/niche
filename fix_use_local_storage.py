import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove isLocalUpdate ref
content = content.replace("  const isLocalUpdate = useRef(false);\n", "")

# Remove isLocalUpdate setting in setValue
content = content.replace("    isLocalUpdate.current = true;\n", "")

# Replace the onSnapshot check
old_snapshot_check = """      (docSnap) => {
        if (isLocalUpdate.current) {
          isLocalUpdate.current = false;
          return;
        }"""

new_snapshot_check = """      (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) {
          return;
        }
        
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }"""

content = content.replace(old_snapshot_check, new_snapshot_check)

with open("src/App.tsx", "w") as f:
    f.write(content)
