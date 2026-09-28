/**
 * Brand Position Partners — evidence gate.
 * A dimension is only exposed as a score when its supporting evidence is
 * sufficiently covered. Otherwise the Snapshot reports a limited assessment.
 */

const MIN_COVERAGE = 0.5;
const MIN_CONFIDENCE = 0.6;

function gateDimension(dimension, evidenceLedger = {}) {
  const evidence = evidenceLedger[dimension] || {};
  const coverage = Number(evidence.coverage ?? 0);
  const confidence = Number(evidence.confidence ?? 0);

  if (coverage < MIN_COVERAGE || confidence < MIN_CONFIDENCE) {
    return {
      status: 'limited',
      score: null,
      coverage,
      confidence,
      reason: 'Insufficient evidence for a reliable scored assessment.'
    };
  }

  return {
    status: 'supported',
    score: null,
    coverage,
    confidence,
    reason: 'Evidence threshold met; score may be exposed.'
  };
}

function applyEvidenceGate(dimensions, evidenceLedger = {}) {
  return dimensions.map(dimension => ({
    ...dimension,
    evidence: gateDimension(dimension.key, evidenceLedger)
  }));
}

module.exports = {
  MIN_COVERAGE,
  MIN_CONFIDENCE,
  gateDimension,
  applyEvidenceGate
};
