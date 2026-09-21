const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

const regex = /<select\s+className="w-full text-\[10px\] bg-slate-800 text-white border border-slate-600 rounded p-1 outline-none"[\s\S]*?<\/select>/g;
c = c.replace(regex, '');

fs.writeFileSync('App.tsx', c);
