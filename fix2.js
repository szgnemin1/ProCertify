const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const s1 = `                                image: pdf.output('datauristring')
                              })
                                  image: pdf.output('datauristring')
                                })
                //              })`;
const r1 = `                                image: pdf.output('datauristring')
                              })`;
content = content.replace(s1, r1);

fs.writeFileSync('App.tsx', content);
