/**
 * Symmetry check.
 *
 * Runs scored matches with all four pilots driven by the same AI at the same
 * skill. If the rules are fair, wins should spread roughly evenly across the
 * four seats; a seat that wins (or loses) consistently means the geometry,
 * serve logic or targeting weights are biased — not that one pilot is better.
 *
 *   node tools/balance.mjs [url] [matches] [difficulty]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:5173/';
const N = Number(process.argv[3] || 6);
const DIFF = Number(process.argv[4] || 1);

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({ viewport: { width: 640, height: 400 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

await page.goto(`${URL}?tier=0&dpr=0.6&auto=1`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('menu').classList.contains('hidden'), { timeout: 90000 });
await page.evaluate((d) => {
  document.querySelectorAll('.diff').forEach((b) => b.classList.toggle('active', Number(b.dataset.diff) === d));
  window.__ballistix.difficulty = d;
}, DIFF);

const wins = [0, 0, 0, 0];
const elimFirst = [0, 0, 0, 0];
const durations = [];

for (let m = 0; m < N; m++) {
  await page.evaluate(() => {
    const a = window.__ballistix;
    a.game.autoPlayer = true;
    a.inMatch = true;
    a.hud.showGame(true);
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('result').classList.add('hidden');
    a.game.startMatch(a.difficulty);
  });

  const r = await page.waitForFunction(() => {
    const g = window.__ballistix?.game;
    if (!g || g.state !== 'over') return null;
    const w = g.alive.indexOf(true);
    return { winner: w, first: g.eliminationOrder[0] ?? -1, t: +g.matchTime.toFixed(1), scores: g.scores.slice() };
  }, null, { timeout: 300000, polling: 400 }).then((h) => h.jsonValue());

  wins[r.winner]++;
  if (r.first >= 0) elimFirst[r.first]++;
  durations.push(r.t);
  console.log(`match ${m + 1}: winner=P${r.winner} firstOut=P${r.first} t=${r.t}s scores=${JSON.stringify(r.scores)}`);
  await page.waitForTimeout(400);
}

const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
console.log(`\nwins by seat      : ${JSON.stringify(wins)}   (even spread ≈ ${(N / 4).toFixed(1)} each)`);
console.log(`first out by seat : ${JSON.stringify(elimFirst)}`);
console.log(`match length      : avg ${avg.toFixed(1)}s  min ${Math.min(...durations)}  max ${Math.max(...durations)}`);
console.log(errs.length ? `\nerrors:\n${errs.join('\n')}` : '\nerrors: none');
await browser.close();
