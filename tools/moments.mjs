/**
 * Captures the game's set-piece moments — the ones that only happen a few
 * times a match and are therefore easy to ship broken: a concede, an
 * elimination, the KO announcement, and the low-health warning state.
 *
 *   node tools/moments.mjs [url] [outDir]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = process.argv[3] || '/tmp/shots/moments';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({
  viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1,
})).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(`PAGEERROR ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await page.goto(`${URL}?tier=2&dpr=1`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('menu').classList.contains('hidden'), { timeout: 90000 });
await page.click('#playBtn');
await page.waitForTimeout(6000);

const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });

// --- a rival concedes -------------------------------------------------------
await page.evaluate(() => {
  const g = window.__ballistix.game;
  const o = g.orbs.find((x) => x.active) || g.orbs[0];
  o.active = true; o.x = 0; o.z = -12; o.speed = 26;
  g._concede({ type: 'goal', orb: o, victim: 2, x: 2, z: -13.2, u01: 0.6 });
});
await page.waitForTimeout(180);
await shot('01-concede-rival');
await page.waitForTimeout(1400);

// --- the player is down to one point ---------------------------------------
await page.evaluate(() => {
  const g = window.__ballistix.game;
  g.scores[0] = 1;
  g.hud.setScore(0, 1);
  g.arena.setBarrierHealth(0, 0.2);
});
await page.waitForTimeout(1200);
await shot('02-last-life');

// --- an elimination ---------------------------------------------------------
await page.evaluate(() => {
  const g = window.__ballistix.game;
  g.scores[1] = 0;
  g.hud.setScore(1, 0);
  g._eliminate(1);
});
await page.waitForTimeout(260);
await shot('03-eliminate');
await page.waitForTimeout(700);
await shot('04-eliminate-after');
await page.waitForTimeout(1400);
await shot('05-sealed-wall');

// --- surge -------------------------------------------------------------------
await page.waitForTimeout(2500);
await page.evaluate(() => {
  const g = window.__ballistix.game;
  g.crafts[0].surge = 1;
  if (g.crafts[0].trySurge()) g.effects.surge(g.crafts[0]);
});
await page.waitForTimeout(140);
await shot('06-surge');

const state = await page.evaluate(() => {
  const g = window.__ballistix.game;
  return { state: g.state, scores: g.scores, alive: g.alive, timeScale: +g.timeScale.toFixed(2) };
});
console.log(JSON.stringify(state));
console.log(errs.length ? errs.join('\n') : '(clean)');
await browser.close();
