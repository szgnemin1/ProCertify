const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

const s = `                                                    return (
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
                                            </div>`;

c = c.replace(s, `                                                    return (
                                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800 border border-slate-700">
                                                            <Folder size={16} className="text-slate-400" />
                                                            <span className="text-sm truncate max-w-[150px] text-slate-300" title={folder}>{folder}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>`);

const s2 = `                            {(serverSettings as any).allowedFolders || [].length > 0 && (
                                <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-xs text-indigo-200">
                                    Seçilen klasör sayısı: <span className="text-indigo-400 font-bold">{(serverSettings as any).allowedFolders || [].length}</span>
                                </div>
                            )}
`;
c = c.replace(s2, ``);

fs.writeFileSync('App.tsx', c);
