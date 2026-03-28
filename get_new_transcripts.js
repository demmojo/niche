const fs = require('fs');
const path = require('path');

const indexFile = '/home/demmojo/Code/nicheai/.cursor/hooks/state/continual-learning-index.json';
const transcriptsDir = '/home/demmojo/.cursor/projects/home-demmojo-Code-nicheai/agent-transcripts';

let index = {};
if (fs.existsSync(indexFile)) {
  index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
}

function findJsonlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findJsonlFiles(filePath));
    } else if (filePath.endsWith('.jsonl')) {
      results.push({ path: filePath, mtime: stat.mtimeMs / 1000 });
    }
  }
  return results;
}

const files = findJsonlFiles(transcriptsDir);
let newOrModified = [];
for (const f of files) {
  if (!index[f.path] || f.mtime > index[f.path]) {
    newOrModified.push(f.path);
  }
}

console.log(JSON.stringify(newOrModified, null, 2));
