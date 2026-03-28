const fs = require('fs');
const path = require('path');

// First rewrite dictionary.ts
const dictPath = 'src/content/dictionary.ts';
let dictContent = fs.readFileSync(dictPath, 'utf8');

// Using a simpler approach to rewrite the dictionary values to functions
let lines = dictContent.split('\n');
for (let i = 0; i < lines.length; i++) {
  // Ignore header lines and closing brackets
  if (i < 7 || lines[i].trim() === '}' || lines[i].trim() === '};') continue;
  
  // Look for `key: "string",`
  const singleLineStr = lines[i].match(/^(\s*)([a-zA-Z0-9_]+):\s*(["'].*["']),?$/);
  if (singleLineStr) {
    lines[i] = `${singleLineStr[1]}${singleLineStr[2]}: () => ${singleLineStr[3]},`;
    continue;
  }
  
  // Look for multi-line string where next line starts with a quote
  const multiLineStart = lines[i].match(/^(\s*)([a-zA-Z0-9_]+):\s*$/);
  if (multiLineStart && i + 1 < lines.length && lines[i+1].trim().startsWith('"')) {
    lines[i] = `${multiLineStart[1]}${multiLineStart[2]}: () =>`;
    continue;
  }
}

// Write the modified dictionary
fs.writeFileSync(dictPath, lines.join('\n'));

// Now process all other files that use the dictionary
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
          walkDir(fullPath);
      } else if ((fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) && fullPath !== dictPath) {
          let content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('dictionary.')) {
              // We want to append () to the final property access of dictionary.*
              // E.g., dictionary.tooltips.matrix.suggestFeature -> dictionary.tooltips.matrix.suggestFeature()
              
              // We'll use a regex that matches `dictionary.a.b.c` and capture the whole thing
              const regex = /dictionary\.[a-zA-Z0-9_\.]+[a-zA-Z0-9_]/g;
              
              content = content.replace(regex, (match, offset, string) => {
                  // If it's already a function call, or it's followed by a parenthesis, ignore it
                  if (string[offset + match.length] === '(') {
                      return match;
                  }
                  
                  // Also ignore if it's just 'dictionary.common' without a terminal property (e.g. inside the old PageGuideModal)
                  // Let's assume most valid accesses are at least 3 parts: dictionary.domain.action
                  const parts = match.split('.');
                  if (parts.length >= 3) {
                      return match + '()';
                  }
                  return match;
              });
              
              fs.writeFileSync(fullPath, content);
          }
      }
  }
}

walkDir('src');
