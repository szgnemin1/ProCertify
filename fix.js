const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

content = content.replace(
  `body: JSON.stringify({ targetDir: browsePath, filename, fileBase64 }) // newPassword })`, 
  `body: JSON.stringify({ newPassword })`
);

content = content.replace(
  `body: JSON.stringify({ targetDir: browsePath, filename, fileBase64 }) // projects, signatures, companies, serverSettings })`, 
  `body: JSON.stringify({ projects, signatures, companies, serverSettings })`
);

content = content.replace(
  `body: JSON.stringify({ targetDir: browsePath, filename, fileBase64 }) // projects, signatures, companies, serverSettings: newSettings })`, 
  `body: JSON.stringify({ projects, signatures, companies, serverSettings: newSettings })`
);

content = content.replace(
  `body: JSON.stringify({ targetDir: browsePath, filename, fileBase64 }) // password })`, 
  `body: JSON.stringify({ password })`
);

content = content.replace(
`              body: JSON.stringify({ targetDir: browsePath, filename, fileBase64 }) //
                  targetDir: browsePath,
                  newFolderName: newFolderName.trim()
//              })`,
`              body: JSON.stringify({
                  targetDir: browsePath,
                  newFolderName: newFolderName.trim()
              })`
);

fs.writeFileSync('App.tsx', content);
