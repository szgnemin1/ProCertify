const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf-8');
const lines = c.split('\n');
console.log(lines.slice(20, 35).join('\n'));
