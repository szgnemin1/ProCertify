const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

const s = `                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-white"><Folder className="text-indigo-500" /> Sunucu Arşiv Ayarları</h2>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">Sunucu üzerinde dosyaların kaydedileceği ana dizini (klasörü) tanımlayabilirsiniz. Kayıt sırasında bu dizinin alt klasörlerinde dinamik olarak gezinebilirsiniz.</p>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Ana Arşiv Dizini (Sunucu)</label>
                            <input 
                                type="text"
                                value={serverSettings.rootPath}
                                onChange={(e) => setServerSettings({...serverSettings, rootPath: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-mono text-sm"
                                placeholder="Örn: D:\\Arsiv"
                            />
                            <p className="text-[10px] text-slate-500">Tüm dosyalar bu ana dizin altında sizin belirleyeceğiniz veya uygulamanın otomatik önereceği (imzadan) klasörlere kaydedilecektir.</p>
                        </div>

                        <div className="space-y-2">

                            
                        </div>
                    </div>
                </div>`;

c = c.replace(s, '');
fs.writeFileSync('App.tsx', c);
