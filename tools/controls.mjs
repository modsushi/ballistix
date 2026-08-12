/**
 * Asserts that the controls do what they say.
 *
 * Three things this catches, all of which shipped broken once:
 *   1. Direction — "right" must move the craft right *on screen*, for both the
 *      pointer and the keyboard. The wall offset `u` runs along the craft's
 *      tangent, which for the south wall points at -X, so any mapping built
 *      from world X is inverted.
 *   2. Device hand-off — releasing a steering key must leave the craft where it
 *      is, not snap it back to wherever a long-idle mouse cursor happens to be
 *      sitting.
 *   3. Range — the far edges of the mapping must actually reach the wall's
 *      limits.
 *   4. No stall — a held key must produce continuous motion from the first
 *      frame. A discrete step followed by a start-up delay reads as the
 *      control snagging, and shipped that way once.
 *
 *   node tools/controls.mjs [url]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'],
});
const W = 1200, H = 700;
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await page.goto(`${URL}?tier=0&dpr=1`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('menu').classList.contains('hidden'), null, { timeout: 90000 });
await page.click('#playBtn');
await page.waitForTimeout(5500);

/** Screen x of the player's craft right now. */
const screenX = () => page.evaluate(() => {
  const a = window.__ballistix, c = a.game.crafts[0];
  const v = new (a.gcam.cam.position.constructor)(c.root.position.x, 0.92, c.root.position.z);
  v.project(a.gcam.cam);
  return Math.round((v.x * 0.5 + 0.5) * window.innerWidth);
});
const u = () => page.evaluate(() => +window.__ballistix.game.crafts[0].u.toFixed(2));


/**
 * Sample the craft's offset every frame, in-page, for `ms`.
 *
 * Reading a value per assertion over CDP costs 50-100ms a hop under a software
 * renderer, which is the same order as the timings being measured — the shape
 * of a 400ms animation simply cannot be resolved that way. One evaluate that
 * records at requestAnimationFrame gives honest timestamps.
 */
const record = (ms) => page.evaluate((dur) => new Promise((done) => {
  const out = [];
  const t0 = performance.now();
  const tick = () => {
    const t = performance.now() - t0;
    out.push([Math.round(t), +window.__ballistix.game.crafts[0].u.toFixed(3)]);
    if (t < dur) requestAnimationFrame(tick); else done(out);
  };
  requestAnimationFrame(tick);
}), ms);

/** Value of the series at (or just after) `t` ms. */
const at = (series, t) => (series.find((s) => s[0] >= t) || series[series.length - 1])[1];


/**
 * Fire `count` taps of `code` at a true `interval`, from inside the page.
 *
 * Driving taps over CDP adds 60-120ms of unpredictable latency per press,
 * which is the same order as the tap cadence being tested — the harness ends
 * up measuring Playwright's round-trip rather than the game's feel. Dispatching
 * from in-page makes the cadence exactly what it claims to be.
 */
const tapLoop = (code, count, interval) => page.evaluate(async (o) => {
  const fire = (type) => window.dispatchEvent(new KeyboardEvent(type, { code: o.code, bubbles: true }));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const series = [];
  for (let i = 0; i < o.count; i++) {
    fire('keydown');
    await wait(40);
    fire('keyup');
    await wait(o.interval - 40);
    const a = window.__ballistix;
    // Carry the time scale so the caller can discard steps that landed during
    // hit-stop, where a wall-clock interval buys far less simulation time.
    series.push([+a.game.crafts[0].u.toFixed(3), +a.game.timeScale.toFixed(3)]);
  }
  return series;
}, { code, count, interval });

/**
 * Hold `code` for `ms`, recording the craft's offset each frame.
 *
 * Also records `timeScale`. Scoring a goal triggers hit-stop and slow motion,
 * which freezes the craft for a beat — indistinguishable from an input stall
 * if you only look at position against wall-clock time. Sampling the scale
 * lets the caller measure displacement in *simulation* time, which is the
 * frame of reference a control's responsiveness actually lives in.
 */
