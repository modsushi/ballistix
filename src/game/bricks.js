import * as THREE from 'three';
import { ARENA, BRICKS, ORB, PLAYERS } from '../core/config.js';
import { beveledSlab } from '../gfx/shapes.js';
import { clamp, rand } from '../core/math.js';

/**
 * The brick field: a ring of breakable blocks filling the middle of the deck.
 *
 * Three jobs, in order of importance to the match:
 *
 *   1. **Pacing.** Every contact sheds speed and changes direction, so an orb
 *      crossing the middle arrives at a goal later, slower and from an angle
 *      nobody planned. That is the whole point of the rework — the deck used
 *      to be a straight line between two pilots.
 *   2. **Scoring.** Shattering a block banks salvage for whoever last touched
 *      the orb. It is the only way to *gain* points, which gives the game an
 *      offence to balance against its defence.
 *   3. **Reading.** A block carries the tint of the pilot who last hit it, so
 *      a glance at the middle tells you who has been farming it.
 *
 * ### Layout
 *
 * Positions are random per match but always laid out with four-fold rotational
 * symmetry: one quadrant is sampled by rejection, then copied at 90°, 180° and
 * 270°. Every seat therefore faces an identical field. This is a fairness
 * requirement, not a stylistic one — `tools/balance.mjs` reads seat win rates
 * to find rule bias, and an asymmetric field would poison that measurement
 * permanently.
 *
 * Because every copy is a multiple of a quarter turn, a block that starts
 * axis-aligned stays axis-aligned, and collision stays a circle-vs-AABB test.
 *
 * ### Rendering
 *
 * Two instanced meshes over one shared beveled slab: an opaque PBR shell whose
 * emissive seams, cracks and hit flash are driven by per-instance attributes,
 * and an additive aura shell a few percent larger that gives the field its
 * bloom. Two draw calls for the whole thing, and the block never changes
 * geometry — damage is entirely shader-side, so there is no rebuild cost when
 * a block is chipped.
 */

const QUADRANTS = 4;

// Per-brick lifecycle. Everything starts DORMANT: the deck is empty at the
// opening whistle and grows its blocks a ring at a time as the match runs.
const LIVE = 0, BREAKING = 1, GONE = 2, REFORMING = 3, DORMANT = 4;

const NOISE = /* glsl */`
float bHash(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float bNoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(bHash(i), bHash(i + vec3(1,0,0)), f.x),
                 mix(bHash(i + vec3(0,1,0)), bHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bHash(i + vec3(0,0,1)), bHash(i + vec3(1,0,1)), f.x),
                 mix(bHash(i + vec3(0,1,1)), bHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}`;

/**
 * Shared between both passes: where the seam, the slot and the cracks live.
 *
 * The restraint here is deliberate and was arrived at the hard way. A block
 * lit generously over its whole top face reads as painted plastic, and 28 of
 * them turn the middle of the deck into a light table that the orb — the one
 * thing that must always be findable — disappears into. So the block is dark
 * machined metal carrying two thin light features, and the only thing that
 * ever gets *brighter* is damage.
 */
