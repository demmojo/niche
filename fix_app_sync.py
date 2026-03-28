import re

with open("src/__tests__/AppSync.test.tsx", "r") as f:
    content = f.read()

mock_fetch = """        if (url.includes("/api/apollo/search")) {
          return {
            ok: true,
            status: 200,
            json: async () => mockApolloSearchResponse,
          };
        }"""

new_mock_fetch = """        if (url.includes("/api/campaign/start")) {
          return {
            ok: true,
            status: 202,
            json: async () => ({ jobId: "mock-job-id" }),
          };
        }
        if (url.includes("/api/apollo/search")) {
          return {
            ok: true,
            status: 200,
            json: async () => mockApolloSearchResponse,
          };
        }"""

content = content.replace(mock_fetch, new_mock_fetch)

with open("src/__tests__/AppSync.test.tsx", "w") as f:
    f.write(content)
