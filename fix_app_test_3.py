import re

with open("src/__tests__/App.test.tsx", "r") as f:
    content = f.read()

old_onsnapshot = """  onSnapshot: vi.fn(),"""

new_onsnapshot = """  onSnapshot: vi.fn((_doc, cb) => {
    setTimeout(() => {
      cb({
        exists: () => true,
        data: () => ({
          status: "completed",
          progress: 100,
          total: 100,
          results: [{ name: "Competitor", trueCompetitorScore: 0.1 }]
        })
      });
    }, 10);
    return () => {};
  }),"""

content = content.replace(old_onsnapshot, new_onsnapshot)

with open("src/__tests__/App.test.tsx", "w") as f:
    f.write(content)
