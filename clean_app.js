const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

// 1. Remove state
c = c.replace(/  const \[serverSettings, setServerSettings\] = useState[^;]+;\n/g, '');

// 2. Remove from data saving
c = c.replace(/if \(data\.serverSettings\) setServerSettings\(data\.serverSettings\);\n/g, '');
c = c.replace(/const dataObj = \{ projects, signatures, companies, serverSettings \};/g, 'const dataObj = { projects, signatures, companies };');
c = c.replace(/serverSettings: data\.serverSettings \|\| serverSettings\n/g, '');
c = c.replace(/body: JSON\.stringify\(\{ projects, signatures, companies, serverSettings \}\)\n/g, 'body: JSON.stringify({ projects, signatures, companies })\n');

// 3. Remove "Klasör Eşleştir" UI from signatures
const sigMatch = `                                    <div className="mt-2 pt-2 border-t border-slate-700">
                                        <label className="text-[10px] text-slate-500 mb-1 block uppercase font-bold">İmza Klasör Eşleştirme</label>
                                        <select 
                                            className="w-full text-[10px] bg-slate-800 text-white border border-slate-600 rounded p-1 outline-none"
                                            value={sig.mappedFolder || ''}
                                            onChange={e => {
                                                const newSigs = signatures.map(s => s.id === sig.id ? {...s, mappedFolder: e.target.value} : s);
                                                setSignatures(newSigs);
                                            }}
                                        >
                                            <option value="">-- Klasör Eşleştir --</option>
                                            {(serverSettings as any).allowedFolders || [].map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                    </div>`;
c = c.replace(sigMatch, '');

// 4. Remove the Sunucu Arşiv Ayarları block entirely
const serverArchMatch = `                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
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
c = c.replace(serverArchMatch, '');

fs.writeFileSync('App.tsx', c);
console.log("Cleanup done.");
