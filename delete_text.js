const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');
const s = `                            {(serverSettings as any).allowedFolders.length > 0 && (
                                <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-xs text-indigo-200">
                                    Seçilen klasör sayısı: <span className="text-indigo-400 font-bold">{(serverSettings as any).allowedFolders || [].length}</span>
                                </div>
                            )}`;
c = c.replace(s, ``);
fs.writeFileSync('App.tsx', c);
