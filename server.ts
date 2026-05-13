import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5555;

// Statik dosyaları sun (build edildikten sonra "dist" klasörü)
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// React Router vb. için her isteği index.html'e yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VPS Sunucusu başarıyla başlatıldı! http://0.0.0.0:${PORT} adresinden erişebilirsiniz.`);
  console.log('Bu sunucunun kapanmaması için "pm2" aracını kullanabilirsiniz.');
});
