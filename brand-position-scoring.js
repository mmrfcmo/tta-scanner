/**
 * Brand Position Partners — deterministic scoring engine.
 * Uses existing TTA scan pillars; no agentic AI required for the free snapshot.
 */

const DIMENSIONS = [
  { key: 'positioning', label: 'Positioning', weight: 15 },
  { key: 'proposition', label: 'Proposition', weight: 13 },
  { key: 'audience', label: 'Audience', weight: 10 },
  { key: 'differentiation', label: 'Differentiation', weight: 15 },
  { key: 'messaging', label: 'Messaging', weight: 13 },
  { key: 'identity', label: 'Identity', weight: 12 },
  { key: 'trust', label: 'Trust', weight: 10 },
  { key: 'experience', label: 'Experience', weight: 12 }
];

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function getPillar(scan, name) {
  return (scan?.pillars || []).find(p => p.name === name)?.percentage || 0;
}

function grade(score) {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Developing';
  if (score >= 40) return 'Weak';
  return 'Critical';
}

function calculateBrandPositionScore(scan) {
  const messaging = getPillar(scan, 'messaging_clarity');
  const identity = getPillar(scan, 'visual_identity');
  const online = getPillar(scan, 'online_presence');
  const proof = getPillar(scan, 'social_proof');
  const trust = getPillar(scan, 'trust_transparency');
  const mission = getPillar(scan, 'mission_vision');
  const values = getPillar(scan, 'core_values');
  const voice = getPillar(scan, 'brand_voice');

  const scores = {
    positioning: clamp(messaging * .55 + mission * .25 + voice * .20),
    proposition: clamp(messaging * .75 + mission * .25),
    audience: clamp(messaging * .60 + values * .15 + voice * .25),
    differentiation: clamp(messaging * .50 + mission * .20 + voice * .30),
    messaging: clamp(messaging * .70 + voice * .30),
    identity: clamp(identity),
    trust: clamp(proof * .55 + trust * .45),
    experience: clamp(online * .55 + messaging * .25 + trust * .20)
  };

  const totalWeight = DIMENSIONS.reduce((sum, d) => sum + d.weight, 0);
  const score = Math.round(
    DIMENSIONS.reduce((sum, d) => sum + scores[d.key] * d.weight, 0) / totalWeight
  );

  const dimensions = DIMENSIONS.map(d => ({
    key: d.key,
    label: d.label,
    score: scores[d.key]
  }));

  return {
    score,
    grade: grade(score),
    dimensions,
    strengths: [...dimensions].sort((a, b) => b.score - a.score).slice(0, 3),
    gaps: [...dimensions].sort((a, b) => a.score - b.score).slice(0, 3)
  };
}

module.exports = { DIMENSIONS, calculateBrandPositionScore };
