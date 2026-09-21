const fs = require('fs');
let appCode = fs.readFileSync('App.tsx', 'utf-8');

// Remove Sunucuya Kaydet button 1
appCode = appCode.replace(/<button[^>]*onClick=\{handleOpenServerModal\}[^>]*>\\s*<Folder[^>]*>\\s*SUNUCUYA KAYDET\\s*<\/button>/g, '');

// Wait, the regex might be tricky with newlines. Let's do exact substring replacement.
