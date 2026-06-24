const express = require('express');
const crypto  = require('crypto');
const { exec } = require('child_process');

const app    = express();
const SECRET = process.env.WEBHOOK_SECRET;
const WORKSPACE = '/workspace';

app.use(express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  // 1. Signatur prüfen
  const sig = req.headers['x-hub-signature-256'];
  if (!sig) return res.status(401).send('No signature');

  const expected = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(req.body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Nur auf Push-Events reagieren
  const event = req.headers['x-github-event'];
  if (event !== 'push') return res.status(200).send('Ignored');

  const payload = JSON.parse(req.body);
  // Nur auf Pushes auf den main-Branch reagieren
  if (payload.ref !== 'refs/heads/main') return res.status(200).send('Not main');

  console.log(`[${new Date().toISOString()}] Push auf main erkannt, starte Build...`);
  res.status(202).send('Build gestartet');

  // 3. Build-Script ausführen
  const cmd = `cd ${WORKSPACE} && bash build.sh 2>&1`;
  exec(cmd, { timeout: 300_000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('[BUILD FAILED]', stderr || err.message);
    } else {
      console.log('[BUILD OK]', stdout);
    }
  });
});

app.listen(9000, () => console.log('Webhook listener läuft auf :9000'));
