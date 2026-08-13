/**
 * Brick field audit.
 *
 * The layout is randomised per match, which means "it looked fine when I ran
 * it" is not evidence of anything. This re-rolls the field many times and
 * asserts the properties the rules actually depend on:
 *
 *   · four-fold rotational symmetry — every seat must face an identical field,
 *     because tools/balance.mjs reads seat win rates as the fairness signal and
 *     an asymmetric middle would poison that measurement permanently
 *   · nothing inside the serve keep-out, nothing out in the goal approach lanes
 *   · no block overlapping another block or a pinball element
 *   · the field is actually full (rejection sampling can quietly give up)
 *
 *   node tools/field.mjs [url] [rolls]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:5173/';
const ROLLS = Number(process.argv[3] || 40);

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({ viewport: { width: 640, height: 400 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

await page.goto(`${URL}?tier=0&dpr=0.6`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('menu').classList.contains('hidden'), { timeout: 90000 });

const report = await page.evaluate((rolls) => {
  const g = window.__ballistix.game;
  const F = g.bricks;
  // Empty when the pinball furniture is switched off in config.
  const obstacles = g.pinball?.obstacles() ?? [];
  const fails = [];
  const counts = [];
  const radii = [];

  const near = (a, b, eps = 1e-3) => Math.abs(a - b) < eps;

  for (let roll = 0; roll < rolls; roll++) {
    F.reset(obstacles);
    const bs = F.bricks;
    counts.push(bs.length);

    for (const b of bs) {
      radii.push(Math.hypot(b.x, b.z));

      // --- symmetry: this block rotated a quarter turn must be another block
      const rx = -b.z, rz = b.x;
      const hit = bs.find((o) => near(o.x, rx, 1e-3) && near(o.z, rz, 1e-3)
        && near(o.hw, b.hd, 1e-3) && near(o.hd, b.hw, 1e-3) && o.maxHp === b.maxHp);
      if (!hit) fails.push(`roll ${roll}: no 90° image of (${b.x.toFixed(2)}, ${b.z.toFixed(2)})`);

      // --- keep-outs
      const nearX = Math.max(0, Math.abs(b.x) - b.hw);
      const nearZ = Math.max(0, Math.abs(b.z) - b.hd);
      const far = Math.hypot(Math.abs(b.x) + b.hw, Math.abs(b.z) + b.hd);
      if (Math.hypot(nearX, nearZ) < 4.6 - 1e-6) fails.push(`roll ${roll}: block inside the serve keep-out`);
      if (far > 12.6 + 1e-6) fails.push(`roll ${roll}: block out at r=${far.toFixed(2)}`);

      for (const o of obstacles) {
        const cx = Math.max(-b.hw, Math.min(b.hw, o.x - b.x));
        const cz = Math.max(-b.hd, Math.min(b.hd, o.z - b.z));
        if (Math.hypot(o.x - b.x - cx, o.z - b.z - cz) < o.r) {
          fails.push(`roll ${roll}: block overlaps a pinball element`);
        }
      }
    }

    // --- pairwise overlap
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        const a = bs[i], b = bs[j];
        if (Math.abs(a.x - b.x) < a.hw + b.hw - 1e-6 && Math.abs(a.z - b.z) < a.hd + b.hd - 1e-6) {
          fails.push(`roll ${roll}: blocks ${i} and ${j} overlap`);
        }
      }
    }
  }

  return {
    rolls, counts: { min: Math.min(...counts), max: Math.max(...counts) },
    radius: { min: +Math.min(...radii).toFixed(2), max: +Math.max(...radii).toFixed(2) },
    elements: obstacles.length,
    fails: [...new Set(fails)].slice(0, 12),
    failCount: fails.length,
  };
}, ROLLS);

console.log(`rolls          : ${report.rolls}`);
console.log(`blocks placed  : ${report.counts.min}..${report.counts.max}`);
console.log(`block radii    : ${report.radius.min}..${report.radius.max}`);
console.log(`keep-out shapes: ${report.elements} pinball elements`);
console.log(report.failCount ? `\nFAILURES (${report.failCount}):\n${report.fails.join('\n')}` : '\nall checks passed');
console.log(errs.length ? `\nerrors:\n${errs.join('\n')}` : 'errors: none');

await browser.close();
process.exit(report.failCount || errs.length ? 1 : 0);
