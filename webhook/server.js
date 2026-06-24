const express = require('express');
const crypto  = require('crypto');
const { spawn } = require('child_process');

const app       = express();
const SECRET    = process.env.WEBHOOK_SECRET;
const WORKSPACE = '/workspace';

app.use(express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  // 1. Signatur prüfen
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) {
    console.warn(`[${new Date().toISOString()}] Anfrage ohne Signatur abgelehnt.`);
    return res.status(401).send('No signature');
  }

  const expected = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(req.body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    console.warn(`[${new Date().toISOString()}] Ungültige Signatur abgelehnt.`);
    return res.status(401).send('Invalid signature');
  }

  // 2. Nur auf Push-Events reagieren
  const event = req.headers['x-github-event'];
  if (event !== 'push') {
    console.log(`[${new Date().toISOString()}] Event "${event}" ignoriert.`);
    return res.status(200).send('Ignored');
  }

  const payload = JSON.parse(req.body);

  // 3. Nur auf Pushes auf den master-Branch reagieren
  if (payload.ref !== 'refs/heads/master') {
    console.log(`[${new Date().toISOString()}] Push auf "${payload.ref}" ignoriert (nicht master).`);
    return res.status(200).send('Not master');
  }

  const pusher  = payload.pusher?.name ?? 'unbekannt';
  const commits = payload.commits?.length ?? 0;
  console.log(`[${new Date().toISOString()}] Push von ${pusher} (${commits} Commit(s)) — starte Build...`);

  // GitHub sofort antworten, Build läuft asynchron
  res.status(202).send('Build gestartet');

  // 4. build.sh ausführen, stdout/stderr live ins Docker-Log weiterleiten
  const child = spawn('bash', ['build.sh'], {
    cwd: WORKSPACE,
    timeout: 300_000
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(`[BUILD] ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[BUILD ERR] ${data}`);
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`[${new Date().toISOString()}] ✓ Build erfolgreich abgeschlossen.`);
    } else {
      console.error(`[${new Date().toISOString()}] ✗ Build fehlgeschlagen mit Exit-Code ${code}.`);
    }
  });

  child.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] ✗ Fehler beim Starten von build.sh: ${err.message}`);
  });
});

// Health-Check-Endpoint (nützlich für Traefik / Monitoring)
app.get('/webhook', (req, res) => {
  res.status(200).send('Webhook listener läuft.');
});

app.listen(9000, () => {
  console.log(`[${new Date().toISOString()}] Webhook listener gestartet`);

  // Initialer Build beim Container-Start
  console.log(`[${new Date().toISOString()}] Starte initialen Build...`);
  const init = spawn('bash', ['build.sh'], {
    cwd: WORKSPACE,
    timeout: 300_000
  });

  init.stdout.on('data', (data) => process.stdout.write(`[INIT] ${data}`));
  init.stderr.on('data', (data) => process.stderr.write(`[INIT ERR] ${data}`));

  init.on('close', (code) => {
    if (code === 0) {
      console.log(`[${new Date().toISOString()}] ✓ Initialer Build abgeschlossen.`);
    } else {
      console.error(`[${new Date().toISOString()}] ✗ Initialer Build fehlgeschlagen (Exit-Code ${code}).`);
    }
  });

  init.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] ✗ build.sh konnte nicht gestartet werden: ${err.message}`);
  });
});
