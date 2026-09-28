/**
 * Brand Position Partners — Deep Report schema
 *
 * The deep report is designed to become both the strategic diagnosis and
 * the proposal. The scanner/evidence layer can populate this progressively.
 */

const { PROPOSAL, PACKAGES } = require('./brand-position-config');

function createDeepReportSkeleton({ company = '', website = '', snapshot = null } = {}) {
  return {
    product: 'Brand Position Intelligence Report',
    company,
    website,
    executiveSummary: null,
    brandPositionScore: snapshot ? snapshot.score : null,
    currentPosition: null,
    desiredPosition: null,
    positioningGap: null,
    dimensionAnalysis: [],
    competitiveAnalysis: [],
    keyFindings: [],
    strategicRecommendations: [],
    transformationRoadmap: [],
    proposal: {
      enabled: PROPOSAL.includedInDeepReport,
      recommendedPackage: PROPOSAL.defaultPackage,
      packageOptions: PACKAGES,
      scope: [],
      deliverables: [],
      investment: null,
      delivery: '10–15 working days',
      terms: [],
      acceptanceCta: PROPOSAL.acceptanceCta,
      reviewCta: PROPOSAL.reviewCta,
      status: 'draft'
    }
  };
}

module.exports = { createDeepReportSkeleton };
