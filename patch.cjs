const fs = require('fs');
let content = fs.readFileSync('src/__tests__/components/MarketAnalysis.test.tsx', 'utf8');

const helper = `
const mockKeyRotation = (resolvesToText: any) => async (callback: any) => {
  const dummyAi = { models: { generateContent: vi.fn().mockResolvedValue({ text: JSON.stringify(resolvesToText) }) } };
  return callback(dummyAi, 'test-model');
};
const mockKeyRotationReject = (error: Error) => async (callback: any) => {
  const dummyAi = { models: { generateContent: vi.fn().mockRejectedValue(error) } };
  return callback(dummyAi, 'test-model');
};
describe('MarketAnalysis Component', () => {`;

content = content.replace("describe('MarketAnalysis Component', () => {", helper);

content = content.replace(
  /\(geminiClient\.withKeyRotation as any\)\.mockResolvedValueOnce\(\{\s*text: JSON\.stringify\(([\s\S]*?)\)\s*\}\);/g,
  "(geminiClient.withKeyRotation as any).mockImplementationOnce(mockKeyRotation($1));"
);

content = content.replace(
  /\.mockResolvedValueOnce\(\{\s*text: JSON\.stringify\(([\s\S]*?)\)\s*\}\)/g,
  ".mockImplementationOnce(mockKeyRotation($1))"
);

content = content.replace(
  /\(geminiClient\.withKeyRotation as any\)\.mockResolvedValue\(\{\s*text: JSON\.stringify\(([\s\S]*?)\)\s*\}\);/g,
  "(geminiClient.withKeyRotation as any).mockImplementation(mockKeyRotation($1));"
);

content = content.replace(
  /\(geminiClient\.withKeyRotation as any\)\.mockRejectedValueOnce\((.*?)\);/g,
  "(geminiClient.withKeyRotation as any).mockImplementationOnce(mockKeyRotationReject($1));"
);

fs.writeFileSync('src/__tests__/components/MarketAnalysis.test.tsx', content);
