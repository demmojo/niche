const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const getStatus = () => {
    const changesDir = 'openspec/changes';
    if (!fs.existsSync(changesDir)) return;
    
    const dirs = fs.readdirSync(changesDir).filter(f => fs.statSync(path.join(changesDir, f)).isDirectory());
    
    dirs.forEach(dir => {
        const yamlPath = path.join(changesDir, dir, '.openspec.yaml');
        if (fs.existsSync(yamlPath)) {
            const content = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
            console.log(`CHANGE: ${dir} -> status: ${content.status}, extracted: ${content.learnings_extracted}`);
        } else {
            console.log(`CHANGE: ${dir} -> NO YAML`);
        }
    });

    const plansDir = 'openspec/plans';
    if (fs.existsSync(plansDir)) {
        const files = fs.readdirSync(plansDir).filter(f => f.endsWith('.md'));
        files.forEach(file => {
            console.log(`PLAN: ${file}`);
        });
    }
};

getStatus();
