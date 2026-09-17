const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');
const s = `  // When serverSettings loads from API, populate availableRootFolders with cached scanned folders and currently allowed folders
  useEffect(() => {
      const cachedFolders = serverSettings.scannedRootFolders || [];
      const allowed = (serverSettings as any).allowedFolders || [] || [];
      const merged = Array.from(new Set([...cachedFolders, ...allowed]));
      if (merged.length > 0 && availableRootFolders.length === 0) {
          setAvailableRootFolders(merged);
      }
  }, [serverSettings]);`;

c = c.replace(s, ``);
fs.writeFileSync('App.tsx', c);
