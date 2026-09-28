/** Evidence-backed Brand Position scoring. */

const { DIMENSIONS, calculateBrandPositionScore } = require('./brand-position-scoring');
const { buildEvidenceLedger } = require('./brand-position-evidence');
const { applyEvidenceGate } = require('./brand-position-evidence-gate');

function calculateEvidenceBackedBrandPosition(scan) {
  const raw = calculateBrandPositionScore(scan);
  const rawScores = Object.fromEntries(raw.dimensions.map(d => [d.key, d.score]));
  const ledger = buildEvidenceLedger(scan, rawScores);
  const ledgerByDimension = Object.fromEntries(ledger.map(item => [item.dimension, {
    coverage: item.coverage,
    confidence: item.confidence / 100
  }]));
  const gated = applyEvidenceGate(raw.dimensions, ledgerByDimension);

  const supported = gated.filter(d => d.evidence.status === 'supported');
  const limited = gated.filter(d => d.evidence.status !== 'supported');
  const supportedKeys = new Set(supported.map(d => d.key));

  // Preserve the deterministic weighted score when all dimensions are supported.
  // If most dimensions are supported, calculate a weighted score using only
  // supported dimensions; otherwise withhold the overall score.
  let finalScore = null;
  if (supported.length === DIMENSIONS.length) {
    finalScore = raw.score;
  } else if (supported.length >= Math.ceil(DIMENSIONS.length * 0.75)) {
    const supportedDefs = DIMENSIONS.filter(d => supportedKeys.has(d.key));
    const weightTotal = supportedDefs.reduce((sum, d) => sum + d.weight, 0);
    finalScore = Math.round(
      supportedDefs.reduce((sum, d) => sum + rawScores[d.key] * d.weight, 0) / weightTotal
    );
  }

  return {
    score: finalScore,
    grade: finalScore === null ? 'Limited assessment' : finalScore >= 85 ? 'Strong' : finalScore >= 70 ? 'Good' : finalScore >= 55 ? 'Developing' : finalScore >= 40 ? 'Weak' : 'Critical',
    assessmentStatus: finalScore === null ? 'limited' : limited.length ? 'partial' : 'supported',
    confidence: ledger.length ? Math.round(ledger.reduce((sum, item) => sum + item.confidence, 0) / ledger.length) : 0,
    dimensions: gated.map(d => ({
      ...d,
      score: d.evidence.status === 'supported' ? d.score : null
    })),
    evidenceLedger: ledger,
    evidenceSummary: {
      supportedDimensions: supported.length,
      limitedDimensions: limited.length,
      totalDimensions: gated.length
    }
  };
}

module.exports = { calculateEvidenceBackedBrandPosition };
