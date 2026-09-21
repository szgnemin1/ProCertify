const fs = require('fs');
let c = fs.readFileSync('App.tsx', 'utf-8');
const startMatch = `{showServerSaveModal && (`;
const endMatch = `          </div>
      )}`;

const startIndex = c.indexOf(startMatch);
if (startIndex !== -1) {
    const endIndex = c.indexOf(endMatch, startIndex) + endMatch.length;
    if (endIndex > startIndex) {
        c = c.substring(0, startIndex) + c.substring(endIndex);
        fs.writeFileSync('App.tsx', c);
        console.log("Modal removed");
    }
}
