const express = require('express');
const { runBrandPositionSnapshot, captureLead } = require('./brand-position-app');

const router = express.Router();

router.post('/scan', async (req, res) => {
  try {
    const result = await runBrandPositionSnapshot(req.body?.website);
    res.json(result);
  } catch (error) {
    console.error('BPP scan error:', error);
    res.status(400).json({ success: false, error: error.message || 'Unable to complete the Brand Position Snapshot' });
  }
});

router.post('/lead', async (req, res) => {
  try {
    const result = await captureLead(req.body || {});
    res.json({ success: true, notification: result });
  } catch (error) {
    console.error('BPP lead notification error:', error);
    res.status(502).json({ success: false, error: 'Lead notification could not be sent' });
  }
});

module.exports = router;
