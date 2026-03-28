const fs = require('fs');

let content = fs.readFileSync('src/components/InsightQuestModal.tsx', 'utf8');

const replacements = [
  [/bg-zinc-950/g, 'bg-slate-50 dark:bg-zinc-950'],
  [/bg-zinc-900/g, 'bg-white dark:bg-zinc-900'],
  [/bg-zinc-800/g, 'bg-slate-100 dark:bg-zinc-800'],
  [/bg-zinc-700/g, 'bg-slate-200 dark:bg-zinc-700'],
  [/border-zinc-800/g, 'border-slate-200 dark:border-zinc-800'],
  [/border-zinc-700/g, 'border-slate-300 dark:border-zinc-700'],
  [/text-zinc-50/g, 'text-slate-900 dark:text-zinc-50'],
  [/text-zinc-200/g, 'text-slate-800 dark:text-zinc-200'],
  [/text-zinc-300/g, 'text-slate-700 dark:text-zinc-300'],
  [/text-zinc-400/g, 'text-slate-500 dark:text-zinc-400'],
  [/text-zinc-500/g, 'text-slate-400 dark:text-zinc-500'],
  [/text-zinc-600/g, 'text-slate-400 dark:text-zinc-600'],
  [/bg-zinc-950\/50/g, 'bg-slate-50/50 dark:bg-zinc-950/50'],
  [/bg-zinc-900\/50/g, 'bg-white/50 dark:bg-zinc-900/50'],
  [/bg-zinc-800\/50/g, 'bg-slate-100/50 dark:bg-zinc-800/50'],
  [/border-zinc-800\/50/g, 'border-slate-200/50 dark:border-zinc-800/50'],
  [/bg-zinc-800\/80/g, 'bg-slate-100/80 dark:bg-zinc-800/80'],
  [/bg-zinc-950\/30/g, 'bg-slate-50/30 dark:bg-zinc-950/30'],
];

replacements.forEach(([regex, replacement]) => {
  content = content.replace(regex, replacement);
});

fs.writeFileSync('src/components/InsightQuestModal.tsx', content);
console.log('Refactored InsightQuestModal.tsx for light/dark mode');
