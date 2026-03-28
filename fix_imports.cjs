const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.test.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src/__tests__');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('from "@testing-library/react"')) {
    // calculate relative path to src/test-utils/render
    const renderPath = path.resolve('src/test-utils/render');
    const relativePath = path.relative(path.dirname(file), renderPath);
    const importStr = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    content = content.replace(/from "@testing-library\/react"/g, `from "${importStr}"`);
    fs.writeFileSync(file, content);
  } else if (content.match(/from ".*\/..\/test-utils\/render"/)) {
    // Fix my previous sed mistake
    const renderPath = path.resolve('src/test-utils/render');
    const relativePath = path.relative(path.dirname(file), renderPath);
    const importStr = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    content = content.replace(/from ".*\/..\/test-utils\/render"/g, `from "${importStr}"`);
    fs.writeFileSync(file, content);
  }
});
