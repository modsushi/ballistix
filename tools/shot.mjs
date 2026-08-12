/**
 * Screenshot harness. Drives the built game in a real Chrome (SwiftShader in
 * CI, hardware locally) and captures a few framings so visual regressions are
 * obvious without hand-testing on four devices.
 *
 *   node tools/shot.mjs [url] [outDir]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || '/tmp/shots';
fs.mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { name: 'desktop', width: 1440, height: 810, dpr: 1, mobile: false },
  { name: 'phone-portrait', width: 390, height: 844, dpr: 2, mobile: true },
  { name: 'phone-landscape', width: 844, height: 390, dpr: 2, mobile: true },
  { name: 'tablet', width: 1024, height: 768, dpr: 2, mobile: true },
];

const browser = await chromium.launch({
  channel: 'chrome',
  args: [
    '--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--enable-gpu-rasterization',
    '--disable-features=IsolateOrigins,site-per-process',
    '--autoplay-policy=no-user-gesture-required',
  ],
});

const logs = [];
for (const v of VIEWS) {
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: v.dpr,
    isMobile: v.mobile,
    hasTouch: v.mobile,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${v.name}] ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => logs.push(`[${v.name}] PAGEERROR: ${e.message}\n${e.stack}`));

  await page.goto(`${URL}?tier=${process.env.TIER ?? 2}&dpr=${v.dpr}`, { waitUntil: 'load' });

  // Wait for the menu to appear (i.e. loading finished).
  try {
    await page.waitForFunction(
      () => !document.getElementById('menu').classList.contains('hidden'),
      { timeout: 90000 },
    );
  } catch {
    logs.push(`[${v.name}] TIMEOUT waiting for menu`);
    await page.screenshot({ path: `${OUT}/${v.name}-stuck.png` });
    await ctx.close();
    continue;
  }

  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${v.name}-menu.png` });

  // Enter a match and let it run.
  await page.click('#playBtn');
  await page.waitForTimeout(6500);
  await page.screenshot({ path: `${OUT}/${v.name}-play.png` });

  await page.waitForTimeout(9000);
  await page.screenshot({ path: `${OUT}/${v.name}-play2.png` });

  // Force the result screen so its layout is captured at every viewport.
  await page.evaluate(() => {
    const a = window.__ballistix;
    a._onMatchEnd({
      order: [0, 2, 3, 1], finalScores: [3, 0, 0, 0],
      stats: { deflections: 41, bestChain: 12, knockouts: 2, duration: 143 },
    });
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${v.name}-result.png` });

  const diag = await page.evaluate(() => {
    const a = window.__ballistix;
    if (!a) return { err: 'no app' };
    return {
      tier: a.tier,
      renderScale: +a.renderScale.toFixed(2),
      state: a.game.state,
      scores: a.game.scores,
      orbs: a.game.activeOrbs().length,
      sceneCalls: a.stats.sceneCalls,
      sceneTris: a.stats.sceneTris,
      totalCalls: a.stats.totalCalls,
      progs: a.renderer.info.programs?.length,
      geoms: a.renderer.info.memory.geometries,
      texs: a.renderer.info.memory.textures,
      avgMs: +a.governor.avg.toFixed(2),
    };
  });
  logs.push(`[${v.name}] ${JSON.stringify(diag)}`);

  await ctx.close();
}

await browser.close();
console.log(logs.join('\n') || '(no console output)');
console.log(`\nshots -> ${OUT}`);
