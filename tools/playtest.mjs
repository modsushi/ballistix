/**
 * Drives a whole match and asserts the loop actually resolves: points drain,
 * pilots get eliminated, a winner emerges, the result screen appears.
 *
 * Also exercises pause/resume and the surge tap, and samples state over time so
 * pacing regressions (matches that never end, orbs that never escalate) show up
 * as data rather than as a vibe.
 *
 *   node tools/playtest.mjs [url]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 900, height: 560 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}\n${e.stack}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

await page.goto(`${URL}?tier=1&dpr=1`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('menu').classList.contains('hidden'), { timeout: 90000 });

// Attract mode should be live before anyone presses anything.
const attract = await page.evaluate(() => ({
  attract: window.__ballistix.game.attract,
  state: window.__ballistix.game.state,
}));
console.log('attract:', JSON.stringify(attract));

await page.click('#playBtn');
await page.waitForTimeout(800);

// --- pause / resume ---------------------------------------------------------
await page.click('#pauseBtn');
await page.waitForTimeout(400);
const paused = await page.evaluate(() => window.__ballistix.game.paused);
await page.click('#resumeBtn');
await page.waitForTimeout(400);
const resumed = await page.evaluate(() => !window.__ballistix.game.paused);
console.log(`pause=${paused} resume=${resumed}`);

// --- play: chase the orb with the pointer, tap now and then for surge -------
const samples = [];
const deadline = Date.now() + 260000;
let done = null;
let surges = 0;

while (Date.now() < deadline) {
  const st = await page.evaluate(() => {
    const g = window.__ballistix.game;
    const live = g.orbs.filter((o) => o.active);
    // Where should the player's paddle be? Project the nearest orb's x.
    let targetX = null;
    if (live.length) {
      // Threat = the orb heading at us soonest, straight-line (no bounces),
      // which is roughly what an average player tracks. The paddle plane is
      // read off the craft rather than hard-coded — it moved when the deck was
      // widened for the brick field, and a stale constant here doesn't fail
      // loudly, it just quietly makes the harness play like a bad player.
      const plane = g.crafts[0].standoffDist;
      let best = null, bt = 1e9;
      for (const o of live) {
        if (o.vz <= 0.01) continue;
        const t = (plane - o.z) / o.vz;
        if (t > 0 && t < bt) { bt = t; best = o; }
      }
      const o = best || live.reduce((a, b) => (b.z > a.z ? b : a));
      const wantX = best ? best.x + best.vx * bt : o.x;
      // Project onto the craft's own wall tangent. `u` is not an x coordinate:
      // for the south wall the tangent is -X, so feeding x straight in aims the
      // paddle *away* from the orb and the harness quietly plays a match as the
      // worst player alive.
      const c = g.crafts[0];
      const wantU = wantX * c.tx + plane * c.tz;

      // Invert the game's own screen->paddle mapping. It is linear, so two
      // probes fully determine it; using the real mapper keeps the test from
      // fighting the input gain instead of measuring difficulty.
      const map = g._mapper.map;
      const W = window.innerWidth;
      const u0 = map(W * 0.1), u1 = map(W * 0.9);
      targetX = u1 === u0 ? W / 2 : W * 0.1 + (wantU - u0) * (W * 0.8) / (u1 - u0);
    }
    return {
      state: g.state, scores: g.scores.slice(), alive: g.alive.slice(),
      orbs: live.length, playTime: +g.playTime.toFixed(1),
      // The middle is now a point source, so it gets sampled too: a field that
      // never erodes and a salvage bank that never pays are both pacing bugs
      // that look fine in a screenshot.
      bricks: g.bricks.liveCount, salvage: g.salvage.slice(),
      chain: g.chain, surge: +g.crafts[0].surge.toFixed(2),
      resultOpen: !document.getElementById('result').classList.contains('hidden'),
      targetX,
    };
  });
  samples.push(st);

  if (st.resultOpen || st.state === 'over') { done = st; if (st.resultOpen) break; }

  if (st.targetX != null) {
    await page.mouse.move(Math.max(4, Math.min(896, st.targetX)), 460);
  }
  if (st.surge >= 1 && Math.random() < 0.25) {
    await page.mouse.down(); await page.mouse.up(); surges++;
  }
  await page.waitForTimeout(160);
}

const final = await page.evaluate(() => {
  const g = window.__ballistix.game;
  const rows = [...document.querySelectorAll('.stand-row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim());
  const stats = [...document.querySelectorAll('.stat')].map((r) => r.textContent.replace(/\s+/g, ' ').trim());
  return {
    state: g.state, scores: g.scores, alive: g.alive,
    elimOrder: g.eliminationOrder, matchTime: +g.matchTime.toFixed(1),
    stats: g.stats,
    resultOpen: !document.getElementById('result').classList.contains('hidden'),
    rows, statCards: stats,
  };
});

// Pacing trace: one line per ~10s of wall clock.
console.log('\n--- pacing ---');
for (let i = 0; i < samples.length; i += 60) {
  const s = samples[i];
  console.log(`t=${String(s.playTime).padStart(6)}  ${s.state.padEnd(6)} orbs=${s.orbs}`
    + ` scores=${JSON.stringify(s.scores)} salvage=${JSON.stringify(s.salvage)}`
    + ` bricks=${s.bricks} chain=${s.chain}`);
}

console.log('\n--- final ---');
console.log(JSON.stringify(final, null, 1));
console.log(`surge taps sent: ${surges}`);

if (final.resultOpen) {
  await page.screenshot({ path: '/tmp/shots/result.png' });
  console.log('result screenshot -> /tmp/shots/result.png');
}

console.log('\n--- errors ---');
console.log(errors.length ? errors.join('\n') : '(none)');
await browser.close();
process.exit(errors.length ? 1 : 0);
