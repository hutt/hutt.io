const fs   = require('fs');
const path = require('path');
const https = require('https');

const PORTFOLIO_DIR = path.join(__dirname, '../src/portfolio');
const THUMBS_DIR    = path.join(__dirname, '../src/assets/img/thumbs');

// Thumbs-Ordner anlegen falls nicht vorhanden
fs.mkdirSync(THUMBS_DIR, { recursive: true });

// Alle Markdown-Dateien nach "youtube: ID" durchsuchen
const ids = new Set();
fs.readdirSync(PORTFOLIO_DIR)
  .filter(f => f.endsWith('.md'))
  .forEach(f => {
    const content = fs.readFileSync(path.join(PORTFOLIO_DIR, f), 'utf8');
    const match = content.match(/^youtube:\s*(\S+)/m);
    if (match) ids.add(match[1]);
  });

// Nur herunterladen was noch nicht existiert
const downloads = [...ids].filter(id => {
  return !fs.existsSync(path.join(THUMBS_DIR, `${id}.jpg`));
});

if (downloads.length === 0) {
  console.log('[thumbs] Alle Thumbnails aktuell, nichts zu tun.');
  process.exit(0);
}

console.log(`[thumbs] Lade ${downloads.length} Thumbnail(s) herunter…`);

Promise.all(downloads.map(id => new Promise((resolve, reject) => {
  const dest = path.join(THUMBS_DIR, `${id}.jpg`);
  const url  = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const file = fs.createWriteStream(dest);

  https.get(url, res => {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`[thumbs] ✓ ${id}`);
      resolve();
    });
  }).on('error', err => {
    fs.unlink(dest, () => {});
    console.error(`[thumbs] ✗ ${id}: ${err.message}`);
    reject(err);
  });
}))).then(() => {
  console.log('[thumbs] Fertig.');
});
