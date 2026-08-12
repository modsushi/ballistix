/**
 * Reports where the arena's silhouette actually lands in NDC, per viewport.
 *
 * The framing solve is iterative and its constraints are easy to reason about
 * wrongly, so this prints the real numbers: how close each edge comes to the
 * screen, what is clipped, and — critically — whether anything the player must
 * see (their goal line, their craft, every rival) has fallen off.
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://127.0.0.1:4173/';
const VIEWS = [
  ['desktop  ', 1440, 810], ['ultrawide', 1720, 720],
  ['portrait ', 390, 844], ['landscape', 844, 390], ['tablet   ', 1024, 768],
];

const b = await chromium.launch({ channel: 'chrome',
  args: ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader'] });

for (const [name, w, h] of VIEWS) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto(`${URL}?tier=0&dpr=1`, { waitUntil: 'load' });
  await p.waitForFunction(() => !document.getElementById('menu').classList.contains('hidden'), null, { timeout: 90000 });
  await p.click('#playBtn');
  await p.waitForTimeout(6000);

  const r = await p.evaluate(() => {
    const a = window.__ballistix, g = a.game, cam = a.gcam.cam;
    const V = cam.position.constructor;
    const nd = (x, y, z) => new V(x, y, z).project(cam);
    const A = { half: 13.6, chamfer: 5.0, wallH: 2.9, playY: 0.92 };
    const e = A.half - A.chamfer;

    const ring = [[-e, A.half], [e, A.half], [A.half, e], [A.half, -e],
                  [e, -A.half], [-e, -A.half], [-A.half, -e], [-A.half, e]];
    let minX = 9, maxX = -9, minY = 9, maxY = -9;
    for (const [x, z] of ring) {
      const v = nd(x, 0, z);
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    }
    // Everything the player must be able to see.
    const goal = [-e, 0, e].map((x) => nd(x, 0, A.half).y);
    const crafts = g.crafts.map((c) => {
      const v = nd(c.root.position.x, 1.4, c.root.position.z);
      return { id: c.index, x: +v.x.toFixed(2), y: +v.y.toFixed(2),
               onScreen: Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 };
    });
    return {
      deckX: [+minX.toFixed(2), +maxX.toFixed(2)],
      deckY: [+minY.toFixed(2), +maxY.toFixed(2)],
      goalLineY: goal.map((v) => +v.toFixed(2)),
      crafts, dist: +a.gcam.distance.toFixed(1),
      elev: Math.round(a.gcam.elevation * 180 / Math.PI),
    };
  });

  const clipX = Math.max(Math.abs(r.deckX[0]), Math.abs(r.deckX[1])) > 1;
  const off = r.crafts.filter((c) => !c.onScreen).map((c) => `P${c.id}`);
  console.log(`${name} ${String(w).padStart(4)}x${String(h).padStart(3)}  ` +
    `deck x[${r.deckX}] y[${r.deckY}]  goalY ${r.goalLineY}  ` +
    `${clipX ? 'sides CLIP' : 'sides inside'}  dist=${r.dist} elev=${r.elev}°  ` +
    `craftOff:${off.length ? off.join(',') : 'none'}`);
  await p.context().close();
}
await b.close();
