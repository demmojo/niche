import re

with open("src/__tests__/hooks/useFirebaseSync.test.ts", "r") as f:
    content = f.read()

# Make sure all `exists: () => true` have `metadata: { hasPendingWrites: false }`
content = re.sub(
    r'data: \(\) => \(\{ value: (.*?) \}\),\n      \}\);',
    r'data: () => ({ value: \1 }),\n        metadata: { hasPendingWrites: false },\n      });',
    content
)

with open("src/__tests__/hooks/useFirebaseSync.test.ts", "w") as f:
    f.write(content)
