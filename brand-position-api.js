const express = require('express');
const { runBrandScan } = require('./scanner');
const { calculateBrandPositionScore } = require('./brand-position-scoring');
const { notifyBrandPositionLead } = require('./brand-position-formspree');

const router = express.Router();

function normaliseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('Website URL is required');
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

router.post('/api/brand-position/scan', async (req, res) => {
  try {
    const website = normaliseUrl(req.body?.website);
    const scan = await runBrandScan(website);
    const brandPosition = calculateBrandPositionScore(scan);
    const snapshotId = `BPP-${Date.now()}`;

    res.json({
      success: true,
      snapshotId,
      website,
      brandPosition,
      opportunity: brandPosition.gaps[0]
        ? `Your biggest visible opportunity is ${brandPosition.gaps[0].label.toLowerCase()}.`
        : 'Your brand has a strong foundation with opportunities to sharpen its market position.',
      cta: {
        label: 'Book Your 20-Minute Brand Position Review'
      }
    });
  } catch (error) {
    console.error('BPP scan error:', error);
    res.status(400).json({ success: false, error: error.message || 'Unable to complete the Brand Position Snapshot' });
  }
});

router.post('/api/brand-position/lead', async (req, res) => {
  try {
    const { lead = {}, snapshot = {} } = req.body || {};
    const result = await notifyBrandPositionLead({
      ...lead,
      score: snapshot.score,
      snapshotId: snapshot.snapshotId,
      source: 'brand-position-partners'
    });
    res.json({ success: true, notification: result });
  } catch (error) {
    console.error('BPP lead notification error:', error);
    res.status(502).json({ success: false, error: 'Lead notification could not be sent' });
  }
});

module.exports = router;
