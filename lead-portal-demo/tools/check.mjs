// Fast health check for the demo. No dependencies, no browser.
// Run from lead-portal-demo/:  npm run check
//
// It checks:
//   1. Every page in the tour (assets/shell.js JOURNEY) exists, and every page is in the tour.
//   2. Page basics: lang, <title>, viewport, noindex, data-page, shared CSS and shell.js.
//   3. Every local link and #anchor points at something real.
//   4. No duplicate ids on a page.
//   5. The sample numbers in data/sample-data.json add up.
//   6. Key numbers appear on the pages that are supposed to show them (shownOn).
// Exit code 1 if anything fails, with a plain-English list of what to fix.
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const notes = [];
const fail = (msg) => problems.push(msg);

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };
const read = (p) => readFile(path.join(ROOT, p), 'utf8');

const pages = (await readdir(ROOT)).filter((f) => f.endsWith('.html')).sort();
const html = {};
for (const p of pages) html[p] = await read(p);

// 1. Tour order from shell.js
const shell = await read('assets/shell.js');
const journeyBlock = (shell.match(/var JOURNEY = \[([\s\S]*?)\];/) || [])[1] || '';
const journey = [...journeyBlock.matchAll(/file: '([^']+)'/g)].map((m) => m[1]);
if (!journey.length) fail('Could not find the JOURNEY list in assets/shell.js.');
const navTargets = [...shell.matchAll(/file: '([^']+)'/g)].map((m) => m[1]);
for (const f of new Set(navTargets)) {
  if (!pages.includes(f)) fail(`assets/shell.js points to ${f}, but that page does not exist.`);
}
for (const p of pages) {
  if (p !== 'index.html' && !journey.includes(p)) fail(`${p} is not in the tour. Add it to JOURNEY in assets/shell.js.`);
}
notes.push(`${pages.length} pages, ${journey.length} in the tour`);

// 2. Page basics
for (const p of pages) {
  const src = html[p];
  if (!/<html lang="en">/.test(src)) fail(`${p}: <html lang="en"> is missing.`);
  if (!/<title>[^<]+<\/title>/.test(src)) fail(`${p}: <title> is missing or empty.`);
  if (!/name="viewport"/.test(src)) fail(`${p}: viewport meta is missing.`);
  if (!/name="robots" content="noindex, nofollow"/.test(src)) fail(`${p}: add <meta name="robots" content="noindex, nofollow"> so the demo stays out of Google.`);
  if (!new RegExp(`<body[^>]*data-page="${p.replace('.', '\\.')}"`).test(src)) fail(`${p}: <body> needs data-page="${p}".`);
  if (!src.includes('href="assets/styles.css"')) fail(`${p}: shared stylesheet assets/styles.css is not linked.`);
  if (!src.includes('src="assets/shell.js"')) fail(`${p}: assets/shell.js is not loaded, so the demo bar and sidebar will be missing.`);
  const navMatch = src.match(/data-nav="(full|free)" data-active="([^"]+)"/);
  if (navMatch && navMatch[2] !== p) fail(`${p}: sidebar data-active is "${navMatch[2]}", should be "${p}".`);
  if (navMatch && src.indexOf('data-nav=') > src.indexOf('src="assets/shell.js"')) fail(`${p}: load assets/shell.js AFTER the <nav data-nav> placeholder.`);
  if (/\{\{|\}\}/.test(src)) fail(`${p}: contains {{ or }} (template leftovers).`);
}

// 3 + 4. Links, anchors, ids
const idsOf = (src) => [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
for (const p of pages) {
  const src = html[p];
  const ids = idsOf(src);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const d of new Set(dupes)) fail(`${p}: id="${d}" is used more than once.`);
  for (const m of src.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(url)) continue;
    if (url === '#') continue;
    const [file, hash] = url.split('#');
    const target = file ? path.normalize(file) : p;
    if (file && !(await exists(path.join(ROOT, target)))) { fail(`${p}: link to "${url}" is broken (no such file).`); continue; }
    if (hash) {
      const targetSrc = html[target] ?? '';
      if (!idsOf(targetSrc).includes(hash)) fail(`${p}: link to "${url}" points at #${hash}, which does not exist on ${target}.`);
    }
  }
}

