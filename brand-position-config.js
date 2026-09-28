/**
 * Brand Position Partners — MVP configuration
 *
 * Shared configuration for the free Brand Position Snapshot and the
 * deeper Brand Position analysis. The existing crawler/scanner remains
 * the evidence collection layer; this file defines the commercial and
 * diagnostic vocabulary for the new product.
 */

const DIMENSIONS = [
  {
    key: 'positioning',
    label: 'Positioning',
    weight: 15,
    description: 'How clearly the brand occupies a distinct position in its market.'
  },
  {
    key: 'proposition',
    label: 'Proposition',
    weight: 13,
    description: 'How clearly the brand communicates the value and outcome it provides.'
  },
  {
    key: 'audience',
    label: 'Audience',
    weight: 10,
    description: 'How clearly the brand communicates who it is for and what matters to them.'
  },
  {
    key: 'differentiation',
    label: 'Differentiation',
    weight: 15,
    description: 'How clearly the brand gives customers a reason to choose it over alternatives.'
  },
  {
    key: 'messaging',
    label: 'Messaging',
    weight: 13,
    description: 'How clearly and consistently the brand communicates its proposition.'
  },
  {
    key: 'identity',
    label: 'Identity',
    weight: 12,
    description: 'How effectively the visual identity reinforces the intended brand position.'
  },
  {
    key: 'trust',
    label: 'Trust',
    weight: 10,
    description: 'How much evidence supports the brand claims and reduces buyer uncertainty.'
  },
  {
    key: 'experience',
    label: 'Experience',
    weight: 12,
    description: 'How consistently the digital experience delivers the promised brand impression.'
  }
];

const SNAPSHOT = {
  reveal: {
    score: true,
    dimensionScores: true,
    strengths: 3,
    gaps: 3,
    opportunity: 1,
    detailedEvidence: false,
    competitorAnalysis: false,
    fullDiagnosis: false,
    strategicPrescription: false,
    proposal: false
  },
  cta: {
    label: 'Book Your 20-Minute Brand Position Review',
    subheading: 'Your snapshot shows where the gaps are. The deeper analysis shows why they exist and what should change.'
  }
};

const DEEP_ANALYSIS = {
  sections: [
    'executive_summary',
    'brand_position_score',
    'current_position',
    'desired_position',
    'positioning_gap',
    'dimension_analysis',
    'competitive_analysis',
    'key_findings',
    'strategic_recommendations',
    'transformation_roadmap',
    'proposal'
  ]
};

const PACKAGES = [
  {
    id: 'foundation',
    name: 'Brand Position Foundation',
    price: 1995,
    deliveryDays: '10–15 working days'
  },
  {
    id: 'transformation',
    name: 'Brand Position Transformation',
    price: 2497,
    deliveryDays: '10–15 working days'
  },
  {
    id: 'authority',
    name: 'Brand Position Authority',
    price: 3495,
    deliveryDays: '10–15 working days'
  }
];

const PROPOSAL = {
  includedInDeepReport: true,
  pricingIsDeterministic: true,
  defaultPackage: 'transformation',
  acceptanceCta: 'Accept Recommended Proposal',
  reviewCta: 'Book a 20-Minute Brand Position Review'
};

module.exports = {
  DIMENSIONS,
  SNAPSHOT,
  DEEP_ANALYSIS,
  PACKAGES,
  PROPOSAL
};
