import re

with open("src/__tests__/server/campaignRoutes.test.ts", "r") as f:
    text = f.read()

# Replace all vi.mocked(GoogleGenAI).mockImplementationOnce with __generateContentMock and __embedContentMock
import ast

def process_file():
    lines = text.split("\n")
    out = []
    i = 0
    while i < len(lines):
        if "vi.mocked(GoogleGenAI).mockImplementationOnce(" in lines[i]:
            # find the end of this mock
            j = i
            content = []
            open_parens = 0
            while j < len(lines):
                content.append(lines[j])
                open_parens += lines[j].count('(') - lines[j].count(')')
                if open_parens == 0 and "as any" in lines[j] or ("});" in lines[j] and open_parens == 0):
                     break
                j += 1
            if j == len(lines):
                # not found end
                out.append(lines[i])
                i += 1
                continue
                
            block = "\n".join(content)
            
            # Now we parse the block for generateContent and embedContent mocks
            gen = re.search(r"generateContent:\s*(vi\.fn\(\)\.mock[^\(]+\([^)]*\)|mockEmbedContent|vi\.fn\(\)\.mockRejectedValue\([^)]*\))", block)
            emb = re.search(r"embedContent:\s*(vi\.fn\(\)\.mock[^\(]+\([^)]*\)|mockEmbedContent|vi\.fn\(\)\.mockRejectedValue\([^)]*\))", block)
            
            replacement = '      const genai = await import("@google/genai");\n'
            if gen:
                val = gen.group(1)
                if val == "mockEmbedContent":
                    replacement += f'      (genai as any).__generateContentMock.mockImplementationOnce(mockEmbedContent);\n'
                elif "mockResolvedValue" in val:
                    m = re.search(r"mockResolvedValue\((.*)\)", val)
                    if m:
                        replacement += f'      (genai as any).__generateContentMock.mockResolvedValueOnce({m.group(1)});\n'
                elif "mockRejectedValue" in val:
                    m = re.search(r"mockRejectedValue\((.*)\)", val)
                    if m:
                        replacement += f'      (genai as any).__generateContentMock.mockRejectedValueOnce({m.group(1)});\n'
            
            if emb:
                val = emb.group(1)
                if val == "mockEmbedContent":
                    replacement += f'      (genai as any).__embedContentMock.mockImplementationOnce(mockEmbedContent);\n'
                elif "mockResolvedValue" in val:
                    m = re.search(r"mockResolvedValue\((.*)\)", val)
                    if m:
                        replacement += f'      (genai as any).__embedContentMock.mockResolvedValueOnce({m.group(1)});\n'
                elif "mockRejectedValue" in val:
                    m = re.search(r"mockRejectedValue\((.*)\)", val)
                    if m:
                        replacement += f'      (genai as any).__embedContentMock.mockRejectedValueOnce({m.group(1)});\n'
                        
            out.append(replacement)
            i = j + 1
            continue
            
        out.append(lines[i])
        i += 1
    return "\n".join(out)

new_text = process_file()
with open("src/__tests__/server/campaignRoutes.test.ts", "w") as f:
    f.write(new_text)