// 5. Sample numbers add up
const data = JSON.parse(await read('data/sample-data.json'));
const sum = (rows, key) => rows.reduce((t, r) => t + r[key], 0);
const fields = ['cost', 'leads', 'qualified', 'policies', 'premium'];
for (const k of fields) {
  const s = sum(data.channels, k);
  if (s !== data.totals[k]) fail(`sample-data.json: channels add up to ${k} = ${s}, but totals.${k} says ${data.totals[k]}.`);
}
const cpp = Math.round(data.totals.cost / data.totals.policies);
if (cpp !== data.totals.costPerPolicy) fail(`sample-data.json: cost per policy should be $${cpp}, totals says $${data.totals.costPerPolicy}.`);
const paidChannels = data.channels.filter((c) => c.group === 'paid');
const pairs = [['spend', 'cost'], ['leads', 'leads'], ['qualified', 'qualified'], ['policies', 'policies'], ['premium', 'premium']];
for (const [campKey, chanKey] of pairs) {
  const fromCampaigns = sum(data.paidCampaigns, campKey);
  const fromChannels = sum(paidChannels, chanKey);
  if (fromCampaigns !== data.paidTotals[campKey]) fail(`sample-data.json: paid campaigns add up to ${campKey} = ${fromCampaigns}, paidTotals says ${data.paidTotals[campKey]}.`);
  if (fromChannels !== data.paidTotals[campKey]) fail(`sample-data.json: paid channels add up to ${chanKey} = ${fromChannels}, paidTotals says ${data.paidTotals[campKey]}.`);
}
for (const ch of paidChannels) {
  const camps = data.paidCampaigns.filter((c) => c.channel === ch.name);
  for (const [campKey, chanKey] of pairs) {
    if (sum(camps, campKey) !== ch[chanKey]) fail(`sample-data.json: campaigns under "${ch.name}" add up to ${campKey} = ${sum(camps, campKey)}, but the channel says ${ch[chanKey]}.`);
  }
}
const cpq = Math.round(data.paidTotals.spend / data.paidTotals.qualified);
if (cpq !== data.paidTotals.costPerQualified) fail(`sample-data.json: paid cost per qualified lead should be $${cpq}, paidTotals says $${data.paidTotals.costPerQualified}.`);
const lcd = Math.round((data.paidTotals.premium * data.assumptions.lifetimeCommissionShareOfPremium / data.paidTotals.spend) * 100) / 100;
if (lcd !== data.paidTotals.lifetimeCommissionPerDollar) fail(`sample-data.json: lifetime commission per $1 should be $${lcd.toFixed(2)}, paidTotals says $${data.paidTotals.lifetimeCommissionPerDollar}.`);
const f = data.funnel;
if (f.leads !== data.paidTotals.leads || f.qualified !== data.paidTotals.qualified || f.bound !== data.paidTotals.policies) fail('sample-data.json: funnel leads, qualified and bound must match paidTotals.');
const organic = data.channels.filter((c) => ['SEO', 'Google Business Profile', 'AI answers'].includes(c.name));
if (sum(organic, 'leads') !== data.search.searchLeads) fail(`sample-data.json: SEO + Google Business Profile + AI answers leads = ${sum(organic, 'leads')}, search.searchLeads says ${data.search.searchLeads}.`);
if (sum(organic, 'policies') !== data.search.searchPolicies) fail(`sample-data.json: SEO + Google Business Profile + AI answers policies = ${sum(organic, 'policies')}, search.searchPolicies says ${data.search.searchPolicies}.`);
const organicShare = Math.round((data.totals.policies - data.paidTotals.policies) / data.totals.policies * 100);
if (!html['channels.html'].includes(`${organicShare}%`)) fail(`channels.html should show ${organicShare}% of policies from search, AI and referrals.`);

// 6. Key numbers appear where they should
for (const item of data.shownOn) {
  for (const p of item.pages) {
    if (!html[p]) { fail(`sample-data.json shownOn lists ${p}, which does not exist.`); continue; }
    if (!html[p].includes(item.text)) fail(`${p} should show "${item.text}" (from data/sample-data.json), but it does not.`);
  }
}

// Report
if (problems.length) {
  console.log(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'} found:\n`);
  problems.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  console.log('');
  process.exit(1);
} else {
  console.log(`✓ All checks passed (${notes.join('; ')}).`);
}
