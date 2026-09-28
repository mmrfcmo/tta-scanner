/**
 * Brand Position Partners — Snapshot adapter
 *
 * Converts the existing TTA brand scan into the first Brand Position
 * Snapshot without replacing the proven crawler/scanner.
 *
 * This is intentionally a snapshot, not a deep diagnosis. Detailed
 * evidence, competitor analysis and strategic prescription remain reserved
 * for the Deep Brand Analysis.
 */

const { DIMENSIONS, SNAPSHOT } = require('./brand-position-config');

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function weightedScore(scores) {
  const totalWeight = DIMENSIONS.reduce((sum, d) => sum + d.weight, 0);
  return Math.round(
    DIMENSIONS.reduce((sum, d) => sum + (scores[d.key] || 0) * d.weight, 0) / totalWeight
  );
}

function getPillar(scan, name) {
  return (scan.pillars || []).find((p) => p.name === name) || { percentage: 50, detail: '' };
}

function buildDimensionScores(scan) {
  const messaging = getPillar(scan, 'messaging_clarity').percentage;
  const identity = getPillar(scan, 'visual_identity').percentage;
  const online = getPillar(scan, 'online_presence').percentage;
  const proof = getPillar(scan, 'social_proof').percentage;
  const trust = getPillar(scan, 'trust_transparency').percentage;
  const mission = getPillar(scan, 'mission_vision').percentage;
  const values = getPillar(scan, 'core_values').percentage;
  const voice = getPillar(scan, 'brand_voice').percentage;

  return {
    positioning: clamp((messaging * 0.55) + (mission * 0.25) + (voice * 0.20)),
    proposition: clamp((messaging * 0.75) + (mission * 0.25)),
    audience: clamp((messaging * 0.60) + (values * 0.15) + (voice * 0.25)),
    differentiation: clamp((messaging * 0.50) + (mission * 0.20) + (voice * 0.30)),
    messaging: clamp((messaging * 0.70) + (voice * 0.30)),
    identity: clamp(identity),
    trust: clamp((proof * 0.55) + (trust * 0.45)),
    experience: clamp((online * 0.55) + (messaging * 0.25) + (trust * 0.20))
  };
}

function grade(score) {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Developing';
  if (score >= 40) return 'Weak';
  return 'Critical';
}

function buildSnapshot(scan) {
  const scores = buildDimensionScores(scan);
  const dimensions = DIMENSIONS.map((dimension) => ({
    key: dimension.key,
    label: dimension.label,
    score: scores[dimension.key]
  }));

  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, SNAPSHOT.reveal.strengths);
  const gaps = [...dimensions].sort((a, b) => a.score - b.score).slice(0, SNAPSHOT.reveal.gaps);
  const score = weightedScore(scores);

  const opportunity = gaps[0]
    ? `Your biggest visible opportunity is ${gaps[0].label.toLowerCase()}. The brand communicates its offer, but there is room to make the reason to choose you more distinctive and compelling.`
    : 'Your brand has a strong foundation. The next opportunity is to sharpen differentiation and reinforce consistency across the customer journey.';

  return {
    product: 'Brand Position Snapshot',
    score,
    grade: grade(score),
    dimensions,
    strengths,
    gaps,
    opportunity,
    cta: SNAPSHOT.cta,
    limitations: {
      detailedEvidence: !SNAPSHOT.reveal.detailedEvidence,
      competitorAnalysis: !SNAPSHOT.reveal.competitorAnalysis,
      fullDiagnosis: !SNAPSHOT.reveal.fullDiagnosis,
      strategicPrescription: !SNAPSHOT.reveal.strategicPrescription
    }
  };
}

module.exports = { buildSnapshot, buildDimensionScores, weightedScore };
