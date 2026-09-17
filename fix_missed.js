const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');
const s = `                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase block">İzinli Ana Klasörler</label>
                                <button 
                                    onClick={scanRootFolders}
                                    disabled={isScanningRoots || !serverSettings.rootPath}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2"
                                >
                                    <FolderOpen size={14} />
                                    {isScanningRoots ? 'Taranıyor...' : 'Dizini Tara'}
                                </button>
                            </div>
                            
                            <div className="mt-4 border border-slate-700 rounded-lg p-4 bg-slate-900/50">
                                {availableRootFolders.length === 0 ? (
                                    <div className="text-center text-slate-500 text-sm py-4 space-y-2">
                                        <FolderOpen size={24} className="mx-auto text-slate-600" />
                                        <p>Klasörleri görmek için "Dizini Tara" butonuna tıklayın.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <input 
                                            type="text" 
                                            placeholder="Klasörlerde ara..." 
                                            value={folderSearchTerm}
                                            onChange={e => setFolderSearchTerm(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500 text-sm"
                                        />
                                        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {availableRootFolders
                                                    .filter(f => f.toLowerCase().includes(folderSearchTerm.toLowerCase()) || (serverSettings as any).allowedFolders || [].includes(f))
                                                    .sort((a, b) => {
                                                        const aSel = (serverSettings as any).allowedFolders || [].includes(a);
                                                        const bSel = (serverSettings as any).allowedFolders || [].includes(b);
                                                        if (aSel && !bSel) return -1;
                                                        if (!aSel && bSel) return 1;
                                                        return a.localeCompare(b);
                                      })
                                                    .slice(0, 200) // Render optimization
                                                    .map((folder, idx) => {
                                                    const isSelected = (serverSettings as any).allowedFolders || [].includes(folder);
                                                    return (
                                                        <label key={idx} className={\`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition \${isSelected ? 'bg-indigo-900/30 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}\`}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setServerSettings({...serverSettings, allowedFolders: [...(serverSettings as any).allowedFolders || [], folder]});
                                                                    } else {
                                                                        setServerSettings({...serverSettings, allowedFolders: (serverSettings as any).allowedFolders || [].filter(f => f !== folder)});
                                                                    }
                                                                }}
                                                            />
                                                            <div className={\`w-4 h-4 rounded border flex items-center justify-center transition \${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}\`}>
                                                                {isSelected && <Check size={12} className="text-white" />}
                                                            </div>
                                                            <Folder size={16} className={isSelected ? "text-indigo-400" : "text-slate-400"} />
                                                            <span className={\`text-sm truncate max-w-[150px] \${isSelected ? 'text-indigo-100' : 'text-slate-300'}\`} title={folder}>{folder}</span>
                                                        </label>
                                                    );
                                  })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>`;
c = c.replace(s, ``);
fs.writeFileSync('App.tsx', c);
