/**
 * Brand Position Partners — standalone server bootstrap.
 * Keeps BPP routes isolated from the TTA application.
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const bppApi = require('./brand-position-api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', (req, res, next) => {
  res.setHeader('X-BPP-App', 'Brand-Position-Partners');
  next();
}, bppApi);

app.use(express.static(path.join(__dirname, 'public-bpp')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'brand-position-partners' });
});

// Express 5 requires a named wildcard parameter; '*' is not valid here.
app.get('/*splat', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public-bpp', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Brand Position Partners running on port ${PORT}`);
});

module.exports = app;
