const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');

// Remove scanRootFolders
c = c.replace(/  const scanRootFolders = async \(\) => \{[\s\S]*?  \};\n/g, '');

// The mappedFolder UI block
const regexSig = /<div className="mt-2 pt-2 border-t border-slate-700">[\s\S]*?<\/div>/g;
// I will just use a specific replace for the server settings mapping
c = c.replace(/<div className="mt-2 pt-2 border-t border-slate-700">\s*<label className="text-\[10px\] text-slate-500 mb-1 block uppercase font-bold">İmza Klasör Eşleştirme<\/label>\s*<select[\s\S]*?<\/select>\s*<\/div>/g, '');

// The Sunucu Arşiv Ayarları block
c = c.replace(/<div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">\s*<div className="flex justify-between items-center mb-6">\s*<h2 className="text-xl font-semibold flex items-center gap-2 text-white"><Folder className="text-indigo-500" \/> Sunucu Arşiv Ayarları<\/h2>[\s\S]*?<\/div>\s*<\/div>/g, '');

fs.writeFileSync('App.tsx', c);
console.log("Fixed app");
