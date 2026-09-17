const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

c = c.replace(
  `const [serverSettings, setServerSettings] = useState<{rootPath: string, allowedFolders: string[], scannedRootFolders?: string[], lastSavePath?: {allowedFolder: string, subFolder: string}}>({ rootPath: 'D:\\\\Arsiv', allowedFolders: [], scannedRootFolders: [] });`,
  `const [serverSettings, setServerSettings] = useState<{rootPath: string, allowedFolders: string[], scannedRootFolders?: string[], lastSavePath?: {targetDir: string}}>({ rootPath: 'D:\\\\Arsiv', allowedFolders: [], scannedRootFolders: [] });`
);

fs.writeFileSync('App.tsx', c);
