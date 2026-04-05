const fs = require('fs');
let html = fs.readFileSync('canvas/plg-builder.html', 'utf8');

// 1. Make the floating toolbar more prominent and add an arrow
html = html.replace('background: #232326;', 'background: #1A1A1A;');
html = html.replace('box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.1);', 'box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255,255,255,0.1);');

// 2. Make the Intelligence sidebar header pop a bit more
html = html.replace('h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm tracking-tight"', 'h2 className="font-bold text-gray-900 flex items-center gap-2 text-base tracking-tight"');

// 3. Make the Locked State blur look even more premium (frosted glass)
html = html.replace('background: rgba(255, 255, 255, 0.6);', 'background: rgba(255, 255, 255, 0.4);');
html = html.replace('backdrop-filter: blur(2px);', 'backdrop-filter: blur(4px);');

fs.writeFileSync('canvas/plg-builder.html', html);
