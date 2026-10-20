// Opens every page in a real browser (Chromium via Playwright), takes desktop and phone
// screenshots, reports console errors and sideways scrolling, and clicks the main controls.
//
// Run from lead-portal-demo/:
//   npm install                 (once)
//   npx playwright install chromium   (once, if Chromium isn't installed yet)
//   npm run shots               (all pages)
//   npm run shots -- inbox      (only pages whose file name contains "inbox")
//
// Screenshots land in screenshots/desktop/ and screenshots/phone/ (git-ignored).
// Ask Claude to open them to see what a page looks like.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { startServer, ROOT } from './serve.mjs';

const PORT = Number(process.env.SHOTS_PORT || 4399);
const BASE = `http://127.0.0.1:${PORT}/`;
const filter = process.argv[2] || '';

const shell = await readFile(path.join(ROOT, 'assets/shell.js'), 'utf8');
const journeyBlock = (shell.match(/var JOURNEY = \[([\s\S]*?)\];/) || [])[1] || '';
const journey = [...journeyBlock.matchAll(/file: '([^']+)'/g)].map((m) => m[1]);
const pages = ['index.html', ...journey].filter((p) => p.includes(filter));

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 }
];

// Interaction checks: each one clicks something and checks the page reacted.
const INTERACTIONS = {
  'inbox.html': async (page) => {
    const before = await page.locator('[data-unmarked-count]').first().textContent();
    await page.locator('button[data-lead="maria"][data-status="qualified"]').click();
    const after = await page.locator('[data-unmarked-count]').first().textContent();
    if (Number(after) !== Number(before) - 1) return `marking Maria as Qualified should lower the unmarked count from ${before}, but it shows ${after}`;
  },
  'insights.html': async (page) => {
    await page.locator('[data-rec] [data-decide="approved"]').first().click();
    const count = await page.locator('#approved-count').textContent();
    if (count.trim() !== '1') return `approving the first change should show 1 approved, but it shows ${count}`;
  },
  'onboarding.html': async (page) => {
    await page.locator('[data-panel="1"] [data-go="2"]').click();
    if (!(await page.locator('[data-panel="2"]').isVisible())) return 'Continue on step 1 should show step 2';
    await page.locator('[data-source]').first().click();
    const n = await page.locator('[data-panel="2"] [data-connected-count]').textContent();
    if (n.trim() !== '1') return `connecting a source should show 1 connected, but it shows ${n}`;
  },
  'book-consult.html': async (page) => {
    await page.locator('#confirm').click();
    if (!(await page.locator('#slot-error').isVisible())) return 'confirming without a time should show "Pick a time first."';
    await page.locator('.slot').nth(2).click();
    await page.locator('#confirm').click();
    if (!(await page.locator('#booked').isVisible())) return 'confirming with a time should show the booked message';
  },
  'setup.html': async (page) => {
    await page.locator('[data-need]').first().click();
    const n = await page.locator('#done-count').textContent();
    if (n.trim() !== '1') return `marking a task done should show 1 of 4 done, but it shows ${n}`;
  }
};

await mkdir(path.join(ROOT, 'screenshots/desktop'), { recursive: true });
await mkdir(path.join(ROOT, 'screenshots/phone'), { recursive: true });

const server = await startServer(PORT);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const problems = [];
let fontWarning = false;

try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    for (const file of pages) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        // Failed downloads are reported by 'requestfailed' below, with the URL, so skip the vaguer console copy.
        if (/^Failed to load resource/.test(msg.text())) return;
        errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('requestfailed', (req) => {
        if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) { fontWarning = true; return; }
        errors.push(`failed to load ${req.url()}`);
      });
      await page.goto(BASE + file, { waitUntil: 'load' });
      await page.waitForTimeout(150);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) problems.push(`${file} (${vp.name}): the page scrolls sideways by ${overflow}px. Something is wider than the screen.`);
      const hasBar = await page.locator('.demo-bar').count();
      if (!hasBar) problems.push(`${file} (${vp.name}): the demo bar is missing (assets/shell.js did not run).`);

      await page.screenshot({ path: path.join(ROOT, 'screenshots', vp.name, file.replace('.html', '.png')), fullPage: true });

      if (vp.name === 'desktop' && INTERACTIONS[file]) {
        try {
          const result = await INTERACTIONS[file](page);
          if (result) problems.push(`${file}: ${result}.`);
        } catch (err) {
          problems.push(`${file}: interaction check crashed: ${err.message.split('\n')[0]}`);
        }
      }
      for (const e of errors) problems.push(`${file} (${vp.name}): ${e}`);
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`Screenshots saved for ${pages.length} page(s) in screenshots/desktop and screenshots/phone.`);
if (fontWarning) console.log('Note: Google Fonts could not load here, so screenshots use the fallback font. That is fine offline.');
if (problems.length) {
  console.log(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'} found:\n`);
  problems.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  process.exit(1);
} else {
  console.log('✓ No console errors, no sideways scrolling, and all clicks worked.');
}
