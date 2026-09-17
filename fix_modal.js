const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const modalStart = `      {/* SERVER SAVE MODAL */}`;
const modalEnd = `                  </div>
              </div>
          </div>
      )}`;

const oldModal = content.substring(
    content.indexOf(modalStart),
    content.indexOf(modalEnd) + modalEnd.length
);

const newModal = `      {/* SERVER SAVE MODAL */}
      {showServerSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative">
                  <button onClick={() => setShowServerSaveModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900 p-1 rounded-md"><X size={20}/></button>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4"><Folder size={24} className="text-indigo-500"/> Sunucuya Kaydet</h2>
                  
                  <div className="space-y-4">
                      {/* BREADCRUMB */}
                      <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg flex items-center gap-2 text-sm text-slate-300 overflow-x-auto whitespace-nowrap hide-scrollbar">
                          <button 
                             onClick={() => { setBrowsePath(''); loadBrowseFolders(''); }}
                             className="hover:text-indigo-400 font-medium"
                          >
                              Ana Dizin
                          </button>
                          {browsePath.split('/').filter(Boolean).map((part, i, arr) => {
                              const pathSoFar = arr.slice(0, i + 1).join('/');
                              return (
                                  <div key={i} className="flex items-center gap-2">
                                      <span className="text-slate-600">/</span>
                                      <button 
                                          onClick={() => { setBrowsePath(pathSoFar); loadBrowseFolders(pathSoFar); }}
                                          className="hover:text-indigo-400 font-medium"
                                      >
                                          {part}
                                      </button>
                                  </div>
                              );
                          })}
                      </div>

                      {/* BROWSER VIEW */}
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 h-48 overflow-y-auto">
                          {isBrowsing ? (
                              <div className="flex justify-center items-center h-full text-slate-500">Yükleniyor...</div>
                          ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {browsePath && (
                                      <button 
                                         onClick={() => {
                                            const parts = browsePath.split('/');
                                            parts.pop();
                                            const parent = parts.join('/');
                                            setBrowsePath(parent);
                                            loadBrowseFolders(parent);
                                         }}
                                         className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 text-slate-400 text-sm text-left"
                                      >
                                          <div className="text-indigo-400">..</div> (Üst Klasör)
                                      </button>
                                  )}
                                  {browseFolders.map(f => (
                                      <button 
                                         key={f}
                                         onClick={() => {
                                            const newPath = browsePath ? \`\${browsePath}/\${f}\` : f;
                                            setBrowsePath(newPath);
                                            loadBrowseFolders(newPath);
                                         }}
                                         className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 text-slate-300 text-sm text-left border border-transparent hover:border-slate-700 truncate"
                                      >
                                          <Folder size={16} className="text-indigo-400 shrink-0" />
                                          <span className="truncate">{f}</span>
                                      </button>
                                  ))}
                                  {browseFolders.length === 0 && !browsePath && (
                                      <div className="col-span-full text-center text-slate-500 text-sm py-4">Ana dizin boş. Yeni klasör oluşturun.</div>
                                  )}
                                  {browseFolders.length === 0 && browsePath && (
                                      <div className="col-span-full text-center text-slate-500 text-sm py-4">Bu klasör boş.</div>
                                  )}
                              </div>
                          )}
                      </div>

                      {/* CREATE NEW FOLDER */}
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              placeholder="Buraya yeni klasör oluştur..." 
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-indigo-500"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && createServerSubfolder()}
                          />
                          <button 
                              onClick={createServerSubfolder}
                              disabled={!newFolderName.trim()}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                          >
                              Klasör Oluştur
                          </button>
                      </div>

                      <hr className="border-slate-700" />
                      <button 
                          onClick={exportToServer}
                          disabled={isServerSaving}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                          {isServerSaving ? 'Kaydediliyor...' : \`Şu anki konuma KAYDET (\${browsePath || 'Ana Dizin'})\`}
                      </button>
                  </div>
              </div>
          </div>
      )}`;

content = content.replace(oldModal, newModal);
fs.writeFileSync('App.tsx', content);
