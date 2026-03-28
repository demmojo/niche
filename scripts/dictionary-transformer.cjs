const fs = require('fs');

const fileContent = fs.readFileSync('src/content/dictionary.ts', 'utf8');

let newContent = fileContent;

const lines = newContent.split('\n');
const processedLines = lines.map(line => {
  // Ignore lines that don't match typical dictionary keys
  if (line.includes('export const dictionary = {') || line.includes('export type LocalizedString') || line.includes('export function tMessage') || line.includes('return copy as LocalizedString') || line.trim() === '}' || line.trim() === '};') {
    return line;
  }
  
  // Replace: key: "value",
  // With: key: () => "value",
  let match = line.match(/^(\s*)([a-zA-Z0-9_]+):\s*(["'].*["']),?$/);
  if (match) {
    return `${match[1]}${match[2]}: () => ${match[3]},`;
  }
  
  // Handling multi-line strings (simplified heuristic, we know what the file looks like)
  let multiMatch = line.match(/^(\s*)([a-zA-Z0-9_]+):\s*$/);
  if (multiMatch && lines[lines.indexOf(line) + 1].trim().startsWith('"')) {
     return `${multiMatch[1]}${multiMatch[2]}: () =>`;
  }

  return line;
});

newContent = processedLines.join('\n');
newContent += '\nexport type Dictionary = typeof dictionary;';

fs.writeFileSync('src/content/dictionary.ts', newContent);
