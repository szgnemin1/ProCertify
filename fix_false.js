const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');
const s = `      if (false) {
          alert("Lütfen bir ana klasör seçin.");
          return;
      }`;
c = c.replace(s, ``);
fs.writeFileSync('App.tsx', c);