const SURFACE = /* glsl */`
  float hp = vState.x;             // 1 = pristine, 0 = one hit from gone
  float flash = vState.y;
  float seed = vState.z;

  float ex = abs(vLocal.x) * 2.0;  // 0 at the centre, 1 at the long edge
  float ez = abs(vLocal.z) * 2.0;
  float edge = max(ex, ez);

  // One hairline seam around the shoulder, and an inset panel on the top face
  // picked out by its outline rather than filled with light. The camera sits
  // high enough that the top face is most of what a block presents, so this is
  // the difference between machined hardware and a lit tile.
  float seam = smoothstep(0.60, 0.66, vLocal.y) * smoothstep(0.77, 0.71, vLocal.y)
             * smoothstep(0.86, 0.96, edge);

  float top = smoothstep(0.93, 1.0, vLocal.y);
  float inZ = step(ez, 0.52), inX = step(ex, 0.76);
  float outline = max(smoothstep(0.07, 0.0, abs(ez - 0.52)) * inX,
                      smoothstep(0.05, 0.0, abs(ex - 0.76)) * inZ);
  float panel = top * inZ * inX;
  float slot = top * outline;

  // Fissures open as hit points are spent, so damage is legible before a block
  // breaks. The threshold is *tight* — a wide one produces crazy paving over
  // the whole shell, which reads as a texture rather than as damage. Intensity
  // carries the severity instead: faint dark lines at first, glowing ones when
  // the block is one hit from gone.
  float damage = 1.0 - hp;
  vec3 q = (vLocal + seed * 7.3) * vec3(8.5, 3.6, 8.5);
  float n = bNoise(q) * 0.68 + bNoise(q * 2.6) * 0.32;
  float ridge = 1.0 - abs(n * 2.0 - 1.0);
  float crack = smoothstep(0.965, 0.998, ridge) * step(0.02, damage);
`;

export class BrickField {
  /**
   * @param {THREE.Scene} scene
   * @param {object} preset quality tier settings
   */
  constructor(scene, preset) {
    this.scene = scene;
    this.preset = preset;
    this.count = BRICKS.perQuadrant * QUADRANTS;
    this.bricks = [];
    this.liveCount = 0;
    this.spawned = 0;       // how many blocks have surfaced so far
    this._nextAt = 0;       // play time the next one is due
    this.justSpawned = [];  // drained by the caller each frame, for effects

    const { w, d, h } = BRICKS;
    this.geo = beveledSlab(w, d, h, BRICKS.bevel);
    this.auraGeo = beveledSlab(w + 0.16, d + 0.16, h + 0.10, BRICKS.bevel);

    // Per-instance state, shared by both passes.
    this.state = new Float32Array(this.count * 3);
    this.tint = new Float32Array(this.count * 3);
    this._attrs = [];

    this.shell = this._buildShell();
    this.aura = this._buildAura();
    scene.add(this.shell, this.aura);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._pos = new THREE.Vector3();
    this._scl = new THREE.Vector3();
    this._col = new THREE.Color();
  }

  // ----------------------------------------------------------------- build --
  _attr(geo, name, array, size) {
    const a = new THREE.InstancedBufferAttribute(array, size);
    a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(name, a);
    this._attrs.push(a);
    return a;
  }

