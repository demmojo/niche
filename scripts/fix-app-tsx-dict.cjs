const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The naive replacer added () to all property accesses of 'dictionary'.
// Need to find things like dictionary.common() and remove the () since it's an object property, not a function
const regex = /dictionary\.([a-zA-Z0-9_]+)\(\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const replacement = `dictionary.${match[1]}`;
  content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
  regex.lastIndex -= 2; // Adjust for removed characters
}

fs.writeFileSync('src/App.tsx', content);

// And we need to fix the multi-level object property accesses that were mistakenly turned into functions
// i.e dictionary.tooltips() -> dictionary.tooltips
const regex2 = /dictionary\.([a-zA-Z0-9_]+)\(\)\.([a-zA-Z0-9_]+)\(\)/g;
while ((match = regex2.exec(content)) !== null) {
  const replacement = `dictionary.${match[1]}.${match[2]}()`;
  content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
  regex2.lastIndex -= 2; 
}

// And three levels...
const regex3 = /dictionary\.([a-zA-Z0-9_]+)\(\)\.([a-zA-Z0-9_]+)\(\)\.([a-zA-Z0-9_]+)\(\)/g;
while ((match = regex3.exec(content)) !== null) {
  const replacement = `dictionary.${match[1]}.${match[2]}.${match[3]}()`;
  content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
  regex3.lastIndex -= 4; 
}
// Four levels...
const regex4 = /dictionary\.([a-zA-Z0-9_]+)\(\)\.([a-zA-Z0-9_]+)\(\)\.([a-zA-Z0-9_]+)\(\)\.([a-zA-Z0-9_]+)\(\)/g;
while ((match = regex4.exec(content)) !== null) {
  const replacement = `dictionary.${match[1]}.${match[2]}.${match[3]}.${match[4]}()`;
  content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
  regex4.lastIndex -= 6; 
}

fs.writeFileSync('src/App.tsx', content);
