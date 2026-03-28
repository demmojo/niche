import re

with open("src/__tests__/server/campaignRoutes.test.ts", "r") as f:
    content = f.read()

# Fix mock collection
old_mock = """  const collectionMock = vi.fn(() => ({
    doc: docMock,
    add: addMock,
  }));"""

new_mock = """  const collectionMock = vi.fn(() => {
    const whereMock = vi.fn().mockReturnThis();
    const getQueryMock = vi.fn().mockResolvedValue({ empty: true });
    
    return {
      doc: docMock,
      add: addMock,
      where: whereMock,
      get: getQueryMock,
    };
  });"""

content = content.replace(old_mock, new_mock)

with open("src/__tests__/server/campaignRoutes.test.ts", "w") as f:
    f.write(content)
