const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== '__tests__') {
        replaceInDir(fullPath);
      }
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace presenter.fail(...) followed by process.exit(1)
      content = content.replace(/presenter\.fail\(([^;]+)\);\s*process\.exit\(1\);/g, 'await presenter.fail($1);\n    return;');
      
      // Replace lone process.exit(1) where presenter might be in scope
      content = content.replace(/process\.exit\(1\);/g, 'await presenter.safeExit(1);\n    return;');

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('/home/demmojo/Code/nicheai/scripts/openspec-cli');
