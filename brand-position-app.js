/**
 * Brand Position Partners — isolated application orchestration.
 * TTA routes remain untouched; this layer reuses the underlying scanner only.
 */
const { runBrandScan } = require('./scanner');
const { calculateEvidenceBackedBrandPosition } = require('./brand-position-scoring-v2');
const { notifyBrandPositionLead } = require('./brand-position-formspree');

function normaliseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('Website URL is required');
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

async function runBrandPositionSnapshot(website) {
  const url = normaliseUrl(website);
  const scan = await runBrandScan(url);
  const analysis = calculateEvidenceBackedBrandPosition(scan);
  const snapshotId = `BPP-${Date.now()}`;

  return {
    success: true,
    snapshotId,
    website: url,
    brandPosition: analysis,
    cta: { label: 'Book Your 20-Minute Brand Position Review' }
  };
}

async function captureLead({ lead = {}, snapshot = {} }) {
  return notifyBrandPositionLead({
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    website: lead.website || snapshot.website,
    score: snapshot.brandPosition?.score,
    snapshotId: snapshot.snapshotId,
    source: 'brand-position-partners'
  });
}

module.exports = { runBrandPositionSnapshot, captureLead };
