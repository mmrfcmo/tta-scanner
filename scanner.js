const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');
const PILLARS = [
  { name: 'mission_vision', label: 'Mission & Vision', maxScore: 100, keywords: ['mission', 'vision', 'our purpose', 'why we exist', 'we believe'], checkPages: ['about', 'about-us'], detailPresent: 'Mission and/or vision statement found on your website.', detailMissing: 'No clear mission or vision statement found on your website.' },
  { name: 'core_values', label: 'Core Values', maxScore: 100, keywords: ['our values', 'core values', 'we value', 'our principles', 'what we stand for'], checkPages: ['about', 'about-us'], detailPresent: 'Core values articulated on your website.', detailMissing: 'No core values listed on your site or social profiles.' },
  { name: 'brand_voice', label: 'Brand Voice & Tone', maxScore: 100, keywords: [], checkPages: [], detailPresent: 'Brand voice is reasonably consistent across pages.', detailMissing: 'Tone is inconsistent — mixes formal and casual across pages.' },
  { name: 'visual_identity', label: 'Visual Identity', maxScore: 100, keywords: [], checkPages: [], detailPresent: 'Logo and favicon present. Visual identity is consistent.', detailMissing: 'Logo present but no favicon. Colour usage inconsistent.' },
  { name: 'online_presence', label: 'Online Presence', maxScore: 100, keywords: [], checkPages: [], detailPresent: 'Social profiles and GBP are present and consistent.', detailMissing: 'Missing or incomplete social profiles. GBP needs work.' },
  { name: 'messaging_clarity', label: 'Messaging Clarity', maxScore: 100, keywords: ['tagline', 'elevator pitch', 'value proposition', 'we help'], checkPages: ['', '/'], detailPresent: 'Clear tagline and value proposition found.', detailMissing: 'No clear elevator pitch or tagline found.' },
  { name: 'social_proof', label: 'Social Proof', maxScore: 100, keywords: ['testimonial', 'review', 'trustpilot', 'case study'], checkPages: ['', 'testimonials', 'reviews'], detailPresent: 'Social proof elements found on your website.', detailMissing: 'Zero testimonials or case studies visible on site.' },
  { name: 'trust_transparency', label: 'Trust & Transparency', maxScore: 100, keywords: [], checkPages: ['privacy-policy', 'privacy', 'terms', 'contact'], detailPresent: 'Privacy policy, terms, and contact info are present.', detailMissing: 'Missing privacy policy, terms, or clear contact page.' }
];

function detectCMS(html) {
  const l = html.toLowerCase();
  if (l.includes('wp-content') || l.includes('wp-json') || l.includes('wordpress')) return 'WordPress';
  if (l.includes('wix.com') || l.includes('static.wixstatic.com')) return 'Wix';
  if (l.includes('squarespace.com') || l.includes('static1.squarespace.com')) return 'Squarespace';
  if (l.includes('myshopify.com') || l.includes('shopify')) return 'Shopify';
  if (l.includes('webflow')) return 'Webflow';
  return 'Custom / Other';
}

function checkLogo($) {
  const h = $('header, nav').first();
  if ($('img[alt="logo" i], img[class="logo" i], a[class="logo" i], div[class="logo" i], header img[src="logo"], nav img[src="logo"]').length > 0) return true;
  if (h.find('img').length > 0) return true;
  if ($('.site-title, .site-name, .brand').length > 0) return true;
  return false;
}

function checkFavicon($) { return $('link[rel="icon" i]').length > 0 || $('link[rel="apple-touch-icon" i]').length > 0; }

function findSocialLinks($) {
  const p = ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'tiktok.com'];
  const f = [];
  $('a[href]').each((i, e) => { const h = $(e).attr('href').toLowerCase(); p.forEach(x => { if (h.includes(x) && !f.includes(x)) f.push(x); }); });
  return f;
}

function computeGrade(s) { if (s >= 90) return 'Excellent'; if (s >= 75) return 'Good'; if (s >= 55) return 'Needs Work'; if (s >= 35) return 'Weak'; return 'Poor'; }

const UA = 'Mozilla/5.0 (compatible; TTABrandScanner/1.0; +https://trusttriggeragency.com)';

