import * as THREE from 'three';
import { ARENA, SIDES, PLAYERS } from '../core/config.js';
import { createEnergyFloor, arenaOutline, arenaPlanes } from '../gfx/floor.js';
import { ForceField } from '../gfx/forcefield.js';
import { StaticBatcher } from '../gfx/batch.js';
import { facilityMaterials } from '../gfx/materials.js';
import { rand, randInt } from '../core/math.js';

/**
 * Builds the playfield: deck, containment walls, the four goal barriers, the
 * chamfered bumpers, and every piece of set dressing hanging off the outside.
 *
 * The arena is a square with its corners cut off. That shape is doing real
 * work — a plain square traps orbs in its corners at shallow angles, and
 * chamfers turn those dead spots into the most dangerous part of the deck.
 */

const GOAL_LEN = 2 * (ARENA.half - ARENA.chamfer);
const BUMP_LEN = ARENA.chamfer * Math.SQRT2;
const WALL_T = 1.5;

export class Arena {
  /**
   * @param {THREE.Scene} scene
   * @param {import('../gfx/assets.js').AssetStore} assets
   */
  constructor(scene, assets, preset) {
    this.scene = scene;
    this.assets = assets;
    this.preset = preset;
    this.root = new THREE.Group();
    this.root.name = 'arena';
    scene.add(this.root);

    this.mats = facilityMaterials();
    this.planes = arenaPlanes();
    this.outline = arenaOutline();

    this._buildDeck();
    this._buildWalls();
    this._buildBarriers();
    this._buildSubstructure();
    this._buildDressing();
    this._buildLights();
  }

