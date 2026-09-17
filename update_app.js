const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

c = c.replace(
  `const [serverSettings, setServerSettings] = useState<{rootPath: string, allowedFolders: string[], scannedRootFolders?: string[], lastSavePath?: {targetDir: string}}>({ rootPath: 'D:\\\\Arsiv', allowedFolders: [], scannedRootFolders: [] });`,
  `const [serverSettings, setServerSettings] = useState<{rootPath: string, scannedRootFolders?: string[], lastSavePath?: {targetDir: string}}>({ rootPath: 'D:\\\\Arsiv', scannedRootFolders: [] });`
);

// Delete the entire server settings logic for allowedFolders that exists around line 2540 to 2670
// Since I can't easily parse react JSX with string replacements safely across a huge block, I will replace the allowedFolders mapping.

c = c.replaceAll(`serverSettings.allowedFolders`, `(serverSettings as any).allowedFolders || []`);
fs.writeFileSync('App.tsx', c);
