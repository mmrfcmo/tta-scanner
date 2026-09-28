/**
 * Brand Position Partners — isolated application layer.
 *
 * This module is deliberately separate from the existing TTA application.
 * It provides a small adapter surface for wiring the existing scan engine
 * into the new Brand Position Partners product without changing TTA routes.
 */

const { buildSnapshot } = require('./brand-position-snapshot');
const { notifyBrandPositionLead } = require('./brand-position-formspree');
const { createDeepReportSkeleton } = require('./brand-position-report-schema');

function createSnapshotResult(scan, lead = {}) {
  const snapshot = buildSnapshot(scan);
  const snapshotId = lead.snapshotId || `BPP-${Date.now()}`;

  return {
    ...snapshot,
    snapshotId,
    company: lead.company || '',
    website: lead.website || ''
  };
}

async function submitSnapshotLead({ lead = {}, snapshot } = {}) {
  return notifyBrandPositionLead({
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    website: lead.website,
    score: snapshot && snapshot.score,
    snapshotId: snapshot && snapshot.snapshotId,
    source: lead.source || 'brand-position-snapshot'
  });
}

function createDeepReport({ company, website, snapshot }) {
  return createDeepReportSkeleton({ company, website, snapshot });
}

module.exports = {
  createSnapshotResult,
  submitSnapshotLead,
  createDeepReport
};
