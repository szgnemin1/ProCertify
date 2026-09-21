const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

const buttonStr1 = `                       <button 
                         onClick={handleOpenServerModal}
                         disabled={isGenerating || isServerSaving || selectedFillProjectIds.length === 0}
                         className={\`w-full py-4 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition active:scale-95 transform \${(isGenerating || isServerSaving) ? 'opacity-70 cursor-wait' : ''}\`}
                       >
                         <Folder size={22} />
                         SUNUCUYA KAYDET
                       </button>`;

const buttonStr2 = `                       <button 
                         onClick={handleOpenServerModal}
                         disabled={isGenerating || isServerSaving || selectedFillProjectIds.length === 0}
                         className={\`w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition active:scale-95 transform \${(isGenerating || isServerSaving) ? 'opacity-70 cursor-wait' : ''}\`}
                       >
                         <Folder size={22} />
                         SUNUCUYA KAYDET
                       </button>`;

c = c.replace(buttonStr1, '');
c = c.replace(buttonStr2, '');
fs.writeFileSync('App.tsx', c);
