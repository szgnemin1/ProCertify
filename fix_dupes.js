const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

// I duplicated lines with sed -i p, I need to clean them up.
let lines = c.split('\n');
let newLines = [];
for (let i = 0; i < lines.length; i++) {
    if (i > 0 && lines[i] === lines[i-1]) {
       // Skip duplicate line
       continue;
    }
    newLines.push(lines[i]);
}
fs.writeFileSync('App.tsx', newLines.join('\n'));
