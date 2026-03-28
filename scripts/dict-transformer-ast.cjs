const fs = require('fs');

const dictPath = 'src/content/dictionary.ts';
let dictLines = fs.readFileSync(dictPath, 'utf8').split('\n');

for (let i = 0; i < dictLines.length; i++) {
  if (i < 7 || dictLines[i].trim() === '}' || dictLines[i].trim() === '};') continue;
  
  const singleMatch = dictLines[i].match(/^(\s*)([a-zA-Z0-9_]+):\s*(["'].*["']),?$/);
  if (singleMatch) {
    dictLines[i] = `${singleMatch[1]}${singleMatch[2]}: () => ${singleMatch[3]},`;
    continue;
  }
  
  const multiStart = dictLines[i].match(/^(\s*)([a-zA-Z0-9_]+):\s*$/);
  if (multiStart && i + 1 < dictLines.length && dictLines[i+1].trim().startsWith('"')) {
    dictLines[i] = `${multiStart[1]}${multiStart[2]}: () =>`;
    continue;
  }
}
fs.writeFileSync(dictPath, dictLines.join('\n'));

// Regex replacement that's smarter
function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('dictionary.')) return;
  
  // Find everything like `dictionary.xyz.abc`
  // We want to replace `dictionary.xyz.abc` with `dictionary.xyz.abc()` IF it is NOT followed by `(` or `.`
  const regex = /dictionary\.([a-zA-Z0-9_]+\.)*([a-zA-Z0-9_]+)/g;
  
  content = content.replace(regex, (match, p1, p2, offset, string) => {
      const nextChar = string[offset + match.length];
      if (nextChar === '(' || nextChar === '.') return match;
      
      // If it's just 'dictionary' with no dot properties (shouldn't happen with regex but safe)
      if (match === 'dictionary') return match;
      
      // If it's 'dictionary.common' and next char is NOT `.`
      // Wait, `common` is an object, but `common.actions` is an object...
      // Only the leaves are strings -> functions.
      // So let's only replace if it's the exact known leaf properties.
      
      // Simplest way for NicheAI: just replace ALL `tMessage(dictionary.x.y.z)` with `tMessage(dictionary.x.y.z())`
      return match;
  });
  
  // A much safer way: We specifically look inside `tMessage(...)` calls since that's where the dictionary string is used.
  // Actually, `tMessage(dictionary.a.b.c)` -> `tMessage(dictionary.a.b.c())`
  const tMessageRegex = /tMessage\(\s*(dictionary\.[a-zA-Z0-9_\.]+)\s*\)/g;
  content = content.replace(tMessageRegex, 'tMessage($1())');
  
  fs.writeFileSync(file, content);
}

const path = require('path');
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
          walkDir(fullPath);
      } else if ((fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) && fullPath !== dictPath) {
          fixFile(fullPath);
      }
  }
}
walkDir('src');
