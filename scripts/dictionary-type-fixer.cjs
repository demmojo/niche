const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('tMessage(')) return;
  
  // The goal: find all tMessage(dictionary.x.y.z) and make it tMessage(dictionary.x.y.z())
  // Note that if the previous script transformed dictionary.x.y.z() to a string because of bad regex, 
  // we just need to ensure tMessage is fed a string.
  
  // Actually the error says `Argument of type '() => string' is not assignable to parameter of type 'string'`.
  // Which means it currently looks like `tMessage(dictionary.actions.guide.steps.step1)` instead of `tMessage(dictionary.actions.guide.steps.step1())`.
  
  const regex = /tMessage\(\s*(dictionary\.[a-zA-Z0-9_\.]+)\s*\)/g;
  content = content.replace(regex, 'tMessage($1())');
  
  // Wait, there's another error: `Type 'String' has no call signatures.`
  // This happens when something like `dictionary.tooltips.dashboard()` was parsed earlier.
  // It means it already has parens on an object, or we are calling parens on a string.
  // Let's do a more robust string replacement manually for the specific files throwing errors.
  
  fs.writeFileSync(file, content);
}

const files = [
  'src/App.tsx',
  'src/components/DataPointsTable.tsx',
  'src/components/InsightEngineChat.tsx',
  'src/components/PageGuideModal.tsx',
  'src/components/whiteboard/VisualWhiteboard.tsx'
];

for (const f of files) {
  fixFile(f);
}
