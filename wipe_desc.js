const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');
const s = `<p className="text-sm text-slate-400 mb-4">Sunucu üzerinde dosyaların kaydedileceği ana dizini ve içerisine kaydedilebilecek izinli klasörleri (Örn: Eğitim türü veya Eğitmen adı) tanımlayabilirsiniz.</p>`;
const r = `<p className="text-sm text-slate-400 mb-4">Sunucu üzerinde dosyaların kaydedileceği ana dizini (klasörü) tanımlayabilirsiniz. Kayıt sırasında bu dizinin alt klasörlerinde dinamik olarak gezinebilirsiniz.</p>`;
c = c.replace(s, r);
fs.writeFileSync('App.tsx', c);
