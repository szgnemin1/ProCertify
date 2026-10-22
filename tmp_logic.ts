
  const loadBrowseFolders = async (path: string) => {
      setIsBrowsing(true);
      try {
          const token = localStorage.getItem('vps_session_token');
          const res = await fetch(getApiUrl(`/api/server-folders/browse?dir=${encodeURIComponent(path)}`), {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setBrowseFolders(data.folders || []);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsBrowsing(false);
      }
  };

  const createServerSubfolder = async () => {
      if (!newFolderName.trim()) return;
      try {
          const token = localStorage.getItem('vps_session_token');
          const res = await fetch(getApiUrl('/api/server-folders/create'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                  targetDir: browsePath,
                  newFolderName: newFolderName.trim()
              })
          });
          if (res.ok) {
              const data = await res.json();
              setBrowseFolders([...browseFolders, data.folderName]);
              setBrowsePath(browsePath ? `${browsePath}/${data.folderName}` : data.folderName);
              loadBrowseFolders(browsePath ? `${browsePath}/${data.folderName}` : data.folderName);
              setNewFolderName('');
          } else {
              const err = await res.json();
              alert("Klasör oluşturulamadı: " + err.error);
          }
      } catch (err) {
          alert("Ağ hatası.");
      }
  };

  const handleOpenServerModal = () => {
      const startPath = serverSettings.lastSavePath?.targetDir || '';
      setBrowsePath(startPath);
      loadBrowseFolders(startPath);
      setNewFolderName('');
      setShowServerSaveModal(true);
  };
