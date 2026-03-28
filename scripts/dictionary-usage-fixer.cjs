const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('dictionary.')) return;
  
  // This regex matches cases like: dictionary.tooltips.matrix.suggestFeature
  // We need to replace it with dictionary.tooltips.matrix.suggestFeature()
  
  const regex = /dictionary\.([a-zA-Z0-9_\.]+)/g;
  let matches;
  let replacements = [];
  
  while ((matches = regex.exec(content)) !== null) {
     // Check if it's already called
     const nextChar = content[matches.index + matches[0].length];
     if (nextChar !== '(') {
         replacements.push({
             start: matches.index,
             end: matches.index + matches[0].length,
             text: `${matches[0]}()`
         });
     }
  }
  
  // Apply replacements from back to front
  for (let i = replacements.length - 1; i >= 0; i--) {
     const r = replacements[i];
     content = content.slice(0, r.start) + r.text + content.slice(r.end);
  }
  
  fs.writeFileSync(filePath, content);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
          walkDir(fullPath);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
          if (fullPath !== 'src/content/dictionary.ts') {
             processFile(fullPath);
          }
      }
  }
}

walkDir('src');
