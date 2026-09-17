const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');
c = c.replace(`  const [availableRootFolders, setAvailableRootFolders] = useState<string[]>([]);`, ``);
c = c.replace(`  const [isScanningRoots, setIsScanningRoots] = useState(false);`, ``);
fs.writeFileSync('App.tsx', c);
