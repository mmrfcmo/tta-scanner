const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const scanner = require('./scanner');
const app = express();
const PORT = process.env.PORT || 3000;
const reports = {};
const brandReports = {};

app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

const axios = require('axios');
const cheerio = require('cheerio');
const UA = 'Mozilla/5.0 (compatible; TrustTriggerScanner/1.0)';

async function runTrustScan(websiteUrl) {
  if (!websiteUrl.startsWith('http')) websiteUrl = 'https://' + websiteUrl;
  let html, $;
  try {
    const resp = await axios.get(websiteUrl, { headers: { 'User-Agent': UA }, timeout: 15000, maxRedirects: 5 });
    html = resp.data;
    $ = cheerio.load(html);
  } catch (err) {
    return { error: 'Could not fetch website: ' + err.message };
  }
  const lower = html.toLowerCase();
  const pillars = { online_presence: { score: 0, max: 25 }, reputation: { score: 0, max: 30 }, engagement: { score: 0, max: 20 }, transparency: { score: 0, max: 15 }, technical: { score: 0, max: 10 } };
  if ($('header').length > 0 || $('nav').length > 0) pillars.online_presence.score += 10;
  if ($('meta[name="description"]').length > 0) pillars.online_presence.score += 10;
  if ($('a[href="facebook"],a[href="twitter"],a[href="instagram"],a[href="linkedin"]').length > 0) pillars.online_presence.score += 5;
  if ($('[class="testimonial"], [class="review"], [id*="testimonial"]').length > 0) pillars.reputation.score += 15;
  if (lower.includes('trustpilot') || lower.includes('google reviews') || lower.includes('review')) pillars.reputation.score += 10;
  if ($('[class="rating"], [class="stars"]').length > 0 || /★|\bstar\b/.test(lower)) pillars.reputation.score += 5;
  const heroText = $('h1, .hero, .banner, section:first-of-type').text().toLowerCase();
  if (/book now|get a quote|contact us|sign up|get started|call now/.test(heroText)) pillars.engagement.score += 15;
  if ($('a[href="tel:"]').length > 0 || $('a[href="mailto:"]').length > 0) pillars.engagement.score += 5;
  if ($('[class="about"], [id="about"]').length > 0 || lower.includes('about us') || lower.includes('our story')) pillars.transparency.score += 8;
  if (lower.includes('privacy') && (lower.includes('policy') || lower.includes('notice'))) pillars.transparency.score += 5;
  if ($('img[alt="team"], img[alt="founder"], img[alt*="owner"]').length > 0) pillars.transparency.score += 2;
  if (lower.includes('https://') || $('link[rel="canonical"]').length > 0) pillars.technical.score += 5;
  if ($('meta[name="viewport"]').length > 0) pillars.technical.score += 3;
  if ($('link[rel="icon"], link[rel*="icon"]').length > 0) pillars.technical.score += 2;

  const standards = [
    { name: 'HTTPS', passed: !!lower.match(/https:\/\//) },
    { name: 'Contact Page', passed: !!($('[class="contact"], [id="contact"]').length > 0 || lower.includes('contact us')) },
    { name: 'About Page', passed: !!($('[class="about"], [id="about"]').length > 0 || lower.includes('about us')) },
    { name: 'CTA', passed: !!(/book now|get a quote|contact us|sign up|get started/i.test(heroText)) },
    { name: 'Testimonials', passed: !!($('[class*="testimonial"]').length > 0 || lower.includes('testimonials')) },
    { name: 'FAQ', passed: !!(lower.includes('faq') || lower.includes('frequently asked')) },
    { name: 'Service Pages', passed: !!(lower.includes('services') || lower.includes('what we do')) },
    { name: 'Privacy Policy', passed: !!(lower.includes('privacy policy') || lower.includes('privacy notice')) },
    { name: 'Mobile Responsive', passed: !!($('meta[name="viewport"]').length > 0) }
  ];

  const issues = [];
  const issueMap = { 'Contact Page': 'Add a Contact Page', 'About Page': 'Add an About Page', 'CTA': 'Add Clear Calls-to-Action', 'Testimonials': 'Collect and Display Reviews', 'FAQ': 'Add an FAQ Section', 'Service Pages': 'Detail Your Services', 'Privacy Policy': 'Add a Privacy Policy' };
  standards.forEach(s => { if (!s.passed && issueMap[s.name]) issues.push({ title: issueMap[s.name], detail: 'Your website is missing a ' + s.name.toLowerCase() + '.' }); });

  const totalScore = Math.round((pillars.online_presence.score / pillars.online_presence.max  25) + (pillars.reputation.score / pillars.reputation.max  30) + (pillars.engagement.score / pillars.engagement.max  20) + (pillars.transparency.score / pillars.transparency.max  15) + (pillars.technical.score / pillars.technical.max * 10));
  const grade = totalScore >= 75 ? 'good' : totalScore >= 50 ? 'fair' : totalScore >= 25 ? 'poor' : 'critical';
  const passed = standards.filter(s => s.passed).length;

  return { score: totalScore, grade, issues_found: issues.length, standards_passed: passed, standards_total: standards.length, pillars: [
    { name: 'online_presence', label: 'Online Presence', score: pillars.online_presence.score, max_score: pillars.online_presence.max, percentage: Math.round(pillars.online_presence.score / pillars.online_presence.max * 100) },
    { name: 'reputation', label: 'Reputation', score: pillars.reputation.score, max_score: pillars.reputation.max, percentage: Math.round(pillars.reputation.score / pillars.reputation.max * 100) },
    { name: 'engagement', label: 'Engagement', score: pillars.engagement.score, max_score: pillars.engagement.max, percentage: Math.round(pillars.engagement.score / pillars.engagement.max * 100) },
    { name: 'transparency', label: 'Transparency', score: pillars.transparency.score, max_score: pillars.transparency.max, percentage: Math.round(pillars.transparency.score / pillars.transparency.max * 100) },
    { name: 'technical', label: 'Technical Health', score: pillars.technical.score, max_score: pillars.technical.max, percentage: Math.round(pillars.technical.score / pillars.technical.max * 100) }
  ], standards, issues, error: '' };
}

app.get('/', (req, res) => {
  res.type('html').send('<!DOCTYPE html><html lang="en" class="scroll-smooth"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deep Report — Trust Trigger Agency</title><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Crect width=\'32\' height=\'32\' rx=\'6\' fill=\'%23f59e0b\'/%3E%3Ctext x=\'16\' y=\'22\' font-family=\'Arial\' font-size=\'14\' font-weight=\'900\' fill=\'white\' text-anchor=\'middle\'%3ET%3C/text%3E%3C/svg%3E"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"><script src="https://cdn.tailwindcss.com"></script><style>html,body{font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#0f172a;color:#e2e8f0}.reveal{opacity:0;transform:translateY(20px);transition:opacity .6s ease-out,transform .6s ease-out}.reveal.in-view{opacity:1;transform:none}.gradient-card{background:linear-gradient(135deg,#1e293b,#0f172a)}.gradient-hero{background:linear-gradient(135deg,#0f172a 0%,#1a2a4a 50%,#78350f 100%)}.pulse-glow{animation:pulseGlow 2s ease-in-out infinite}@keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(245,158,11,.3)}50%{box-shadow:0 0 40px rgba(245,158,11,.6)}}</style></head><body><nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800"><div class="max-w-6xl mx-auto px-6 flex items-center justify-between h-20"><a href="/" class="flex items-center gap-2 text-white no-underline"><span class="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-extrabold">TTA</span><div><div class="font-bold text-xl tracking-tight leading-tight text-amber-400">Trust Trigger Agency</div><div class="text-xs font-semibold tracking-wider text-white">Measure. Transform. Prove. Maintain.</div></div></a><a href="https://trust-trigger-api.onrender.com/home" class="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-400">← Back</a></div></nav><section class="relative pt-32 sm:pt-40 pb-20 sm:pb-28 overflow-hidden gradient-hero"><div class="absolute inset-0 opacity-10"><div class="absolute top-20 left-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div><div class="absolute bottom-10 right-10 w-96 h-96 bg-amber-300 rounded-full blur-3xl"></div></div><div class="relative max-w-6xl mx-auto px-6"><div class="max-w-2xl mx-auto text-center"><div class="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">Deep Report</div><h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">Enter your website address to get a deep, thorough report</h1><div class="mt-10 max-w-lg mx-auto"><div class="gradient-card rounded-2xl border border-slate-800 p-6 sm:p-8"><div class="mb-4"><label class="block text-xs font-semibold text-slate-400 mb-1">Website URL</label><div class="flex"><span class="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-700 bg-slate-950 text-slate-400 text-sm font-mono">https://</span><input id="siteInput" type="text" required class="w-full rounded-r-xl border border-slate-700 bg-slate-950 text-white px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500" placeholder="yourbusiness.com"></div></div><button onclick="runScan()" id="scanBtn" class="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-400 transition pulse-glow">Generate Deep Report →</button><div id="loading" class="hidden mt-4 text-center"><div class="spinner mx-auto mb-2"></div><p class="text-sm text-slate-300">Generating report...</p></div><div id="result" class="hidden mt-4 text-center"><p class="text-emerald-400 text-sm font-semibold mb-2">Report generated!</p><a id="reportLink" href="#" target="_blank" class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-500">Open Report →</a></div><div id="error" class="hidden mt-4 text-center"><p class="text-red-400 text-sm font-semibold mb-1">Error</p><p id="errorMsg" class="text-xs text-slate-400"></p></div></div></div></div></div></section><footer class="bg-slate-950 border-t border-slate-800 py-10 px-6"><div class="max-w-6xl mx-auto"><div class="flex flex-col md:flex-row items-center justify-between gap-6"><div class="flex items-center gap-2"><span class="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-extrabold">TTA</span><div><div class="font-bold text-lg tracking-tight text-amber-400">Trust Trigger Agency</div><div class="text-xs text-slate-500">Measure. Transform. Prove. Maintain.</div></div></div><div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-slate-400"><span>📞 +44 208 591 1163</span><span>📞 +44 7956 393270</span><span>✉️ info@trusttriggeragency.com</span><span>📍 London, UK</span></div><div class="text-xs text-slate-500 text-center">We help businesses earn and maintain trust online.</div></div><div class="border-t border-slate-800 mt-6 pt-4 text-center"><p class="text-xs text-slate-500">© 2025 Trust Trigger Agency. All rights reserved.</p></div></div></footer><style>.spinner{border:3px solid #334155;border-top:3px solid #f59e0b;border-radius:50%;width:28px;height:28px;animation:spin .8s linear infinite}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style><script>function runScan(){var s=document.getElementById(\'siteInput\').value.trim();if(!s){alert(\'Please enter a website address.\');return;}var url=\'https://\'+s;document.getElementById(\'scanBtn\').disabled=true;document.getElementById(\'loading\').classList.remove(\'hidden\');document.getElementById(\'result\').classList.add(\'hidden\');document.getElementById(\'error\').classList.add(\'hidden\');var x=new XMLHttpRequest();x.open(\'POST\',\'/api/scan\',true);x.setRequestHeader(\'Content-Type\',\'application/json\');x.timeout=30000;x.onload=function(){document.getElementById(\'loading\').classList.add(\'hidden\');document.getElementById(\'scanBtn\').disabled=false;if(x.status==200){var d=JSON.parse(x.responseText);document.getElementById(\'reportLink\').href=\'/report/\'+d.id;document.getElementById(\'result\').classList.remove(\'hidden\');}else{document.getElementById(\'errorMsg\').textContent=\'Server error: \'+x.status;document.getElementById(\'error\').classList.remove(\'hidden\');}};x.onerror=function(){document.getElementById(\'loading\').classList.add(\'hidden\');document.getElementById(\'scanBtn\').disabled=false;document.getElementById(\'errorMsg\').textContent=\'Could not reach server.\';document.getElementById(\'error\').classList.remove(\'hidden\');};x.send(JSON.stringify({url:url}));}</script></body></html>');
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/scan', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const result = await runTrustScan(url);
    if (result.error) return res.status(400).json(result);
    const id = uuidv4();
    reports[id] = { url, result, created_at: new Date().toISOString() };
    res.json({ id, score: result.score, grade: result.grade, issues: result.issues_found });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function renderReport(id, report) {
  const r = report.result;
  const sc = r.score >= 50 ? '#10b981' : r.score >= 25 ? '#f59e0b' : '#ef4444';
  const gc = r.score >= 50 ? 'text-emerald-400' : r.score >= 25 ? 'text-amber-400' : 'text-red-400';
  const gb = r.score >= 50 ? 'bg-emerald-500/20 border-emerald-500/40' : r.score >= 25 ? 'bg-amber-500/20 border-amber-500/40' : 'bg-red-500/20 border-red-500/40';
  const circ = 326.7, off = circ - circ * r.score / 100;
  let ph = '', sh = '', ih = '';
  r.pillars.forEach(p => { const bc = p.percentage >= 60 ? '#10b981' : p.percentage >= 35 ? '#f59e0b' : '#ef4444'; ph += '<div class="gradient-card rounded-2xl border border-slate-800 p-5 sm:p-6"><div class="flex justify-between items-center mb-2"><div><span class="text-white font-bold text-lg">' + p.label + '</span></div><span class="text-white font-extrabold text-xl">' + p.score + '<span class="text-sm font-medium text-slate-400">/' + p.max_score + '</span></span></div><div style="background:#1e293b;border:2px solid #475569;border-radius:8px;height:34px;overflow:hidden"><div style="background:' + bc + ';width:' + p.percentage + '%;height:34px;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding-right:10px;font-size:12px;font-weight:800;color:#fff">' + p.percentage + '%</div></div></div>'; });
  r.standards.forEach(s => { sh += '<div class="gradient-card rounded-xl border border-' + (s.passed ? 'emerald' : 'red') + '-800/50 p-4 flex items-center gap-3"><span class="' + (s.passed ? 'text-emerald-400">\u2713' : 'text-red-400">\u2717') + '</span><span class="text-sm font-medium text-white">' + s.name + '</span></div>'; });
  r.issues.forEach((x, i) => { ih += '<div class="gradient-card rounded-2xl border border-slate-800 p-5 flex items-start gap-4"><span class="shrink-0 w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-lg font-bold">' + (i+1) + '</span><div><h3 class="text-white font-bold">' + x.title + '</h3><p class="text-sm text-slate-400 mt-1">' + x.detail + '</p></div></div>'; });
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deep Report &mdash; ' + report.url + ' | Trust Trigger Agency</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"><script src="https://cdn.tailwindcss.com"></script><style>html,body{font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:#0f172a;color:#e2e8f0}.gradient-card{background:linear-gradient(135deg,#1e293b,#0f172a)}.gradient-hero{background:linear-gradient(135deg,#0f172a 0%,#1a2a4a 50%,#78350f 100%)}.score-ring{transform:rotate(-90deg)}</style></head><body><section class="relative pt-32 sm:pt-40 pb-20 sm:pb-28 overflow-hidden gradient-hero"><div class="absolute inset-0 opacity-10"><div class="absolute top-20 left-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl"></div><div class="absolute bottom-10 right-10 w-96 h-96 bg-amber-300 rounded-full blur-3xl"></div></div><div class="relative max-w-6xl mx-auto px-6"><div class="max-w-4xl mx-auto text-center"><div class="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-6">Deep Report</div><h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">Your Digital Trust Score</h1><p class="mt-4 text-lg text-slate-300 max-w-xl mx-auto">Assessment complete for <strong class="text-amber-400">' + report.url + '</strong></p><div class="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8"><div class="relative w-40 h-40 flex items-center justify-center"><svg class="w-40 h-40 score-ring" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#334155" stroke-width="8"/><circle cx="60" cy="60" r="52" fill="none" stroke="' + sc + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '"/></svg><div class="absolute text-center"><span class="text-6xl font-extrabold text-white">' + r.score + '</span><span class="text-lg font-semibold text-slate-400">/100</span></div></div><div class="text-left"><div class="inline-block rounded-full px-4 py-1.5 ' + gb + ' ' + gc + ' text-sm font-bold mb-2">' + r.grade + '</div><div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"><span>\uD83D\uDCCA 5 pillars assessed</span><span>\u26A0\uFE0F ' + r.issues_found + ' issues found</span></div></div></div></div></div></section><section class="py-16 sm:py-20 bg-slate-900"><div class="max-w-6xl mx-auto px-6"><div class="max-w-3xl mx-auto"><div class="text-center mb-10"><div class="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-4">Trust Breakdown</div><h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">How your website scores</h2></div><div class="space-y-4">' + ph + '</div></div></div></section><section class="py-16 sm:py-20 bg-slate-950"><div class="max-w-6xl mx-auto px-6"><div class="max-w-3xl mx-auto"><div class="text-center mb-10"><div class="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-4">Standards Audit</div><h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">The 9 Essential Trust Signals</h2><p class="mt-4 text-slate-400">Your website passed <strong class="text-emerald-400">' + r.standards_passed + '</strong> of ' + r.standards_total + '.</p></div><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">' + sh + '</div></div></div></section><section class="py-16 sm:py-20 bg-slate-900"><div class="max-w-6xl mx-auto px-6"><div class="max-w-3xl mx-auto"><div class="text-center mb-10"><div class="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-4">Priority Issues</div><h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Issues Found</h2></div><div class="space-y-4">' + ih + '</div></div></div></section><footer class="bg-slate-950 border-t border-slate-800 py-10 px-6"><div class="max-w-6xl mx-auto"><div class="flex flex-col md:flex-row items-center justify-between gap-6"><div class="flex items-center gap-2"><span class="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-extrabold">TTA</span><div><div class="font-bold text-lg tracking-tight text-amber-400">Trust Trigger Agency</div><div class="text-xs text-slate-500">Measure. Transform. Prove. Maintain.</div></div></div><div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm text-slate-400"><span>\uD83D\uDCDE +44 208 591 1163</span><span>\uD83D\uDCDE +44 7956 393270</span><span>\u2709\uFE0F info@trusttriggeragency.com</span><span>\uD83D\uDCCD London, UK</span></div><div class="text-xs text-slate-500 text-center">We help businesses earn and maintain trust online.</div></div><div class="border-t border-slate-800 mt-6 pt-4 text-center"><p class="text-xs text-slate-500">\u00A9 2025 Trust Trigger Agency. All rights reserved.</p></div></div></footer></body></html>';
}

app.get('/report/:id', (req, res) => {
  const report = reports[req.params.id];
  if (!report) return res.status(404).send('<h1>Report not found</h1>');
  res.type('html').send(renderReport(req.params.id, report));
});

app.post('/api/v1/public/brand-snapshot', async (req, res) => {
  try {
    const { full_name, website, email } = req.body;
    if (!full_name || !website || !email) return res.status(422).json({ success: false, error: 'Missing fields.' });
    const result = await scanner.runBrandScan(website);
    if (result.error) return res.status(422).json({ success: false, error: result.error });
    const leadId = uuidv4();
    brandReports[leadId] = { full_name, website, email, result, created_at: new Date().toISOString() };
    res.status(201).json({ success: true, message: 'Brand Identity Audit is ready.', report_url: '/api/v1/public/brand-report/' + leadId, lead_id: leadId, brand_score: result.brandScore, grade: result.grade, gaps_found: result.gapsCount, pillars: result.pillars.map(p => ({ name: p.name, label: p.label, score: p.score, max_score: p.maxScore, percentage: p.percentage, detail: p.detail })), gaps: result.gaps, cms: result.cms, error: '' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log('Scanner running on port ' + PORT));
