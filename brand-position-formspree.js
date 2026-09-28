/**
 * Brand Position Partners — dedicated Formspree lead notification.
 *
 * IMPORTANT: this is deliberately separate from the existing TTA Trust
 * Snapshot Formspree form. Set BRAND_POSITION_FORMSPREE_ENDPOINT in the
 * deployment environment to the new Brand Position Partners form endpoint.
 */

const ENDPOINT = process.env.BRAND_POSITION_FORMSPREE_ENDPOINT;

async function notifyBrandPositionLead({
  name = '',
  company = '',
  email = '',
  phone = '',
  website = '',
  score = '',
  snapshotId = '',
  source = 'brand-position-snapshot'
} = {}) {
  if (!ENDPOINT) {
    return { sent: false, reason: 'BRAND_POSITION_FORMSPREE_ENDPOINT is not configured' };
  }

  const payload = {
    campaign: 'brand-position-snapshot',
    name,
    company,
    email,
    phone,
    website,
    brand_position_score: score,
    snapshot_id: snapshotId,
    source,
    submitted_at: new Date().toISOString()
  };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Brand Position Formspree notification failed (${response.status}): ${body}`);
  }

  return { sent: true };
}

module.exports = { notifyBrandPositionLead };
