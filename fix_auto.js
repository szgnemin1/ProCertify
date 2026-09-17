const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const oldFn = `  const handleOpenServerModal = () => {
      const startPath = serverSettings.lastSavePath?.targetDir || '';
      setBrowsePath(startPath);
      loadBrowseFolders(startPath);
      setNewFolderName('');
      setShowServerSaveModal(true);
  };`;

const newFn = `  const handleOpenServerModal = () => {
      let autoFolder = '';
      for (const key of Object.keys(fillValues)) {
          const val = fillValues[key];
          const matchingSig = signatures.find(s => s.url === val && s.mappedFolder);
          if (matchingSig) {
              autoFolder = matchingSig.mappedFolder;
              break;
          }
      }

      const startPath = autoFolder || serverSettings.lastSavePath?.targetDir || '';
      setBrowsePath(startPath);
      loadBrowseFolders(startPath);
      setNewFolderName('');
      setShowServerSaveModal(true);
  };`;

content = content.replace(oldFn, newFn);
fs.writeFileSync('App.tsx', content);
