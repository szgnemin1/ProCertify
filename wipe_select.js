const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

c = c.replace(/<select[\s\S]*?<\/select>/g, '');
// Wait, removing ALL selects might be bad if there are other dropdowns. Let's do it safer.

