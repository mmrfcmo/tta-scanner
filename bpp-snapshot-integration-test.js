/**
 * Lightweight integration harness for the BPP Snapshot pipeline.
 * Run with: npm run test:bpp
 */

const { runBrandPositionSnapshot } = require('./brand-position-app');

const website = process.argv[2] || 'https://example.com';

(async () => {
  try {
    const result = await runBrandPositionSnapshot(website);

    const required = [
      result?.success === true,
      typeof result?.snapshotId === 'string',
      typeof result?.website === 'string',
      result?.brandPosition && typeof result.brandPosition === 'object',
      Array.isArray(result?.brandPosition?.dimensions),
      typeof result?.brandPosition?.assessmentStatus === 'string'
    ];

    if (!required.every(Boolean)) {
      throw new Error('BPP Snapshot response contract failed');
    }

    console.log(JSON.stringify({
      ok: true,
      snapshotId: result.snapshotId,
      website: result.website,
      score: result.brandPosition.score,
      assessmentStatus: result.brandPosition.assessmentStatus,
      dimensions: result.brandPosition.dimensions.length
    }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  }
})();
