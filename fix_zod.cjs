const fs = require('fs');

function replaceFile(path, old, replacement) {
  let text = fs.readFileSync(path, 'utf8');
  text = text.split(old).join(replacement);
  fs.writeFileSync(path, text);
}

replaceFile('scripts/openspec-cli/__tests__/eval.test.ts', "status: 'active'", "status: 'active' as any");
replaceFile('src/components/ConsolidateFeaturesModal.tsx', 'zodToJsonSchema(featureConsolidationSchema as any)', 'zodToJsonSchema(featureConsolidationSchema) as any');
replaceFile('src/components/InsightGeneratorModal.tsx', 'zodToJsonSchema(questionSchema as any)', 'zodToJsonSchema(questionSchema) as any');
replaceFile('src/components/InsightGeneratorModal.tsx', 'zodToJsonSchema(finalInsightSchema as any)', 'zodToJsonSchema(finalInsightSchema) as any');
replaceFile('src/components/MyProduct.tsx', 'zodToJsonSchema(distributionSchema as any)', 'zodToJsonSchema(distributionSchema) as any');
replaceFile('src/utils/ExternalSignalsSyncJob.ts', 'zodToJsonSchema(painPointsSchema as any)', 'zodToJsonSchema(painPointsSchema) as any');
replaceFile('src/utils/ExternalSignalsSyncJob.ts', 'zodToJsonSchema(jtbdSchema as any)', 'zodToJsonSchema(jtbdSchema) as any');

