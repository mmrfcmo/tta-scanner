/**
 * Evidence-backed Brand Position scoring.
 *
 * Scores are only exposed when supporting evidence meets the configured
 * coverage/confidence thresholds. Limited dimensions remain visible as
 * limited assessments rather than fabricated numbers.
 */

const { DIMENSIONS, calculateBrandPositionScore } = require('./brand-position-scoring');
const { buildEvidenceLedger } = require('./brand-position-evidence');
const { applyEvidenceGate } = require('./brand-position-evidence-gate');

function calculateEvidenceBackedBrandPosition(scan) {
  const raw = calculateBrandPositionScore(scan);
  const ledger = buildEvidenceLedger(scan);
  const gated = applyEvidenceGate(raw.dimensions, ledger);

  const supported = gated.filter(d => d.evidence.status === 'supported');
  const limited = gated.filter(d => d.evidence.status === 'limited');

  const supportedScores = supported.map(d => d.score);
  const finalScore = supported.length === DIMENSIONS.length
    ? raw.score
    : supported.length >= Math.ceil(DIMENSIONS.length * 0.75)
      ? Math.round(supportedScores.reduce((a, b) => a + b, 0) / supportedScores.length)
      : null;

  return {
    score: finalScore,
    grade: finalScore === null ? 'Limited assessment' : raw.grade,
    assessmentStatus: finalScore === null ? 'limited' : limited.length ? 'partial' : 'supported',
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
