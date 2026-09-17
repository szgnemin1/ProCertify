const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

// I will just parse lines and fix the exact errors instead of using global sed blindly.
const lines = c.split('\n');

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes("})") && lines[i].includes("1605|")) {
       lines[i] = "";
   }
}

// Write it back
fs.writeFileSync('App.tsx', lines.join('\n'));