  _buildShell() {
    this._attr(this.geo, 'aState', this.state, 3);
    this._attr(this.geo, 'aTint', this.tint, 3);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x131b27, metalness: 0.9, roughness: 0.34, envMapIntensity: 0.85,
    });
    const dim = new THREE.Vector3(BRICKS.w, BRICKS.h, BRICKS.d);

    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uDim = { value: dim };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec3 aState; attribute vec3 aTint;
          uniform vec3 uDim;
          varying vec3 vState; varying vec3 vTint; varying vec3 vLocal;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vState = aState; vTint = aTint;
          vLocal = vec3(position.x / uDim.x, position.y / uDim.y, position.z / uDim.z);`);

      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vState; varying vec3 vTint; varying vec3 vLocal;
          ${NOISE}`)
        // Grooves are polished; the shell around them is not.
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          {
            // Polish the top face only; the walls stay matte so the block
            // keeps a readable silhouette against a bright deck.
            roughnessFactor = mix(roughnessFactor, 0.16, smoothstep(0.92, 1.0, vLocal.y) * 0.55);
          }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          {
            ${SURFACE}
            // A fracture reads as heat: the block holds energy in, and loses
            // containment exactly where it is split.
            vec3 hot = vec3(1.0, 0.40, 0.11);
            vec3 glow = vTint * (seam * 0.5 + slot * 0.8 + panel * 0.07) * (0.32 + hp * 0.68);
            glow += hot * crack * (0.2 + damage * damage * 1.9);
            // The panel itself is darker than the shell around it, which is
            // what makes the outline read as an inset rather than a decal.
            diffuseColor.rgb *= 1.0 - panel * 0.45;
            glow += (vTint * 1.6 + vec3(1.0) * flash) * flash;
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.25,
              min(1.0, crack * (0.5 + damage)));
            totalEmissiveRadiance += glow;
          }`);
    };
    mat.customProgramCacheKey = () => 'brick-shell';
    this.shellMat = mat;

    const mesh = new THREE.InstancedMesh(this.geo, mat, this.count);
    mesh.name = 'bricks';
    mesh.frustumCulled = false;
    // The shadow map is baked once at load and blocks come and go, so a brick
    // in it would leave its shadow behind after it shattered.
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return mesh;
  }

  _buildAura() {
    this._attr(this.auraGeo, 'aState', this.state, 3);
    this._attr(this.auraGeo, 'aTint', this.tint, 3);

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uDim: { value: new THREE.Vector3(BRICKS.w, BRICKS.h, BRICKS.d) } },
      vertexShader: /* glsl */`
        attribute vec3 aState; attribute vec3 aTint;
        uniform vec3 uDim;
        varying vec3 vState; varying vec3 vTint; varying vec3 vLocal; varying vec3 vNrm; varying vec3 vView;
        void main() {
          vState = aState; vTint = aTint;
          vLocal = vec3(position.x / uDim.x, position.y / uDim.y, position.z / uDim.z);
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vNrm = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
          vView = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        precision mediump float;
        varying vec3 vState; varying vec3 vTint; varying vec3 vLocal; varying vec3 vNrm; varying vec3 vView;
        ${NOISE}
        void main() {
          ${SURFACE}
          // Silhouette-only: a fresnel rim so the aura hugs the block's edge
          // instead of fogging its faces.
          float fres = pow(1.0 - abs(dot(normalize(vNrm), vView)), 2.6);
          float a = fres * (0.13 + hp * 0.11) + seam * 0.20 + slot * 0.26;
          a += crack * damage * 0.5 + flash * 0.85;
          a = clamp(a, 0.0, 1.0);
          vec3 col = vTint * (1.0 + flash * 2.0) + vec3(1.0) * flash * 0.8;
          gl_FragColor = vec4(col * a * 1.1, a * 0.70);
        }`,
    });
    this.auraMat = mat;

    const mesh = new THREE.InstancedMesh(this.auraGeo, mat, this.count);
    mesh.name = 'bricks:aura';
    mesh.frustumCulled = false;
    mesh.renderOrder = 6;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return mesh;
  }

  // ---------------------------------------------------------------- layout --
  /**
   * Lay out a fresh field.
   *
   * @param {{x:number,z:number,r:number}[]} [obstacles]
   *   Keep-out circles — the pinball wells, so a block never spawns inside a
   *   bumper. Passed in rather than imported to keep the dependency one-way.
   */
  reset(obstacles = []) {
    const placed = [];
    const { w, d, innerR, outerR, minGap, wellClear } = BRICKS;

    const fits = (b) => {
      // Whole footprint inside the annulus, tested on the far corner and the
      // near edge rather than the centre — a block half in the keep-out is
      // exactly the block that ruins a serve.
      const far = Math.hypot(Math.abs(b.x) + b.hw, Math.abs(b.z) + b.hd);
      const nearX = Math.max(0, Math.abs(b.x) - b.hw);
      const nearZ = Math.max(0, Math.abs(b.z) - b.hd);
      if (far > outerR || Math.hypot(nearX, nearZ) < innerR) return false;

      for (const o of obstacles) {
        const cx = clamp(o.x - b.x, -b.hw, b.hw), cz = clamp(o.z - b.z, -b.hd, b.hd);
        if (Math.hypot(o.x - b.x - cx, o.z - b.z - cz) < o.r + wellClear) return false;
      }
      for (const p of placed) {
        if (Math.abs(b.x - p.x) < b.hw + p.hw + minGap &&
            Math.abs(b.z - p.z) < b.hd + p.hd + minGap) return false;
      }
      return true;
    };

    // Sample one quadrant; every accepted block is committed together with its
    // three rotated copies, so a candidate is also tested against its own
    // images near the quadrant seam.
    // The try budget is deliberately large. This runs once per match, and the
    // failure mode is invisible but real: at 900 tries `tools/field.mjs`
    // measured rolls that placed only 16 of the 28 blocks, because a late ring
    // has very little free annulus left to land in.
    let placedInQuad = 0;
    for (let tries = 0; tries < 6000 && placedInQuad < BRICKS.perQuadrant; tries++) {
      const a = rand(0, Math.PI * 0.5);
      // Uniform in area rather than in radius, or the field crowds the middle.
      const r = Math.sqrt(rand(innerR * innerR, outerR * outerR));
      const flip = Math.random() < 0.5;
      const cand = [];
      let x = Math.cos(a) * r, z = Math.sin(a) * r;
      let hw = (flip ? d : w) * 0.5, hd = (flip ? w : d) * 0.5;

      let ok = true;
      for (let k = 0; k < QUADRANTS; k++) {
        const b = { x, z, hw, hd, rot: hw < hd ? Math.PI / 2 : 0 };
        if (!fits(b)) { ok = false; break; }
        cand.push(b);
        // Rotate a quarter turn: (x, z) -> (-z, x), and the footprint with it.
        const nx = -z; z = x; x = nx;
        const nhw = hd; hd = hw; hw = nhw;
      }
      if (!ok) continue;
      // Every accepted block is committed together with its three rotated
      // copies, so the finished layout is four-fold symmetric.
      for (const b of cand) placed.push({ ...b, group: placedInQuad });
      placedInQuad++;
    }

    // Blocks surface one at a time, in exactly this order — which walks the
    // quadrants, because `placed` interleaves each block with its own rotated
    // copies. The field is therefore back to perfect symmetry every fourth
    // spawn and never more than three blocks away from it.
    this.spawned = 0;
    this._nextAt = BRICKS.spawnFirst;
    this.justSpawned = [];

    this.bricks = placed.map((b, i) => {
      const radius = Math.hypot(b.x, b.z);
      const maxHp = radius < BRICKS.hpSplit ? BRICKS.hpInner : BRICKS.hpOuter;
      return {
        i, x: b.x, z: b.z, hw: b.hw, hd: b.hd, rot: b.rot, group: b.group,
        hp: maxHp, maxHp, phase: DORMANT, timer: 0, anim: 0,
        flash: 0, spin: 0, seed: Math.random(), by: -1,
      };
    });

    // Any unused instance is parked at zero scale.
    for (let i = this.bricks.length; i < this.count; i++) {
      this._writeInstance(i, 0, 0, 0, 0, 0);
      this.state[i * 3] = 0; this.state[i * 3 + 1] = 0; this.state[i * 3 + 2] = 0;
    }
    for (const b of this.bricks) this._tint(b, -1);
    this.liveCount = 0;
    this._sync();
  }

  /**
   * Bring one block up out of the deck.
   *
   * `liveCount` is incremented here rather than when the rise finishes, so it
   * counts slots *claimed* rather than slots occupied. The cap is checked
   * against it, and a block that is still on its way up has already taken its
   * place — counting it late would let the field admit more than `maxLive`
   * during the second or so that several are arriving.
   */
  _surface(index) {
    const b = this.bricks[index];
    if (!b || b.phase !== DORMANT) return false;
    b.phase = REFORMING;
    b.anim = 0;
    b.flash = 0.85;
    this.liveCount++;
    this.justSpawned.push(b);
    return true;
  }

  /**
   * The blocks that are actually standing and collidable, for anything that
   * needs to place itself around them. Exposed as a method rather than by
   * letting callers test `phase` themselves — the lifecycle constants are this
   * module's business.
   */
  standing() { return this.bricks.filter((b) => b.phase === LIVE); }

  /** Colour a block for the pilot who last struck it. */
  _tint(b, pilot) {
    b.by = pilot;
    this._col.set(pilot >= 0 ? PLAYERS[pilot].color : 0x4fd6ff).convertSRGBToLinear();
    const o = b.i * 3;
    this.tint[o] = this._col.r; this.tint[o + 1] = this._col.g; this.tint[o + 2] = this._col.b;
  }

  // ------------------------------------------------------------- collision --
  /**
   * Circle-vs-AABB against every live block. Called from inside the orb
   * substep loop, so it must stay allocation-free.
   *
   * Mutates hit points (the alternative — reporting a hit and applying it
   * later — would let a single substep hit the same block twice) but pushes
   * everything else to `events` for the caller to turn into spectacle.
   *
   * @returns {boolean} true if a contact was resolved this substep
   */
  collide(o, events) {
    const R = ORB.radius;
    for (const b of this.bricks) {
      if (b.phase !== LIVE) continue;
      const dx = o.x - b.x, dz = o.z - b.z;
      if (Math.abs(dx) > b.hw + R || Math.abs(dz) > b.hd + R) continue;

      const cx = clamp(dx, -b.hw, b.hw), cz = clamp(dz, -b.hd, b.hd);
      let ex = dx - cx, ez = dz - cz;
      const d2 = ex * ex + ez * ez;

      let nx, nz, push;
      if (d2 > 1e-8) {
        if (d2 > R * R) continue;
        const d = Math.sqrt(d2);
        nx = ex / d; nz = ez / d;
        push = R - d + 0.02;
      } else {
        // Centre inside the box (only reachable at absurd speeds): eject along
        // whichever axis is closest to a face.
        const ox = b.hw - Math.abs(dx), oz = b.hd - Math.abs(dz);
        if (ox < oz) { nx = Math.sign(dx) || 1; nz = 0; push = ox + R + 0.02; }
        else { nx = 0; nz = Math.sign(dz) || 1; push = oz + R + 0.02; }
      }

      const vn = o.vx * nx + o.vz * nz;
      if (vn < 0) {
        o.vx -= 2 * vn * nx;
        o.vz -= 2 * vn * nz;
      }
      o.x += nx * push;
      o.z += nz * push;

      // Bricks are the brake: every contact takes speed off the orb.
      const speed = Math.max(ORB.baseSpeed * 0.72, Math.hypot(o.vx, o.vz) - BRICKS.slow);
      const l = Math.hypot(o.vx, o.vz) || 1;
      o.vx = (o.vx / l) * speed;
      o.vz = (o.vz / l) * speed;
      o.speed = speed;
      o.registerImpact(-nx, -nz, 0.7);

      const by = o.lastHitBy;
      this._tint(b, by);
      b.flash = 1;
      b.hp--;

      if (b.hp <= 0) {
        b.phase = BREAKING;
        b.anim = 0;
        b.spin = rand(-1, 1) * 3.4;
        this.liveCount--;
        events.push({
          type: 'brickbreak', x: b.x, z: b.z, nx, nz, by, speed,
          tint: by >= 0 ? PLAYERS[by].color : 0x4fd6ff, maxHp: b.maxHp,
        });
      } else {
        events.push({
          type: 'brickhit', x: o.x, z: o.z, nx, nz, by, speed,
          tint: by >= 0 ? PLAYERS[by].color : 0x4fd6ff, hp01: b.hp / b.maxHp,
        });
      }
      return true;    // one block per substep; the next substep catches the rest
    }
    return false;
  }

  // ----------------------------------------------------------------- update --
  /**
   * @param {number} dt
   * @param {number} playTime elapsed play time; drives which rings have
   *   surfaced. Read from the match clock rather than accumulated locally so
   *   the field's schedule lines up with the orb schedule and both stop dead
   *   during a serve, a knockout or a pause.
   */
  update(dt, playTime = 0, aliveCount = 4) {
    this.justSpawned.length = 0;
    const cap = Math.min(BRICKS.maxLive, BRICKS.perAlive * aliveCount);

    // One block per interval, never a catch-up burst. The next slot is timed
    // from the spawn that actually happened rather than from a fixed schedule,
    // so a spawn deferred by the population cap doesn't cause several to
    // arrive at once the moment room appears — and the attract demo, which
    // starts 40 seconds into the match clock, fills in the same paced way a
    // real match does instead of dumping its whole field on the first frame.
    if (this.spawned < this.bricks.length && playTime >= this._nextAt
        && this.liveCount < cap) {
      if (this._surface(this.spawned)) this.spawned++;
      this._nextAt = Math.max(playTime, this._nextAt) + BRICKS.spawnEvery;
    }

    for (const b of this.bricks) {
      b.flash = Math.max(0, b.flash - dt * 4.4);

      switch (b.phase) {
        case BREAKING:
          b.anim += dt / BRICKS.breakTime;
          if (b.anim >= 1) { b.phase = GONE; b.timer = BRICKS.regen; }
          break;
        case GONE:
          b.timer -= dt;
          // A block whose timer is up waits for a free slot rather than
          // pushing the field over its ceiling.
          if (b.timer <= 0 && this.liveCount < cap) {
            b.phase = REFORMING; b.anim = 0; b.flash = 0.85;
            this.liveCount++;
          }
          break;
        case REFORMING:
          b.anim += dt / BRICKS.reformTime;
          if (b.anim >= 1) {
            b.phase = LIVE; b.hp = b.maxHp; b.anim = 0;
            this._tint(b, -1);
          }
          break;
      }
    }
    this._sync();
  }

  /** Push per-brick state into the two instanced meshes. */
  _sync() {
    for (const b of this.bricks) {
      let sx = 1, sy = 1, spin = 0, lift = 0, hp01 = b.hp / b.maxHp;

      if (b.phase === BREAKING) {
        const k = b.anim;
        // Swell, then collapse — a block that simply shrinks reads as a fade.
        const s = k < 0.22 ? 1 + k * 0.9 : Math.max(0, 1.2 - (k - 0.22) * 1.54);
        sx = s; sy = s * (1 - k * 0.55);
        spin = b.spin * k * k;
        lift = k * k * 0.6;
        hp01 = 0;
      } else if (b.phase === GONE || b.phase === DORMANT) {
        sx = 0; sy = 0;
      } else if (b.phase === REFORMING) {
        const k = b.anim;
        const e = 1 - Math.pow(1 - k, 3);
        // Rises out of the deck and overshoots a touch on arrival.
        sx = e * (1 + Math.sin(k * Math.PI) * 0.14);
        sy = e;
        lift = -(1 - e) * BRICKS.h;
        hp01 = 1;
      }

      const o = b.i * 3;
      this.state[o] = hp01;
      this.state[o + 1] = Math.min(1, b.flash);
      this.state[o + 2] = b.seed;
      this._writeInstance(b.i, b.x, b.z, b.rot + spin, sx, sy, lift);
    }

    this.shell.instanceMatrix.needsUpdate = true;
    this.aura.instanceMatrix.needsUpdate = true;
    for (const a of this._attrs) a.needsUpdate = true;
  }

  _writeInstance(i, x, z, rot, sx, sy, lift = 0) {
    this._pos.set(x, ARENA.floorY + lift, z);
    this._q.setFromAxisAngle(_UP, rot);
    this._scl.set(sx, sy, sx);
    this._m.compose(this._pos, this._q, this._scl);
    this.shell.setMatrixAt(i, this._m);
    this.aura.setMatrixAt(i, this._m);
  }

  dispose() {
    this.geo.dispose(); this.auraGeo.dispose();
    this.shellMat.dispose(); this.auraMat.dispose();
    this.scene.remove(this.shell, this.aura);
  }
}

const _UP = new THREE.Vector3(0, 1, 0);
