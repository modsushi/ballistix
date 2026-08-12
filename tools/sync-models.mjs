/**
 * Extracts exactly the models listed in `src/gfx/manifest.js` from the Kenney
 * zips into `public/models/`, and deletes anything there that isn't on the list.
 *
 * The kits ship ~250 models between them; we place about 45. Everything in
 * `public/` is copied verbatim into `dist/`, so without this the deployed
 * bundle carries ~3MB of GLBs no one ever requests.
 *
 *   node tools/sync-models.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MANIFEST, SPACE, STATION } from '../src/gfx/manifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const zips = {
  [SPACE]: {
    file: 'assets/kenney_space-kit.zip',
    inner: 'Models/GLTF format',
    out: 'public/models/space',
  },
  [STATION]: {
    file: 'assets/kenney_space-station-kit.zip',
    inner: 'Models/GLB format',
    out: 'public/models/station',
  },
};

const wanted = new Map();          // outDir -> Set<filename>
for (const [name, dir] of MANIFEST) {
  const z = zips[dir];
  if (!z) throw new Error(`unknown model dir: ${dir}`);
  if (!wanted.has(z.out)) wanted.set(z.out, new Set());
  wanted.get(z.out).add(`${name}.glb`);
}

let extracted = 0;
let removed = 0;

for (const [dir, z] of Object.entries(zips)) {
  const outAbs = path.join(root, z.out);
  const names = wanted.get(z.out) ?? new Set();
  fs.mkdirSync(outAbs, { recursive: true });

  const missing = [...names].filter((n) => !fs.existsSync(path.join(outAbs, n)));
  if (missing.length) {
    // -j flattens, -o overwrites. One invocation for the whole batch.
    execFileSync('unzip', [
      '-o', '-j', path.join(root, z.file),
      ...missing.map((n) => `${z.inner}/${n}`),
      '-d', outAbs,
    ], { stdio: 'pipe' });
    extracted += missing.length;
  }

  for (const f of fs.readdirSync(outAbs)) {
    if (f === 'Textures') continue;
    if (!names.has(f)) {
      fs.rmSync(path.join(outAbs, f), { recursive: true, force: true });
      removed++;
    }
  }
}

// The station kit's GLBs reference Textures/colormap.png relative to themselves.
const texDir = path.join(root, 'public/models/station/Textures');
const texFile = path.join(texDir, 'colormap.png');
if (!fs.existsSync(texFile)) {
  fs.mkdirSync(texDir, { recursive: true });
  execFileSync('unzip', [
    '-o', '-j', path.join(root, zips[STATION].file),
    'Models/Textures/colormap.png', 'Models/GLB format/colormap.png',
    '-d', texDir,
  ], { stdio: 'pipe' });
}

const size = (d) => fs.readdirSync(d, { recursive: true })
  .map((f) => path.join(d, f))
  .filter((f) => fs.statSync(f).isFile())
  .reduce((n, f) => n + fs.statSync(f).size, 0);

console.log(`extracted ${extracted}, removed ${removed}`);
console.log(`public/models is now ${(size(path.join(root, 'public/models')) / 1024).toFixed(0)} KB `
  + `across ${MANIFEST.length} models`);
