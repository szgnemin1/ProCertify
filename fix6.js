const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const s1 = `                                image: certImage
                              })
              })
                        });`;
const r1 = `                                image: certImage
                              })
                        });`;
content = content.replace(s1, r1);
fs.writeFileSync('App.tsx', content);
