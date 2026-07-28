const fs = require('fs');
let content = fs.readFileSync('c:\\Users\\HP\\Documents\\vercel-lucira\\vercel-lucira\\lucira-frontend\\src\\components\\pages\\SophisticatedMetalCalculator.jsx', 'utf8');

const replacements = [
  { search: /bg-\[\#150D0C\]/g, replace: 'bg-white' },
  { search: /bg-\[\#0D0706\]/g, replace: 'bg-white' },
  { search: /bg-\[\#201413\]/g, replace: 'bg-[#FAF3EC]/50' },
  { search: /bg-\[\#201413\]\/50/g, replace: 'bg-[#FAF3EC]' },
  { search: /bg-\[\#2E1E1C\]/g, replace: 'bg-white' },
  { search: /bg-\[\#170E0D\]/g, replace: 'bg-[#F2E3C6]/20' },
  { search: /border-\[\#3A2826\]/g, replace: 'border-[#F2E3C6]' },
  { search: /border-\[\#3A2826\]\/40/g, replace: 'border-[#F2E3C6]' },
  { search: /border-\[\#4E3532\]/g, replace: 'border-[#D4B392]' },
  { search: /text-\[\#A38E8C\]/g, replace: 'text-zinc-500' },
  { search: /text-white/g, replace: 'text-zinc-900' },
  { search: /text-zinc-400/g, replace: 'text-zinc-500' },
  { search: /hover:text-zinc-200/g, replace: 'hover:text-zinc-900' },
  { search: /text-zinc-300/g, replace: 'text-zinc-700' },
  { search: /shadow-\[0_20px_50px_rgba\(0,0,0,0\.5\)\]/g, replace: 'shadow-[0_10px_40px_rgba(163,130,113,0.15)]' },
  { search: /bg-black\/70/g, replace: 'bg-black/40' },
  { search: /hover:bg-\[\#2E1E1C\]/g, replace: 'hover:bg-zinc-50' },
  // Scrollbar
  { search: /background: \#0D0706;/g, replace: 'background: #FAF3EC;' },
  { search: /background: \#3A2826;/g, replace: 'background: #D4B392;' },
  { search: /background: \#4E3532;/g, replace: 'background: #B77767;' },
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

// Since the toggle thumb is white in dark mode, and background is white in light mode, let's make toggle thumb match theme
content = content.replace(/bg-white rounded-full shadow-md/g, 'bg-white rounded-full shadow-md border border-zinc-200');

fs.writeFileSync('c:\\Users\\HP\\Documents\\vercel-lucira\\vercel-lucira\\lucira-frontend\\src\\components\\pages\\SophisticatedMetalCalculator.jsx', content, 'utf8');
console.log('Done');
