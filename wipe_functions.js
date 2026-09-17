const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');
const s = `  const scanRootFolders = async () => {
      setIsScanningRoots(true);
      try {
          // Önce güncel rootPath değerini sunucuya kaydedelim ki, sunucu en güncel yoldan arama yapsın
          await fetch(getApiUrl('/api/data'), {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('vps_session_token')}\` },
             body: JSON.stringify({ projects, signatures, companies, serverSettings })
          });

          const token = localStorage.getItem('vps_session_token');
          const res = await fetch(getApiUrl(\`/api/server-folders/available-roots\`), {
              headers: { 'Authorization': \`Bearer \${token}\` }
          });
          if (res.ok) {
              const data = await res.json();
              // Tarama sonucunda gelen klasörleri ve önceden seçilmiş olanları birleştir (tekrar etmeden)
              const mergedFolders = Array.from(new Set([...(data.folders || []), ...(serverSettings as any).allowedFolders || []]));
              setAvailableRootFolders(data.folders || []);
              setServerSettings(prev => ({ ...prev, scannedRootFolders: data.folders || [] }));
          } else {
              alert("Sunucuya ulaşılamadı veya dizin bulunamadı.");
          }
      } catch (err) {
          alert("Ağ hatası oluştu.");
      } finally {
          setIsScanningRoots(false);
      }
  };`;
c = c.replace(s, ``);
fs.writeFileSync('App.tsx', c);
