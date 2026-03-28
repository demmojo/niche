import re

with open('src/__tests__/components/Settings.test.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"it\('handles missing rateLimit gracefully, falling back to local tracking', \(\) => {", r"it('handles missing rateLimit gracefully, falling back to local tracking', async () => {", content)
content = re.sub(r"it\('handles non-pro model daily limits', \(\) => {", r"it('handles non-pro model daily limits', async () => {", content)
content = re.sub(r"it\('handles missing requestsPerModel gracefully', \(\) => {", r"it('handles missing requestsPerModel gracefully', async () => {", content)

with open('src/__tests__/components/Settings.test.tsx', 'w') as f:
    f.write(content)
