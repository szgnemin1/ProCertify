const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');
const s = `                              })
              })
                        });`;
const r = `                              })
                        });`;
content = content.replace(s, r);
fs.writeFileSync('App.tsx', content);