async function fetchHTML(t) {
  if (!t.startsWith('http')) t = 'https://' + t;
  try { const r = await axios.get(t, { headers: { 'User-Agent': UA }, timeout: 15000, maxRedirects: 5 }); return { html: r.data, $: cheerio.load(r.data), error: null }; }
  catch (e) { return { html: '', $: null, error: 'Failed to fetch ' + t + ': ' + e.message }; }
}

async function fetchAdditionalPages(b, paths) {
  const r = {};
  const p = url.parse(b);
  const d = p.protocol + '//' + p.host;
  for (const q of paths.slice(0, 5)) {
    if (!q) continue;
    try { const resp = await axios.get(d + '/' + q.replace(/^\//, ''), { headers: { 'User-Agent': UA }, timeout: 10000 }); if (resp.status === 200) r[q] = resp.data; } catch (e) {}
  }
  return r;
}

function scanMissionVision($, allText, aboutText) {
  const l = (aboutText || allText).toLowerCase();
  let s = 0;
  const f = [];
  [[30, 'mission'], [20, 'vision'], [15, 'our purpose'], [10, 'we believe'], [10, 'we strive'], [5, 'our goal'], [10, 'committed to']].forEach(([p, k]) => { if (l.includes(k)) { s += p; f.push(k); } });
  return { score: Math.min(s, 100), detail: s >= 80 ? ('Strong mission/vision presence. Found: ' + f.slice(0,3).join(', ') + '.') : s >= 40 ? ('Partial mission/vision content. Found: ' + f.slice(0,2).join(', ') + '.') : 'No clear mission or vision statement found on your website.' };
}

function scanCoreValues(allText) {
  const l = allText.toLowerCase();
  let s = 0;
  const f = [];
  [[30, 'our values'], [30, 'core values'], [20, 'we value'], [20, 'our principles'], [15, 'what we stand for'], [10, 'integrity'], [10, 'excellence'], [10, 'innovation'], [10, 'customer first'], [5, 'teamwork'], [5, 'accountability']].forEach(([p, k]) => { if (l.includes(k)) { s += p; f.push(k); } });
  return { score: Math.min(s, 100), detail: s >= 50 ? ('Core values articulated. Found: ' + f.slice(0,3).join(', ') + '.') : s >= 20 ? 'Some values language present but not clearly defined.' : 'No core values listed on your site or social profiles.' };
}

function scanBrandVoice($) {
  const t = [];
  $('p, h1, h2, h3').each((i, e) => { const x = $(e).text().trim(); if (x.length > 20) t.push(x); });
  if (t.length < 3) return { score: 50, detail: 'Limited text available for tone analysis.' };
  const a = [];
  t.slice(0, 10).forEach(x => { const s = x.split(/[.!?]+/).filter(s => s.trim()); if (s.length) a.push(s.reduce((s, y) => s + y.trim().length, 0) / s.length); });
  if (a.length < 2) return { score: 50, detail: 'Limited text available for tone analysis.' };
  const v = Math.max(...a) - Math.min(...a);
  return v < 30 ? { score: 80, detail: 'Brand voice appears consistent across sampled pages.' } : v < 70 ? { score: 60, detail: 'Tone is reasonably consistent but could be tighter.' } : { score: 45, detail: 'Tone varies significantly across pages — a style guide would help.' };
}

function scanVisualIdentity($) {
  let s = 0;
  if (checkLogo($)) s += 50;
  if (checkFavicon($)) s += 30;
  if ($('meta[name="theme-color"]').length > 0) s += 20;
  return { score: s, detail: s >= 80 ? 'Logo, favicon, and brand colours present and consistent.' : s >= 50 ? 'Logo present but no favicon. Brand colour usage could be more consistent.' : 'No logo or favicon detected. Visual identity needs development.' };
}

function scanOnlinePresence($) {
  const social = findSocialLinks($);
  let s = social.length * 15;
  if (s > 90) s = 90;
  if ($.html().toLowerCase().includes('google.com') || $.html().toLowerCase().includes('maps.app.goo')) s += 10;
  return { score: Math.min(s, 100), detail: s >= 60 ? ('Active on multiple platforms (' + social.slice(0,3).join(', ') + '). GBP presence detected.') : s >= 20 ? 'Some social links found but presence is limited.' : 'Missing or incomplete social profiles. GBP needs work.' };
}

function scanMessagingClarity($) {
  let s = 0;
  const t = $('title').text().toLowerCase();
  if (t.length > 10 && t.includes('|')) s += 20;
  if ($('.tagline, .subtitle, .hero-subtitle, .site-description').length > 0) s += 40;
  const h = $('[class="hero"], [class="banner"], section:first-of-type').text().toLowerCase();
  if (h.length > 0) { if (/we help|we are|specialise|experts in|trusted/.test(h)) s += 30; if (h.length > 50) s += 10; }
  return { score: s, detail: s >= 70 ? 'Clear tagline and value proposition found on your website.' : s >= 30 ? 'Value proposition exists but could be more prominent.' : 'No clear elevator pitch or tagline found.' };
}

function scanSocialProof($, allText) {
  let s = 0;
  const l = allText.toLowerCase();
  if ($('[class="testimonial"], [class="review"], [id*="testimonial"]').length > 0) s += 40;
  if (l.includes('trustpilot')) s += 20;
  if (l.includes('google reviews') || l.includes('google review')) s += 15;
  if (l.includes('case study') || l.includes('case studies')) s += 15;
  if (/rating|★/.test(l)) s += 10;
  return { score: Math.min(s, 100), detail: s >= 60 ? 'Social proof elements (testimonials/reviews) found on your website.' : s >= 20 ? 'Some social proof elements found but could be more prominent.' : 'Zero testimonials or case studies visible on site.' };
}

function scanTrustTransparency($, allText) {
  let s = 20;
  const l = allText.toLowerCase();
  if (l.includes('privacy') && (l.includes('policy') || l.includes('notice'))) s += 25;
  if (l.includes('terms') && (l.includes('conditions') || l.includes('service') || l.includes('use'))) s += 20;
  if ($('[class="contact"], [id="contact"]').length > 0) s += 15;
  if (/\+\d[\d\s\-\(\)]{7,}/.test($.text())) s += 10;
  if ($('a[href^="mailto:"]').length > 0) s += 10;
  return { score: Math.min(s, 100), detail: s >= 70 ? 'Privacy policy, terms, and contact info are present.' : s >= 40 ? 'Some trust/transparency elements present but incomplete.' : 'Missing privacy policy, terms, or clear contact page.' };
}

async function runBrandScan(websiteUrl) {
  const { html, $, error } = await fetchHTML(websiteUrl);
  if (error) return { error };
  const cms = detectCMS(html);
  const additionalPages = await fetchAdditionalPages(websiteUrl, ['about', 'about-us', 'contact', 'privacy-policy', 'terms', 'testimonials']);
  const allText = html + ' ' + Object.values(additionalPages).join(' ');
  const aboutText = additionalPages['about'] || additionalPages['about-us'] || '';
  const results = {};
  const gaps = [];
  results.mission_vision = scanMissionVision($, allText, aboutText);
  results.core_values = scanCoreValues(allText);
  results.brand_voice = scanBrandVoice($);
  results.visual_identity = scanVisualIdentity($);
  results.online_presence = scanOnlinePresence($);
  results.messaging_clarity = scanMessagingClarity($);
  results.social_proof = scanSocialProof($, allText);
  results.trust_transparency = scanTrustTransparency($, allText);
  const pillars = [];
  PILLARS.forEach(p => {
    const r = results[p.name];
    const pct = Math.round((r.score / p.maxScore) * 100);
    pillars.push({ name: p.name, label: p.label, score: r.score, maxScore: p.maxScore, percentage: pct, detail: r.detail });
    if (r.score < 50) gaps.push({ title: p.label, detail: r.detail, severity: r.score < 25 ? 'high' : 'medium' });
  });
  const overallScore = Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length);
  return { cms, brandScore: overallScore, grade: computeGrade(overallScore), pillars, gaps, gapsCount: gaps.length, error: '' };
}

module.exports = { runBrandScan, detectCMS, computeGrade };
