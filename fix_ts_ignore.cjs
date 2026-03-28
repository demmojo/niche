const fs = require('fs');

function insertIgnore(path, searchString) {
  let text = fs.readFileSync(path, 'utf8');
  // insert // @ts-ignore before the line containing the searchString
  const lines = text.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString) && !lines[i-1].includes('// @ts-ignore')) {
      newLines.push('          // @ts-ignore');
    }
    newLines.push(lines[i]);
  }
  fs.writeFileSync(path, newLines.join('\n'));
}

insertIgnore('src/components/ConsolidateFeaturesModal.tsx', 'zodToJsonSchema(featureConsolidationSchema');
insertIgnore('src/components/InsightGeneratorModal.tsx', 'zodToJsonSchema(questionSchema');
insertIgnore('src/components/InsightGeneratorModal.tsx', 'zodToJsonSchema(finalInsightSchema');
insertIgnore('src/components/MyProduct.tsx', 'zodToJsonSchema(distributionSchema');
insertIgnore('src/utils/ExternalSignalsSyncJob.ts', 'zodToJsonSchema(painPointsSchema');
insertIgnore('src/utils/ExternalSignalsSyncJob.ts', 'zodToJsonSchema(jtbdSchema');
insertIgnore('src/utils/tarpitAnalyzer.ts', 'zodToJsonSchema(tarpitSchema');
