/**
 * Brand Position Partners — evidence ledger.
 * Every dimension assessment must be traceable to observable scan evidence.
 */

const DIMENSION_RULES = {
  positioning: ['messaging_clarity', 'mission_vision', 'brand_voice'],
  proposition: ['messaging_clarity', 'mission_vision'],
  audience: ['messaging_clarity', 'core_values', 'brand_voice'],
  differentiation: ['messaging_clarity', 'mission_vision', 'brand_voice'],
  messaging: ['messaging_clarity', 'brand_voice'],
  identity: ['visual_identity'],
  trust: ['social_proof', 'trust_transparency'],
  experience: ['online_presence', 'messaging_clarity', 'trust_transparency']
};

function pillarEvidence(scan, pillarName) {
  const pillar = (scan?.pillars || []).find(p => p.name === pillarName);
  if (!pillar) return null;
  return {
    pillar: pillarName,
    score: Number(pillar.percentage || 0),
    detail: pillar.detail || '',
    status: pillar.status || null
  };
}

function buildEvidenceLedger(scan, dimensionScores = {}) {
  return Object.entries(DIMENSION_RULES).map(([dimension, pillars]) => {
    const evidence = pillars.map(name => pillarEvidence(scan, name)).filter(Boolean);
    const available = evidence.length;
    const expected = pillars.length;
    const coverage = expected ? available / expected : 0;
    const confidence = Math.round(coverage * 100);

    return {
      dimension,
      score: Number(dimensionScores[dimension] || 0),
      confidence,
      coverage,
      evidenceCoverage: `${available}/${expected}`,
      evidence,
      assessmentStatus: confidence >= 80 ? 'supported' : confidence >= 50 ? 'limited' : 'insufficient'
    };
  });
}

function validateLedger(ledger) {
  const invalid = ledger.filter(item => item.assessmentStatus === 'insufficient');
  return {
    valid: invalid.length === 0,
    insufficientDimensions: invalid.map(item => item.dimension),
    overallConfidence: ledger.length
      ? Math.round(ledger.reduce((sum, item) => sum + item.confidence, 0) / ledger.length)
      : 0
  };
}

module.exports = { DIMENSION_RULES, buildEvidenceLedger, validateLedger };
