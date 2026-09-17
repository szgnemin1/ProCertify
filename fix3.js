const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

content = content.replace(`//              })()}`, `              })()}`);
content = content.replace(`//              })()}`, `              })()}`);
content = content.replace(`//              })()}`, `              })()}`);

fs.writeFileSync('App.tsx', content);
