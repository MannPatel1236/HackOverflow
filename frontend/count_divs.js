const fs = require('fs');
const lines = fs.readFileSync('src/pages/FileComplaint.jsx', 'utf8').split(/\r?\n/);
let d = 0;
for (let i = 355; i < lines.length; i++) {
    const l = lines[i];
    const opens = (l.match(/<div|<main|<header|<section|<motion\.div/g) || []).length;
    const selfs = (l.match(/<div[^>]*\/>/g) || []).length;
    const o = opens - selfs;
    const c = (l.match(/<\/div>|<\/main>|<\/header>|<\/section>|<\/motion\.div>/g) || []).length;
    d += o - c;
    if (o || c) console.log((i + 1) + ': d=' + d + ' +' + o + ' -' + c + '  ' + l.trim().substring(0, 90));
}
console.log('Final depth:', d);
