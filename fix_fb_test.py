import re

with open("src/__tests__/hooks/useFirebaseSync.test.ts", "r") as f:
    content = f.read()

# For `mockOnSnapshotCallback({`
content = content.replace(
    'mockOnSnapshotCallback({\n        exists: () => false,\n      });',
    'mockOnSnapshotCallback({\n        exists: () => false,\n        metadata: { hasPendingWrites: false },\n      });'
)

content = content.replace(
    'mockOnSnapshotCallback({ exists: () => false });',
    'mockOnSnapshotCallback({ exists: () => false, metadata: { hasPendingWrites: false } });'
)

content = content.replace(
    'exists: () => true,\n        data: () => ({ value: "server value" }),',
    'exists: () => true,\n        data: () => ({ value: "server value" }),\n        metadata: { hasPendingWrites: false },'
)

with open("src/__tests__/hooks/useFirebaseSync.test.ts", "w") as f:
    f.write(content)
