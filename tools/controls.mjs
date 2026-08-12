/**
 * Asserts that the controls do what they say.
 *
 * Three things this catches, all of which shipped broken once:
 *   1. Direction — "right" must move the craft right *on screen*, for both the
 *      pointer and the keyboard. The wall offset `u` runs along the craft's
 *      tangent, which for the south wall points at -X, so any mapping built
 *      from world X is inverted.
 *   2. Device hand-off — releasing a steering key must return the craft to the
 *      centre of its wall, not snap it back to wherever a long-idle mouse
 *      cursor happens to be sitting.
 *   3. Range — the far edges of the mapping must actually reach the wall's
 *      limits.
 *   4. Scheme separation — directional controls (keys, stick) self-centre on
 *      release; positional ones (mouse, finger) hold where they put you.
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

/** Centre the craft with the mouse, then hand control to the keyboard. */
const recentre = async () => {
  await page.mouse.move(W * 0.5, H * 0.75);
  await page.waitForTimeout(1200);
};

await recentre();
const centreU = await screenU();
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(650);
const heldRight = await screenU();     // sampled while held: it springs back on release
await page.keyboard.up('ArrowRight');
check('key Right moves craft right', heldRight > centreU + 1.5,
  `screen-u ${centreU.toFixed(2)} → ${heldRight.toFixed(2)} while held`);

// --- 4. release returns to CENTRE, not to the parked cursor -----------------
// Park the cursor hard over to one side first, so "centre" and "wherever the
// mouse is" are far apart and the assertion can tell them apart. Then steer
// with the keyboard and let go: the craft must spring to the middle of its
// wall, not get hijacked back to the idle cursor.
// Asserted on `u`, not screen x — the camera leans toward the action, so even
// a stationary craft drifts tens of pixels on screen.
await page.mouse.move(W * 0.15, H * 0.75);
await page.waitForTimeout(1200);
const cursorU = await u();
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(400);
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(1600);
const heldU1 = await u();
check('key release returns to centre, not to the idle cursor',
  Math.abs(heldU1) < 0.4 && Math.abs(heldU1 - cursorU) > 2,
  `u → ${heldU1} after release (cursor is parked at u=${cursorU})`);

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

// --- 7. keys recentre on release --------------------------------------------
await recentre();
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(700);
await page.keyboard.up('ArrowRight');
const atEdge = await screenU();
await page.waitForTimeout(1600);
const returned = await screenU();
check('key release springs back to centre',
  Math.abs(atEdge) > 3 && Math.abs(returned) < 0.4,
  `screen-u ${atEdge.toFixed(2)} → ${returned.toFixed(2)}`);

// --- 8. the return must not be instant --------------------------------------
// A teleport to centre reads as a bug, not a spring. Sample mid-flight.
await page.keyboard.down('ArrowLeft');
await page.waitForTimeout(700);
await page.keyboard.up('ArrowLeft');
const start = await screenU();
await page.waitForTimeout(140);
const mid = await screenU();
check('return is animated, not instant',
  Math.abs(mid) < Math.abs(start) - 0.2 && Math.abs(mid) > 0.3,
  `screen-u ${start.toFixed(2)} → ${mid.toFixed(2)} after 140ms`);
await page.waitForTimeout(1400);

// --- 9. hover-steer is positional and must NOT recentre ---------------------
await page.mouse.move(W * 0.8, H * 0.75);
await page.waitForTimeout(1200);
const parked0 = await u();
await page.waitForTimeout(1600);
const parked1 = await u();
check('mouse hover holds position (no recentre)',
  Math.abs(parked0) > 2 && Math.abs(parked1 - parked0) < 0.2,
  `u ${parked0} → ${parked1} with cursor held off-centre`);

// --- 10-12. touch, in a phone-shaped context -------------------------------
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
