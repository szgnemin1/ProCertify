const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

c = c.replace(
  `              // Seçilen yolları bir dahaki sefere hatırlamak için serverSettings'e kaydet ve sunucuya gönder
              const newSettings = {
                  ...serverSettings, 
                  lastSavePath: {
    // allowedFolder: serverSaveState.allowedFolder,
                      subFolder: serverSaveState.subFolder
                  }
              };
              setServerSettings(newSettings);
              fetch(getApiUrl('/api/data'), {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                 body: JSON.stringify({ projects, signatures, companies, serverSettings: newSettings })
             }).catch(e => console.warn(e));`,
`              const newSettings = {
                  ...serverSettings,
                  lastSavePath: { targetDir: browsePath } as any
              };
              setServerSettings(newSettings);
              fetch(getApiUrl('/api/data'), {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                 body: JSON.stringify({ projects, signatures, companies, serverSettings: newSettings })
             }).catch(e => console.warn(e));`
);

fs.writeFileSync('App.tsx', c);
