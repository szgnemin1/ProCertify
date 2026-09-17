const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');
const search = `
          const res = await fetch(getApiUrl('/api/server-folders/save-file'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
              body: JSON.stringify({ targetDir: browsePath, filename, fileBase64 }) //
// allowedFolder: serverSaveState.allowedFolder,
                  subFolder: serverSaveState.subFolder,
                  filename,
                  fileBase64
//              })
          });
`;
const replace = `
          const res = await fetch(getApiUrl('/api/server-folders/save-file'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
              body: JSON.stringify({ targetDir: browsePath, filename, fileBase64 })
          });
`;
content = content.replace(search.trim(), replace.trim());
fs.writeFileSync('App.tsx', content);