const holdAndRecord = (code, ms) => page.evaluate(async (o) => {
  const fire = (type) => window.dispatchEvent(new KeyboardEvent(type, { code: o.code, bubbles: true }));
  const out = [];
  const t0 = performance.now();
  fire('keydown');
  await new Promise((done) => {
    const tick = () => {
      const a = window.__ballistix;
      const t = performance.now() - t0;
      out.push([Math.round(t), +a.game.crafts[0].u.toFixed(3), +a.game.timeScale.toFixed(3)]);
      if (t < o.ms) requestAnimationFrame(tick); else done();
    };
    requestAnimationFrame(tick);
  });
  fire('keyup');
  return out;
}, { code, ms });


/**
 * Keep the match running for the length of the suite.
 *
 * A match resolves in about 100 seconds and this file now takes longer than
 * that. Once someone wins, `_steerPlayer` stops being called and every
 * remaining assertion fails against a frozen craft — which looks exactly like
 * a controls bug and is not one. Topping the scores up keeps everyone alive;
 * if a match did already finish, start a fresh one and wait out its intro.
 */
const keepAlive = async () => {
  const restarted = await page.evaluate(() => {
    const a = window.__ballistix, g = a.game;
    if (g.state === 'over' || !g.alive[0]) {
      a.inMatch = true;
      document.getElementById('result').classList.add('hidden');
      g.startMatch(a.difficulty);
      return true;
    }
    for (let i = 0; i < 4; i++) { g.scores[i] = 5; g.alive[i] = true; g.hud.setScore(i, 5); }
    return false;
  });
  if (restarted) await page.waitForTimeout(4200);   // intro sweep
};

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `   ${detail}` : ''}`);
};

// --- 1. pointer direction ---------------------------------------------------
await page.mouse.move(W * 0.25, H * 0.75);
await page.waitForTimeout(900);
const leftX = await screenX();
await page.mouse.move(W * 0.75, H * 0.75);
await page.waitForTimeout(900);
const rightX = await screenX();
check('pointer right moves craft right', rightX > leftX + 40, `left→${leftX}px  right→${rightX}px`);

// --- 2. pointer range -------------------------------------------------------
await page.mouse.move(2, H * 0.75);
await page.waitForTimeout(1100);
const uMin = await u();
await page.mouse.move(W - 2, H * 0.75);
await page.waitForTimeout(1100);
const uMax = await u();
const limit = await page.evaluate(() => +window.__ballistix.game.crafts[0].limit.toFixed(2));
check('pointer reaches both wall limits',
  Math.abs(uMin) > limit * 0.93 && Math.abs(uMax) > limit * 0.93 && Math.sign(uMin) !== Math.sign(uMax),
  `u ∈ [${uMin}, ${uMax}]  limit ±${limit}`);

// --- 3. keyboard direction --------------------------------------------------
// Measured as `u * sign`, which is the craft's offset expressed in screen terms
// (positive = right). Screen-space pixels would work too, but the camera leans
// toward the action, so a stationary craft drifts tens of pixels on its own.
const sign = () => page.evaluate(() => window.__ballistix.game._mapper.sign);
const screenU = async () => (await u()) * (await sign());

/**
 * Park the craft mid-wall with the mouse, ready to hand control to the keyboard.
 *
 * Two moves, not one. Hover-steer only reclaims control on a *real* pointer
 * movement, so if the cursor already sits at centre from a previous call, a
 * single move to the same coordinates changes nothing and the craft stays
 * wherever the keyboard left it — which used to be masked by the craft
 * self-centring on its own.
 */
const recentre = async () => {
  await keepAlive();
  await page.mouse.move(W * 0.5 + 70, H * 0.75);
  await page.waitForTimeout(140);
  await page.mouse.move(W * 0.5, H * 0.75);
  await page.waitForTimeout(900);
};

await recentre();
const centreU = await screenU();
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(650);
const heldRight = await screenU();     // sampled while held
await page.keyboard.up('ArrowRight');
check('key Right moves craft right', heldRight > centreU + 1.5,
  `screen-u ${centreU.toFixed(2)} → ${heldRight.toFixed(2)} while held`);

await keepAlive();
// --- 4. release holds position; an idle cursor can't steal it --------------
// Park the cursor hard over to one side first, so "where the keyboard left the
// craft" and "wherever the mouse is" are far apart and the assertion can tell
// them apart. Then steer with the keyboard and let go.
// Asserted on `u`, not screen x — the camera leans toward the action, so even
// a stationary craft drifts tens of pixels on screen.
await page.mouse.move(W * 0.15, H * 0.75);
await page.waitForTimeout(1200);
const cursorU = await u();
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(400);
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(400);
const settleU = await u();
await page.waitForTimeout(1600);
const heldU1 = await u();
check('key release holds position, not hijacked by the idle cursor',
  Math.abs(heldU1 - settleU) < 0.6 && Math.abs(heldU1 - cursorU) > 2,
  `u ${settleU} → ${heldU1} over 1.6s (cursor is parked at u=${cursorU})`);

// --- 5. moving the mouse again takes control back ---------------------------
await page.mouse.move(W * 0.2, H * 0.75);
await page.waitForTimeout(1000);
const reclaimedU = await u();
check('mouse move reclaims control', Math.abs(reclaimedU - heldU1) > 2,
  `u ${heldU1} → ${reclaimedU}`);

// --- 6. left key ------------------------------------------------------------
// Re-centre first: step 5 parked the craft against a wall limit, where it
// cannot move further in that direction and the check would prove nothing.
await recentre();
const beforeLeft = await screenU();
await page.keyboard.down('ArrowLeft');
await page.waitForTimeout(650);
const heldLeft = await screenU();      // sampled while held
await page.keyboard.up('ArrowLeft');
check('key Left moves craft left', heldLeft < beforeLeft - 1.5,
  `screen-u ${beforeLeft.toFixed(2)} → ${heldLeft.toFixed(2)} while held`);

// --- 7. the craft stays put after a release --------------------------------
// Self-centring is off by design: where the player parked the paddle is a
// decision, and undoing it would mean re-aiming after every press.
await recentre();
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(400);
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(400);            // let the hull settle
const parkedAt = await screenU();
await page.waitForTimeout(2000);
const stillAt = await screenU();
check('release leaves the craft where it was',
  Math.abs(parkedAt) > 2 && Math.abs(stillAt - parkedAt) < 0.15,
  `screen-u ${parkedAt.toFixed(2)} → ${stillAt.toFixed(2)} after 2s idle`);

await keepAlive();
// --- 8. a release stops the craft promptly ---------------------------------
// Holding leaves the hull with real velocity; letting go must bleed it off
// quickly rather than coasting on, then hold.
await recentre();
await page.keyboard.down('ArrowLeft');
await page.waitForTimeout(400);
await page.keyboard.up('ArrowLeft');
const coast = await record(1000);
const cm = (t) => Math.abs(at(coast, t));
check('release stops the craft, with only a little coast',
  cm(300) - cm(0) < 1.2 && Math.abs(cm(900) - cm(400)) < 0.15,
  `travelled ${(cm(300) - cm(0)).toFixed(2)} more after release, then held steady`);

await keepAlive();
// --- 9. hover-steer keeps tracking a held cursor ---------------------------
await page.mouse.move(W * 0.8, H * 0.75);
await page.waitForTimeout(1200);
const parked0 = await u();
await page.waitForTimeout(1600);
const parked1 = await u();
check('mouse hover holds position exactly',
  Math.abs(parked0) > 2 && Math.abs(parked1 - parked0) < 0.05,
  `u ${parked0} → ${parked1} over 1.6s with the cursor untouched`);

// --- 10. a press moves without stalling ------------------------------------
// The regression this exists for: a press used to fire a discrete step, then
// sit still through a start-up delay, then accelerate. Three events where the
// player asked for one, and it reads as the control snagging. Slice the first
// 400ms of a hold into 60ms windows — every one of them must show real motion.
await recentre();
const sgn = await sign();
const startCurve = await holdAndRecord('ArrowRight', 500);
const posAt = (t) => (startCurve.find((p) => p[0] >= t) || startCurve[startCurve.length - 1])[1] * sgn;
// Windows are skipped once the craft reaches its stop (a zero there is correct,
// not a stall) and while the game is in slow motion (that freeze is the hit-stop
// effect, not the control hesitating).
const limitU = await page.evaluate(() => window.__ballistix.game.crafts[0].limit);
const scaleAt = (t) => (startCurve.find((p) => p[0] >= t) || startCurve[startCurve.length - 1])[2];
const windows = [];
for (let t = 0; t < 360; t += 60) {
  if (posAt(t) > limitU - 0.6) break;
  const scale = Math.min(scaleAt(t), scaleAt(t + 60));
  if (scale < 0.9) continue;
  windows.push(+(posAt(t + 60) - posAt(t)).toFixed(2));
}
check('a held key moves continuously, with no stall',
  windows.length >= 2 && windows.every((d) => d > 0.35),
  `per-60ms displacement at full sim speed: [${windows.join(', ')}]`);

// --- 10b. a very short tap still registers ---------------------------------
// Shorter than a frame at 60Hz. Without the press latch the simulation never
// sees the key down at all and the input is silently dropped.
await recentre();
const before = await screenU();
await page.evaluate(() => {
  const fire = (t) => window.dispatchEvent(new KeyboardEvent(t, { code: 'ArrowRight', bubbles: true }));
  fire('keydown'); fire('keyup');           // same tick: down and up together
});
const flick = await record(400);
const flickPeak = Math.max(...flick.map(([, v]) => v * sgn));
check('a sub-frame tap is not dropped', flickPeak > before + 0.8,
  `peaked ${flickPeak.toFixed(2)} from ${before.toFixed(2)}`);

// --- 11. taps accumulate in even, small steps -------------------------------
// With nothing pulling the craft back, tapping is pure placement: each press
// must add ground, and the steps must be even enough to aim with.
await recentre();
const climbRaw = await tapLoop('ArrowRight', 8, 330);
const climb = climbRaw.map(([v]) => v * sgn);
const steps = [];
for (let i = 1; i < climb.length; i++) {
  if (climb[i - 1] > limitU - 0.8) break;          // pinned against the wall
  if (climbRaw[i][1] < 0.98) continue;             // hit-stop ate this interval
  steps.push(+(climb[i] - climb[i - 1]).toFixed(2));
}
const stepMax = Math.max(...steps);
check('taps accumulate in even steps',
  steps.length >= 3 && Math.min(...steps) > 0.5 && stepMax < 2.6,
  `per-tap steps at full sim speed: [${steps.join(', ')}]`);

check('a tap is a small step, not a lunge',
  stepMax < limit * 0.30,
  `largest step ${stepMax.toFixed(2)} on a ±${limit.toFixed(1)} wall `
  + `(${Math.round(stepMax / limit * 100)}% of half-width)`);

// Cadence must not change the outcome now that nothing claws back — a slow
// sequence of taps has to land in the same place as a fast one.
await recentre();
const slow = (await tapLoop('ArrowRight', 8, 700)).map(([v]) => v * sgn);
check('cadence does not change where taps take you',
  Math.abs(slow[slow.length - 1] - climb[climb.length - 1]) < 1.2,
  `fast ${climb[climb.length - 1].toFixed(2)} vs slow ${slow[slow.length - 1].toFixed(2)}`);

// --- 12. opposite taps walk it back ----------------------------------------
const beforeBack = await screenU();
const back = (await tapLoop('ArrowLeft', 6, 330)).map(([v]) => v * sgn);
check('opposite taps walk the craft back',
  back[back.length - 1] < beforeBack - 2,
  `screen-u ${beforeBack.toFixed(2)} → ${back[back.length - 1].toFixed(2)} over 6 left taps`);

// --- 13. holding crosses the wall quickly ----------------------------------
await recentre();
const holdCurve = await holdAndRecord('ArrowRight', 1600);
const reached = holdCurve.find(([, v]) => v * sgn > 7.0);
check('holding crosses to the wall quickly',
  !!reached, reached ? `reached the stop in ${reached[0]}ms`
    : `never reached it (best ${Math.max(...holdCurve.map(([, v]) => v * sgn)).toFixed(2)})`);

await keepAlive();
// --- 14-16. touch, in a phone-shaped context -------------------------------
// Playwright's touchscreen API only taps, so the drag is driven with synthetic
// PointerEvents. That exercises the handlers rather than the browser's gesture
// recogniser, which is where the logic we care about actually lives.
const touchCtx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true,
});
const tp = await touchCtx.newPage();
tp.on('pageerror', (e) => console.log('PAGEERROR(touch)', e.message));
await tp.goto(`${URL}?tier=0&dpr=1`, { waitUntil: 'load' });
await tp.waitForFunction(() => !document.getElementById('menu').classList.contains('hidden'), null, { timeout: 90000 });
await tp.tap('#playBtn');
await tp.waitForTimeout(5500);

const touchDrag = (xs) => tp.evaluate(async (points) => {
  const cv = document.getElementById('gl');
  const ev = (type, x, target) => target.dispatchEvent(new PointerEvent(type, {
    pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true,
    clientX: x, clientY: 700,
  }));
  ev('pointerdown', points[0], cv);
  for (const x of points) {
    ev('pointermove', x, window);
    await new Promise((r) => setTimeout(r, 40));
  }
  ev('pointerup', points[points.length - 1], window);
}, xs);

const tScreenX = () => tp.evaluate(() => {
  const a = window.__ballistix, c = a.game.crafts[0];
  const v = new (a.gcam.cam.position.constructor)(c.root.position.x, 0.92, c.root.position.z);
  v.project(a.gcam.cam);
  return Math.round((v.x * 0.5 + 0.5) * window.innerWidth);
});

await touchDrag([195, 160, 120, 80, 50]);
await tp.waitForTimeout(700);
const tLeft = await tScreenX();
await touchDrag([195, 230, 270, 310, 340]);
await tp.waitForTimeout(700);
const tRight = await tScreenX();
check('touch drag right moves craft right', tRight > tLeft + 30, `left→${tLeft}px  right→${tRight}px`);

// On `u` again, for the same reason as the keyboard checks: camera lean moves
// a stationary craft on screen.
const tU = () => tp.evaluate(() => +window.__ballistix.game.crafts[0].u.toFixed(2));
const settled = await tU();
await tp.waitForTimeout(1400);
const stillThere = await tU();
check('touch release holds position', Math.abs(stillThere - settled) < 0.15,
  `u ${settled} → ${stillThere} after release`);

// A tap (down/up with no movement) is the surge gesture.
await tp.evaluate(() => { window.__ballistix.game.crafts[0].surge = 1; });
await tp.evaluate(async () => {
  const cv = document.getElementById('gl');
  const mk = (type, target) => target.dispatchEvent(new PointerEvent(type, {
    pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true,
    clientX: 195, clientY: 700,
  }));
  mk('pointerdown', cv);
  await new Promise((r) => setTimeout(r, 60));
  mk('pointerup', window);
});
await tp.waitForTimeout(400);
const surged = await tp.evaluate(() => +window.__ballistix.game.crafts[0].surge.toFixed(2));
check('tap triggers surge', surged < 0.5, `surge charge now ${surged}`);

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
