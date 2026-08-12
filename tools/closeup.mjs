/**
 * Zoomed captures for judging craft, orb and barrier detail — things that are
 * only a few dozen pixels tall in the normal framing.
 *
 *   node tools/closeup.mjs [url] [outDir] [zoom]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://127.0.0.1:5173/';
const OUT = process.argv[3] || '/tmp/shots';
const ZOOM = process.argv[4] || '0.42';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(`PAGEERROR ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(`${URL}?tier=2&dpr=1&zoom=${ZOOM}`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('menu').classList.contains('hidden'), { timeout: 90000 });
await page.click('#playBtn');
await page.waitForTimeout(7000);

for (let i = 0; i < 4; i++) {
  await page.screenshot({ path: `${OUT}/close-${i}.png` });
  await page.waitForTimeout(2600);
}

const diag = await page.evaluate(() => {
  const a = window.__ballistix;
  const g = a.game;
  return {
    state: g.state, scores: g.scores, orbs: g.activeOrbs().length,
    craft0: { u: +g.crafts[0].u.toFixed(2), alive: g.crafts[0].alive },
    orbPos: g.orbs.filter(o => o.active).map(o => [+o.x.toFixed(1), +o.z.toFixed(1), +o.speed.toFixed(1)]),
  };
});
console.log(JSON.stringify(diag));
console.log(errs.join('\n') || '(clean)');
await browser.close();