  // ------------------------------------------------------------------ deck --
  _buildDeck() {
    this.floor = createEnergyFloor(this.outline, this.preset, PLAYERS);
    this.root.add(this.floor.mesh);

    // A dark under-plate a hair below the deck stops the emissive layer from
    // looking like a floating decal when the camera drops low.
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(ARENA.half * 1.02, ARENA.half * 0.94, 1.1, 8, 1),
      new THREE.MeshStandardMaterial({ color: 0x090d15, metalness: 0.85, roughness: 0.55 }),
    );
    plate.rotation.y = Math.PI / 8;
    plate.position.y = -0.58;
    plate.receiveShadow = true;
    this.root.add(plate);
  }

  // ----------------------------------------------------------------- walls --
  _buildWalls() {
    const g = new THREE.Group();
    this.root.add(g);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a222f, metalness: 0.55, roughness: 0.62, envMapIntensity: 0.55,
    });
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x0d1a22, metalness: 0.6, roughness: 0.25,
      emissive: 0x1fb0d8, emissiveIntensity: 0.85,
    });
    this.railMat = railMat;

    const seg = (len, nx, nz, d, tint) => {
      const ry = Math.atan2(nx, nz);
      const cx = nx * (d + WALL_T * 0.5);
      const cz = nz * (d + WALL_T * 0.5);

      const body = new THREE.Mesh(new THREE.BoxGeometry(len, ARENA.wallH, WALL_T), bodyMat);
      body.position.set(cx, ARENA.wallH * 0.5, cz);
      body.rotation.y = ry;
      body.castShadow = true; body.receiveShadow = true;
      g.add(body);

      // Emissive cap rail — the arena's silhouette line.
      // Deliberately narrow: seen from a high camera a wide cap reads as a solid
      // slab of light and swallows the wall's form.
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.19, WALL_T * 0.26), railMat);
      rail.position.set(cx - nx * WALL_T * 0.3, ARENA.wallH + 0.04, cz - nz * WALL_T * 0.3);
      rail.rotation.y = ry;
      g.add(rail);

      // A recessed light strip just above the deck, facing inward.
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(len * 0.96, 0.1, 0.08),
        new THREE.MeshStandardMaterial({
          color: 0x081016, metalness: 0.3, roughness: 0.4,
          emissive: tint, emissiveIntensity: 1.15,
        }),
      );
      strip.position.set(nx * (d - 0.06), 0.34, nz * (d - 0.06));
      strip.rotation.y = ry;
      g.add(strip);
      return body;
    };

    // Goal walls sit behind their barrier; bumpers are live surfaces.
    for (let i = 0; i < 4; i++) {
      const s = SIDES[i];
      seg(GOAL_LEN, s.nx, s.nz, ARENA.half, PLAYERS[i].color);
    }
    const dDiag = (2 * ARENA.half - ARENA.chamfer) / Math.SQRT2;
    const s = Math.SQRT1_2;
    for (const [nx, nz] of [[s, s], [s, -s], [-s, -s], [-s, s]]) {
      seg(BUMP_LEN, nx, nz, dDiag, 0x36e0ff);
    }
  }

  // -------------------------------------------------------------- barriers --
  _buildBarriers() {
    this.fields = [];
    for (let i = 0; i < 4; i++) {
      const sd = SIDES[i];
      const ff = new ForceField(GOAL_LEN, ARENA.wallH * 1.15, PLAYERS[i].color);
      ff.mesh.position.set(sd.nx * (ARENA.half - 0.06), ARENA.wallH * 0.575, sd.nz * (ARENA.half - 0.06));
      ff.mesh.rotation.y = Math.atan2(sd.nx, sd.nz);
      ff.setNormal(sd.nx, 0, sd.nz);
      this.root.add(ff.mesh);
      this.fields.push(ff);
    }
  }

  // ---------------------------------------------------------- substructure --
  _buildSubstructure() {
    const A = this.assets;
    const batch = new StaticBatcher(this.mats);
    const tmp = new THREE.Group();

    const put = (name, x, y, z, ry = 0, sc = 1, rx = 0) => {
      const o = A.clone(name);
      o.position.set(x, y, z);
      o.rotation.set(rx, ry, 0);
      o.scale.setScalar(sc);
      tmp.add(o);
      return o;
    };

    // A ring of platform tiles under the deck edge, stepping down and out, so
    // the arena reads as a built structure rather than a floating disc.
    const R1 = ARENA.half + 1.6;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const jitter = rand(-0.4, 0.4);
      const r = R1 + jitter;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      put('platform_large', x, -1.1 + rand(-0.15, 0.15), z, a + Math.PI / 2, 1.6);
      if (i % 3 === 0) put('supports_high', x * 1.06, -2.7, z * 1.06, rand(0, 6.28), 1.5);
      if (i % 5 === 2) put('pipe_supportHigh', x * 1.13, -3.4, z * 1.13, a, 1.3);
    }

    // Deeper skeleton: long spars crossing beneath the deck.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      for (let j = 2; j < 13; j++) {
        put('platform_long', Math.cos(a) * j * 1.2, -2.2, Math.sin(a) * j * 1.2, a + Math.PI / 2, 1.5);
      }
      put('machine_generatorLarge', Math.cos(a) * 8, -3.0, Math.sin(a) * 8, a, 1.6);
    }

    // Hanging pipework, thinning out with depth.
    for (let i = 0; i < 22; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(3, ARENA.half);
      const depth = rand(-6.5, -3.2);
      put('pipe_straight', Math.cos(a) * r, depth, Math.sin(a) * r, rand(0, 6.28), rand(1.1, 2.0));
    }

    batch.add(tmp);
    batch.build(this.root, { name: 'substructure', castShadow: false, receiveShadow: false });
  }

  // -------------------------------------------------------------- dressing --
  _buildDressing() {
    const A = this.assets;
    const batch = new StaticBatcher(this.mats);
    const tmp = new THREE.Group();
    const put = (name, x, y, z, ry = 0, sc = 1) => {
      const o = A.clone(name);
      o.position.set(x, y, z);
      o.rotation.y = ry;
      o.scale.setScalar(sc);
      tmp.add(o);
      return o;
    };

    // ---- structural buttresses hugging the outside of each wall -----------
    const dDiag = (2 * ARENA.half - ARENA.chamfer) / Math.SQRT2;
    for (let i = 0; i < 4; i++) {
      const sd = SIDES[i];
      const ry = Math.atan2(sd.nx, sd.nz);
      const tx = -sd.nz, tz = sd.nx;             // tangent along the wall
      const out = ARENA.half + WALL_T + 0.35;
      const nSteps = 9;
      for (let k = 0; k < nSteps; k++) {
        const u = (k / (nSteps - 1) - 0.5) * (GOAL_LEN - 1.4);
        const x = sd.nx * out + tx * u;
        const z = sd.nz * out + tz * u;
        put(k % 2 ? 'structure' : 'structure_detailed', x, 0, z, ry, 1.5);
        if (k % 4 === 1) put('machine_wireless', x + sd.nx * 1.3, 1.5, z + sd.nz * 1.3, ry, 1.2);
      }
      // A continuous conduit along the top of the buttresses. Laid end to end
      // rather than as spaced pickets, which read as noise at this distance.
      const pipeLen = 1.5;
      const runs = Math.ceil((GOAL_LEN + 1.0) / pipeLen);
      for (let k = 0; k < runs; k++) {
        const u = (k / (runs - 1) - 0.5) * (GOAL_LEN + 1.0 - pipeLen);
        put('pipe_straight', sd.nx * (out + 0.5) + tx * u, 1.5, sd.nz * (out + 0.5) + tz * u,
          ry + Math.PI / 2, pipeLen);
      }
    }

    // ---- corner towers at the chamfers -------------------------------------
    const s = Math.SQRT1_2;
    const corners = [[s, s], [s, -s], [-s, -s], [-s, s]];
    corners.forEach(([nx, nz], ci) => {
      const ry = Math.atan2(nx, nz);
      const bx = nx * (dDiag + WALL_T + 1.1);
      const bz = nz * (dDiag + WALL_T + 1.1);
      put('pipe_ringHigh', bx, 0, bz, ry, 2.1);
      put('supports_high', bx + nx * 1.4, 0, bz + nz * 1.4, ry, 2.0);
      put('satelliteDish_large', bx + nx * 1.2, 3.0, bz + nz * 1.2, ry + rand(-0.6, 0.6), 2.4);
      put('turret_double', bx - nx * 1.9, 1.6, bz - nz * 1.9, ry + Math.PI, 1.9);
      put(ci % 2 ? 'barrels_rail' : 'barrels', bx + nx * 2.6, 0, bz + nz * 2.6, rand(0, 6.28), 1.7);
      put('container-tall', bx - nx * 3.4 + rand(-1, 1), 0, bz - nz * 3.4 + rand(-1, 1), rand(0, 6.28), 1.5);
    });

    // ---- outer support facilities -------------------------------------------
    // Eight discrete outposts on the diagonals rather than props scattered at
    // random radii. Randomised placement looked like debris; deliberate
    // clusters on a common pad read as a facility the arena belongs to.
    const outposts = [
      ['hangar_roundA', 3.2], ['hangar_smallB', 3.0], ['rocket_baseA', 2.4],
      ['machine_generatorLarge', 3.4], ['hangar_roundA', 2.8], ['hangar_smallB', 3.4],
      ['machine_generatorLarge', 3.0], ['rocket_baseA', 2.2],
    ];
    const clutter = ['container', 'container-tall', 'display-wall', 'computer-wide',
      'barrels', 'machine_generator', 'satelliteDish'];

    outposts.forEach(([main, mainScale], i) => {
      const a = (i / outposts.length) * Math.PI * 2 + Math.PI / 8;
      const R = ARENA.half + 13.5;
      const cx = Math.cos(a) * R, cz = Math.sin(a) * R;
      const facing = Math.atan2(-cx, -cz);           // turn to face the arena
      const py = -1.2;

      // Pad the outpost stands on, so nothing floats.
      for (let gx = -1; gx <= 1; gx++) {
        for (let gz = -1; gz <= 1; gz++) {
          const ox = Math.cos(facing) * gx * 3.2 - Math.sin(facing) * gz * 3.2;
          const oz = Math.sin(facing) * gx * 3.2 + Math.cos(facing) * gz * 3.2;
          put('platform_large', cx + ox, py, cz + oz, facing, 1.6);
        }
      }

      put(main, cx, py + 0.1, cz, facing, mainScale);
      for (let k = 0; k < 5; k++) {
        const ang = facing + rand(-2.4, 2.4);
        const rr = rand(4.2, 6.2);
        put(clutter[(i * 3 + k) % clutter.length],
          cx + Math.cos(ang) * rr, py + 0.1, cz + Math.sin(ang) * rr,
          rand(0, 6.28), rand(1.5, 2.4));
      }
      put('satelliteDish_large', cx + Math.cos(facing + 1.6) * 5.4, py + 0.1,
        cz + Math.sin(facing + 1.6) * 5.4, facing + rand(-0.5, 0.5), 2.6);
      put('supports_high', cx, py - 2.6, cz, facing, 3.0);
    });

    // ---- monorail loop, well outside the play space ------------------------
    // Pieces are 1 unit long, so the count is derived from circumference to
    // keep the rail continuous instead of a dotted line of blocks.
    const RM = ARENA.half + 26;
    const railScale = 3.0;
    const railCount = Math.ceil((2 * Math.PI * RM) / railScale);
    for (let i = 0; i < railCount; i++) {
      const a = (i / railCount) * Math.PI * 2;
      const x = Math.cos(a) * RM, z = Math.sin(a) * RM;
      put('monorail_trackStraight', x, -3.0, z, a + Math.PI / 2, railScale);
      if (i % 9 === 0) put('monorail_trackSupport', x, -7.2, z, a + Math.PI / 2, 9.0);
    }

    // ---- drifting rock field ------------------------------------------------
    const rocks = ['meteor', 'meteor_detailed', 'rock_largeA', 'rock_crystals', 'rock_crystalsLargeA'];
    for (let i = 0; i < 30; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(ARENA.half + 34, ARENA.half + 90);
      put(rocks[randInt(0, rocks.length - 1)],
        Math.cos(a) * r, rand(-26, -6), Math.sin(a) * r, rand(0, 6.28), rand(3, 9));
    }

    batch.add(tmp);
    this.dressMeshes = batch.build(this.root, { name: 'dressing', castShadow: false, receiveShadow: false });

    // Crystals should glow, so pull them out of the shadow-casting batch and
    // give them the emissive treatment separately.
    for (const m of this.dressMeshes) {
      if (m.name.endsWith(':crystal')) m.castShadow = false;
    }
  }

  // ---------------------------------------------------------------- lights --
  _buildLights() {
    // Key: one shadow caster, frustum tightened to the deck so every texel of
    // the map is spent on geometry the player can actually see.
    const key = new THREE.DirectionalLight(0xbfe0ff, 1.75);
    key.position.set(16, 30, 14);
    key.target.position.set(0, 0, 0);
    if (this.preset.shadows) {
      key.castShadow = true;
      const S = ARENA.half + 4;
      key.shadow.mapSize.set(this.preset.shadowSize, this.preset.shadowSize);
      key.shadow.camera.left = -S; key.shadow.camera.right = S;
      key.shadow.camera.top = S; key.shadow.camera.bottom = -S;
      key.shadow.camera.near = 8; key.shadow.camera.far = 70;
      key.shadow.bias = -0.0012;
      key.shadow.normalBias = 0.035;
      key.shadow.radius = 2.2;
    }
    this.root.add(key, key.target);
    this.keyLight = key;

    // Warm bounce standing in for the gas giant behind the arena.
    const rim = new THREE.DirectionalLight(0xff7a9e, 0.5);
    rim.position.set(-22, 8, -26);
    this.root.add(rim);

    // Cool fill from below — sells the deck as a light source in its own right.
    const under = new THREE.HemisphereLight(0x2a6a92, 0x0a0e18, 0.3);
    this.root.add(under);

    // Camera-relative fill. The key comes from up and behind the far wall,
    // which leaves whichever craft is nearest the camera — always the player's —
    // lit only from its far side and reading as a dark blob. A soft fill
    // riding the view direction fixes that without flattening the key.
    const fill = new THREE.DirectionalLight(0xcfe2ff, 0.75);
    fill.castShadow = false;
    this.root.add(fill, fill.target);
    this.fillLight = fill;
  }

  // ------------------------------------------------------------------- api --

  /** Lateral half-extent a paddle may travel on side `i`. */
  goalHalfWidth() { return ARENA.half - ARENA.chamfer; }

  hitBarrier(index, u, power) { this.fields[index].hit(u, 0.32, power); }
  sealBarrier(index) { this.fields[index].seal(); }
  setBarrierHealth(index, h) {
    this.fields[index].setHealth(h);
    this.floor.setTerritory(index, h);
  }

  shock(x, z, strength, color) { this.floor.addWave(x, z, strength, color); }
  setCharge(v) { this.floor.setCharge(v); }

  /** Keep the fill light behind the camera, aimed at the deck. */
  aimFill(camPos) {
    if (!this.fillLight) return;
    this.fillLight.position.set(camPos.x * 0.55, camPos.y * 0.45 + 6, camPos.z * 0.55);
  }

  update(dt, t) {
    this.floor.update(dt, t);
    for (const f of this.fields) f.update(dt, t);
    // Cap rails pulse gently so the arena never sits perfectly still.
    this.railMat.emissiveIntensity = 0.78 + Math.sin(t * 1.1) * 0.14;
  }

  dispose() {
    this.floor.dispose();
    for (const f of this.fields) f.dispose();
    this.root.traverse((o) => { if (o.isMesh) o.geometry?.dispose(); });
    this.scene.remove(this.root);
  }
}
