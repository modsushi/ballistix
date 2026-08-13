import * as THREE from 'three';
import { ARENA, ORB, PINBALL } from '../core/config.js';
import { bumperBody, slingWedge } from '../gfx/shapes.js';
import { clamp, rand } from '../core/math.js';

/**
 * Pinball furniture: four chaos well *sites*, one per quadrant on the diagonals
 * between the goals — of which exactly one is ever open.
 *
 * A well is two pop bumpers with a slingshot standing behind them. An orb that
 * wanders in bounces between the bumpers picking up speed, and the slingshot
 * eventually fires it back across the deck at a fixed, unmistakably violent
 * speed. The result is a small region of the deck where the ball's behaviour
 * stops being predictable — which is the point, and why none of the sites sits
 * on a goal axis. A well in front of someone's wall would be a random goal
 * generator rather than a feature you can play around.
 *
 * It surfaces, runs, sinks, and reopens at the *next* site along, so the
 * dangerous corner keeps moving. See `PINBALL` in config for the cycle and for
 * why stepping the site is what keeps a single live well fair.
 *
 * These are speed *sources*, so `ORB.bleed` exists to drain them; see the note
 * there. Without it a single well visit would permanently pin an orb at top
 * speed.
 */

/** Hazard amber — deliberately not one of the four team colours. */
export const ELEMENT_COLOR = 0xffa832;

// Deploy cycle.
const DOWN = 0, RISING = 1, UP = 2, FALLING = 3;

/** How far below the deck the elements park. The deck is opaque, so this only
 *  has to clear the tallest of them to hide the lot. */
const RETRACT_DEPTH = 2.0;

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _UP = new THREE.Vector3(0, 1, 0);

export class Pinball {
  constructor(scene, preset) {
    this.scene = scene;
    this.preset = preset;

    this.bumpers = [];
    this.slings = [];

    // One well per quadrant, on the diagonals.
    for (let k = 0; k < 4; k++) {
      const ang = Math.PI * 0.25 + k * Math.PI * 0.5;
      const ax = Math.cos(ang), az = Math.sin(ang);
      const tx = -az, tz = ax;

      for (const side of [-1, 1]) {
        this.bumpers.push({
          x: ax * PINBALL.wellR + tx * PINBALL.bumperGap * side,
          z: az * PINBALL.wellR + tz * PINBALL.bumperGap * side,
          r: PINBALL.bumperR, flash: 0, cool: 0, seed: Math.random(), well: k,
        });
      }

      const d = PINBALL.wellR + PINBALL.slingBack;
      this.slings.push({
        x: ax * d, z: az * d,
        nx: -ax, nz: -az,            // face looks back at the centre
        tx, tz,
        half: PINBALL.slingHalf, depth: PINBALL.slingDepth,
        flash: 0, cool: 0, seed: Math.random(), well: k,
      });
    }

    this._build();
    this.reset();
  }

  /** Keep-out circles for the brick layout. */
  obstacles() {
    const out = this.bumpers.map((b) => ({ x: b.x, z: b.z, r: b.r }));
    for (const s of this.slings) out.push({ x: s.x, z: s.z, r: s.half * 0.8 });
    return out;
  }

  // ----------------------------------------------------------------- build --
  _build() {
    const nB = this.bumpers.length, nS = this.slings.length;
    this.bumperState = new Float32Array(nB * 2);   // flash, seed
    this.slingState = new Float32Array(nS * 2);
    this._attrs = [];
    // One clock shared by every element material, so the idle pulses of a well
    // stay locked to each other.
    this._time = { value: 0 };

    // ---- bumper body -------------------------------------------------------
    // Very nearly a cylinder, flaring a little toward the cap. The taper is
    // chosen so the silhouette passes through the true collision radius at
    // y = ARENA.playY: the orb has to strike the widest part of the visible
    // body, or the bounce reads as happening in mid-air.
    this.bodyGeo = bumperBody(PINBALL.bumperR * 0.88, PINBALL.bumperR * 1.02, PINBALL.bumperH);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x243349, metalness: 0.86, roughness: 0.34, envMapIntensity: 1.0,
    });
    bodyMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this._time;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec2 aState;
          varying vec2 vState; varying vec3 vLocal;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vState = aState; vLocal = position;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform float uTime;
          varying vec2 vState; varying vec3 vLocal;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          {
            float y = vLocal.y / ${PINBALL.bumperH.toFixed(3)};
            float rad = length(vLocal.xz) / ${PINBALL.bumperR.toFixed(3)};
            // The cap is dark with a hot core, and there is a charge band just
            // beneath it. Lighting the whole cap turns the bumper into a
            // pancake from the match camera, which sits high enough to see it.
            float band = smoothstep(0.70, 0.78, y) * smoothstep(0.97, 0.90, y);
            float capFace = smoothstep(0.985, 1.0, y);
            // A target ring on the cap rather than a filled core — a lit disc
            // in the middle of a dark cap reads as a fried egg from above.
            float core = capFace * smoothstep(0.13, 0.0, abs(rad - 0.52));
            float idle = 0.55 + 0.45 * sin(uTime * 2.6 + vState.y * 6.28);
            vec3 c = vec3(1.0, 0.62, 0.18);
            diffuseColor.rgb *= 1.0 - capFace * 0.4;
            totalEmissiveRadiance += c * (band * (0.55 + idle * 0.5) + core * (1.1 + idle * 0.9));
            totalEmissiveRadiance += (c + vec3(1.0) * vState.x) * vState.x * (band * 2.6 + capFace * 1.6 + 0.25);
          }`);
    };
    bodyMat.customProgramCacheKey = () => 'bumper-body';
    this.bodyMat = bodyMat;

    this.body = new THREE.InstancedMesh(this.bodyGeo, bodyMat, nB);
    this._attr(this.bodyGeo, 'aState', this.bumperState, 2);
    this.body.castShadow = false;
    this.body.receiveShadow = true;
    this.body.frustumCulled = false;
    this.body.name = 'bumpers';

    // ---- bumper crown: the part that actually strikes the orb --------------
    // An open flared collar around the cap, sitting exactly on the collision
    // radius so the contact the player sees is the contact the sim ran.
    // Additive, so the pop reads as a discharge rather than as paint.
    this.crownGeo = new THREE.CylinderGeometry(
      PINBALL.bumperR * 1.06, PINBALL.bumperR * 0.94, 0.26, 22, 1, true,
    );
    this.crownGeo.translate(0, PINBALL.bumperH * 0.93, 0);
    this.crownMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: this._time },
      vertexShader: /* glsl */`
        attribute vec2 aState;
        varying vec2 vState; varying vec3 vNrm; varying vec3 vView;
        void main() {
          vState = aState;
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vNrm = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
          vView = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        precision mediump float;
        uniform float uTime;
        varying vec2 vState; varying vec3 vNrm; varying vec3 vView;
        void main() {
          float fres = pow(1.0 - abs(dot(normalize(vNrm), vView)), 1.6);
          float idle = 0.55 + 0.45 * sin(uTime * 2.6 + vState.y * 6.28);
          float a = clamp(0.14 + fres * 0.34 + idle * 0.12 + vState.x * 1.4, 0.0, 1.0);
          vec3 col = vec3(1.0, 0.66, 0.22) * (1.0 + vState.x * 2.0) + vec3(1.0) * vState.x;
          gl_FragColor = vec4(col * a * 1.35, a * 0.9);
        }`,
    });
    this.crown = new THREE.InstancedMesh(this.crownGeo, this.crownMat, nB);
    this._attr(this.crownGeo, 'aState', this.bumperState, 2);
    this.crown.frustumCulled = false;
    this.crown.renderOrder = 6;

    // ---- slingshot ---------------------------------------------------------
    this.slingGeo = slingWedge(PINBALL.slingHalf, PINBALL.slingDepth, PINBALL.slingH);
    // Matched to the brick shell, and with the environment turned down: the
    // wedge presents a big upward-facing surface to a warm sky, and at full
    // envMap strength it reads as a pale beige ramp lying on the deck.
    const slingMat = new THREE.MeshStandardMaterial({
      color: 0x131b27, metalness: 0.9, roughness: 0.36, envMapIntensity: 0.5,
    });
    slingMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this._time;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec2 aState;
          varying vec2 vState; varying vec3 vLocal;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vState = aState; vLocal = position;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform float uTime;
          varying vec2 vState; varying vec3 vLocal;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          {
            // The striking face is the plane at local z = 0. Two features
            // only: a blade up the face, and a rail along its top edge so the
            // element still reads from a camera looking down on it. Lighting
            // the whole face turns the wedge into a pale slab.
            float y = vLocal.y / ${PINBALL.slingH.toFixed(3)};
            float face = smoothstep(0.09, 0.0, abs(vLocal.z));
            float blade = face * smoothstep(0.34, 0.58, y);
            float rail = smoothstep(0.30, 0.0, vLocal.z) * smoothstep(0.72, 0.94, y);
            float pulse = 0.6 + 0.4 * sin(uTime * 3.1 + vState.y * 6.28);
            vec3 c = vec3(1.0, 0.58, 0.15);
            totalEmissiveRadiance += c * (blade * (0.75 + pulse * 0.5) + rail * (0.5 + pulse * 0.4));
            totalEmissiveRadiance += (c + vec3(1.0) * vState.x) * vState.x * (face * 2.6 + rail * 1.8 + 0.3);
          }`);
    };
    slingMat.customProgramCacheKey = () => 'sling-body';
    this.slingMat = slingMat;

    this.sling = new THREE.InstancedMesh(this.slingGeo, slingMat, nS);
    this._attr(this.slingGeo, 'aState', this.slingState, 2);
    this.sling.castShadow = false;
    this.sling.receiveShadow = true;
    this.sling.frustumCulled = false;
    this.sling.name = 'slings';

    this._placeInstances();
    this.scene.add(this.body, this.crown, this.sling);
  }

  _attr(geo, name, array, size) {
    const a = new THREE.InstancedBufferAttribute(array, size);
    a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(name, a);
    this._attrs.push(a);
    return a;
  }

  /** Seed the per-instance shader state. Transforms are written by `_applyLift`. */
  _placeInstances() {
    this.bumpers.forEach((b, i) => { this.bumperState[i * 2 + 1] = b.seed; });
    this.slings.forEach((sl, i) => { this.slingState[i * 2 + 1] = sl.seed; });
  }

  reset() {
    for (const b of this.bumpers) { b.flash = 0; b.cool = 0; }
    for (const s of this.slings) { s.flash = 0; s.cool = 0; }
    this.phase = DOWN;
    this.timer = PINBALL.downTime;
    this.lift = -RETRACT_DEPTH;
    this.well = Math.floor(Math.random() * 4);   // which site opens first
    this._warned = false;
    this.justDeployed = false;
    this.justRetracted = false;
    this.justWarned = false;
    this._applyLift();
  }

  /** True only while the elements are fully up and live. */
  get live() { return this.phase === UP; }

  /** The elements of the site that is currently open, for effects. */
  activeBumpers() { return this.bumpers.filter((b) => b.well === this.well); }
  activeSlings() { return this.slings.filter((s) => s.well === this.well); }

  /**
   * Where the furniture is in its cycle, as a 0..1 bar for the HUD: filling
   * while it is down and about to arrive, draining while it is up.
   */
  get cycle01() {
    if (this.phase === UP) return clamp(this.timer / PINBALL.upTime, 0, 1);
    if (this.phase === DOWN) return clamp(1 - this.timer / PINBALL.downTime, 0, 1);
    return this.phase === RISING ? 1 : 0;
  }

  /**
   * Slide the open site between its parked depth and the deck.
   *
   * Only one site is ever above the floor, so the instance matrices carry the
   * lift for the active well and collapse the other three to zero scale. It is
   * twelve matrix writes on a frame where the lift actually changed and none at
   * all otherwise — cheaper than three extra draw calls' worth of separate
   * meshes, and it keeps the whole thing at three draw calls regardless of
   * which site is open.
   */
  _applyLift() {
    const y = this.lift;
    const hidden = y <= -RETRACT_DEPTH + 1e-3;
    for (const m of [this.body, this.crown, this.sling]) {
      m.position.y = 0;
      m.visible = !hidden;
    }
    if (hidden) return;

    const m = _m, q = _q, p = _p, s = _s;
    this.bumpers.forEach((b, i) => {
      const on = b.well === this.well;
      p.set(b.x, ARENA.floorY + y, b.z);
      q.setFromAxisAngle(_UP, b.seed * Math.PI);
      s.setScalar(on ? 1 : 0);
      m.compose(p, q, s);
      this.body.setMatrixAt(i, m);
      this.crown.setMatrixAt(i, m);
    });
    this.slings.forEach((sl, i) => {
      const on = sl.well === this.well;
      p.set(sl.x, ARENA.floorY + y, sl.z);
      q.setFromAxisAngle(_UP, Math.atan2(-sl.nx, -sl.nz));
      s.setScalar(on ? 1 : 0);
      m.compose(p, q, s);
      this.sling.setMatrixAt(i, m);
    });
    this.body.instanceMatrix.needsUpdate = true;
    this.crown.instanceMatrix.needsUpdate = true;
    this.sling.instanceMatrix.needsUpdate = true;
  }

  /**
   * Advance the deploy cycle.
   *
   * Driven by real elapsed time rather than the match clock, unlike the brick
   * field: the wells are a rhythm the player learns to count against, and a
   * rhythm that stalls whenever an orb is being served would be unlearnable.
   */
  _cycle(dt) {
    this.justDeployed = false;
    this.justRetracted = false;
    this.justWarned = false;
    this.timer -= dt;

    switch (this.phase) {
      case DOWN:
        // The telegraph fires from inside the down phase, so the deck has time
        // to tell you something is coming before it punches through it.
        if (this.timer <= PINBALL.warnTime && !this._warned) {
          this._warned = true;
          // Step to the next site *before* the telegraph, so the ring that
          // warns you is the ring at the place it is actually about to open.
          this.well = (this.well + 1) % 4;
          this.justWarned = true;
        }
        if (this.timer <= 0) {
          this.phase = RISING; this.timer = PINBALL.riseTime;
          this._warned = false;
          this.justDeployed = true;
        }
        break;
      case RISING:
        if (this.timer <= 0) { this.phase = UP; this.timer = PINBALL.upTime; }
        break;
      case UP:
        if (this.timer <= 0) {
          this.phase = FALLING; this.timer = PINBALL.riseTime;
          this.justRetracted = true;
        }
        break;
      case FALLING:
        if (this.timer <= 0) { this.phase = DOWN; this.timer = PINBALL.downTime; }
        break;
    }

    let k = 1;   // 0 = parked below the deck, 1 = fully deployed
    if (this.phase === DOWN) k = 0;
    else if (this.phase === RISING) k = 1 - clamp(this.timer / PINBALL.riseTime, 0, 1);
    else if (this.phase === FALLING) k = clamp(this.timer / PINBALL.riseTime, 0, 1);
    // Ease out on the way up so they arrive with a snap, linear on the way
    // down so a retreat reads as mechanical rather than as a bounce.
    const e = this.phase === RISING ? 1 - Math.pow(1 - k, 3) : k;
    this.lift = -RETRACT_DEPTH * (1 - e);
    this._applyLift();
  }

  // ------------------------------------------------------------- collision --
  /**
   * Resolve the orb against every element. Called from inside the substep
   * loop; allocation-free and side-effect-free apart from element cooldowns.
   *
   * @returns {boolean} true if a contact was resolved
   */
  collide(o, events) {
    if (this.phase !== UP) return false;   // retracted, or still on its way
    const R0 = ORB.radius;

    // ---- pop bumpers -------------------------------------------------------
    for (const b of this.bumpers) {
      if (b.well !== this.well || b.cool > 0) continue;
      const dx = o.x - b.x, dz = o.z - b.z;
      const R = b.r + R0;
      const d2 = dx * dx + dz * dz;
      if (d2 > R * R) continue;

      const d = Math.sqrt(d2);
      let nx, nz;
      if (d > 1e-5) { nx = dx / d; nz = dz / d; }
      else {
        // Dead centre: eject back the way it came.
        const l = Math.hypot(o.vx, o.vz) || 1;
        nx = -o.vx / l; nz = -o.vz / l;
      }

      const speed = Math.hypot(o.vx, o.vz) || 1;
      const vn = (o.vx * nx + o.vz * nz) / speed;
      // Reflection blended toward pure radial ejection. A real pop bumper
      // throws the ball off its own face regardless of how it arrived; a
      // straight reflection lets a grazing orb skate around the shoulder and
      // the kick reads as a bug rather than a hit.
      let rx = o.vx / speed - 2 * vn * nx;
      let rz = o.vz / speed - 2 * vn * nz;
      let dirX = rx * 0.42 + nx * 0.72;
      let dirZ = rz * 0.42 + nz * 0.72;
      const a = Math.atan2(dirZ, dirX) + rand(-PINBALL.scatter, PINBALL.scatter);

      const sp = clamp(speed + PINBALL.kick, PINBALL.kickFloor, ORB.maxSpeed);
      o.vx = Math.cos(a) * sp;
      o.vz = Math.sin(a) * sp;
      o.speed = sp;
      o.x = b.x + nx * (R + 0.02);
      o.z = b.z + nz * (R + 0.02);
      o.registerImpact(-nx, -nz, 1.0);

      b.flash = 1;
      b.cool = PINBALL.cool;
      events.push({ type: 'bumper', x: o.x, z: o.z, nx, nz, speed: sp, el: b });
      return true;
    }

    // ---- slingshots --------------------------------------------------------
    // A slingshot is a solid box that happens to have one live face. Testing
    // only the face would let an orb arriving from the outer deck pass clean
    // through what is plainly a solid wedge — the collider has to be the whole
    // object, with the kick reserved for the front of it.
    for (const s of this.slings) {
      if (s.well !== this.well) continue;
      const rx = o.x - s.x, rz = o.z - s.z;
      const ln = rx * s.nx + rz * s.nz;         // + is out in front of the face
      const lt = rx * s.tx + rz * s.tz;         // along it
      if (ln < -s.depth - R0 || ln > R0) continue;
      if (Math.abs(lt) > s.half + R0) continue;

      const cn = clamp(ln, -s.depth, 0);
      const ct = clamp(lt, -s.half, s.half);
      const en = ln - cn, et = lt - ct;
      const d2 = en * en + et * et;

      let nn, nt, push;
      if (d2 > 1e-8) {
        if (d2 > R0 * R0) continue;
        const d = Math.sqrt(d2);
        nn = en / d; nt = et / d;
        push = R0 - d + 0.02;
      } else {
        // Centre inside the box: leave by the nearest face.
        const toFront = -ln, toBack = ln + s.depth, toSide = s.half - Math.abs(lt);
        if (toFront <= toBack && toFront <= toSide) { nn = 1; nt = 0; push = toFront + R0 + 0.02; }
        else if (toBack <= toSide) { nn = -1; nt = 0; push = toBack + R0 + 0.02; }
        else { nn = 0; nt = Math.sign(lt) || 1; push = toSide + R0 + 0.02; }
      }

      const nx = s.nx * nn + s.tx * nt;
      const nz = s.nz * nn + s.tz * nt;
      const approaching = o.vx * nx + o.vz * nz < 0;

      o.x += nx * push;
      o.z += nz * push;

      // Only the front face fires, and only at something coming at it.
      if (nn > 0.5 && approaching && s.cool <= 0) {
        const off = clamp(lt / s.half, -1, 1);
        let dirX = s.nx + s.tx * off * PINBALL.slingSpread;
        let dirZ = s.nz + s.tz * off * PINBALL.slingSpread;
        const l = Math.hypot(dirX, dirZ) || 1;
        const sp = PINBALL.slingSpeed;
        o.vx = (dirX / l) * sp;
        o.vz = (dirZ / l) * sp;
        o.speed = sp;
        o.registerImpact(-s.nx, -s.nz, 1.3);

        s.flash = 1;
        s.cool = PINBALL.cool;
        events.push({
          type: 'sling', x: o.x, z: o.z, nx: s.nx, nz: s.nz, speed: sp,
          u01: off * 0.5 + 0.5, el: s,
        });
        return true;
      }

      // Every other face is just furniture: bounce off it like a wall.
      if (approaching) {
        const vn = o.vx * nx + o.vz * nz;
        o.vx -= 2 * vn * nx;
        o.vz -= 2 * vn * nz;
        o.registerImpact(-nx, -nz, 0.5);
        events.push({ type: 'wall', orb: o, x: o.x, z: o.z, nx, nz, speed: o.speed, goal: -1 });
        return true;
      }
      return false;
    }

    return false;
  }

  // ---------------------------------------------------------------- update --
  update(dt, t) {
    if (this._time) this._time.value = t;
    this._cycle(dt);

    for (let i = 0; i < this.bumpers.length; i++) {
      const b = this.bumpers[i];
      b.cool = Math.max(0, b.cool - dt);
      b.flash = Math.max(0, b.flash - dt * 3.6);
      this.bumperState[i * 2] = b.flash;
    }
    for (let i = 0; i < this.slings.length; i++) {
      const s = this.slings[i];
      s.cool = Math.max(0, s.cool - dt);
      s.flash = Math.max(0, s.flash - dt * 3.0);
      this.slingState[i * 2] = s.flash;
    }
    for (const a of this._attrs) a.needsUpdate = true;
  }

  dispose() {
    this.bodyGeo.dispose(); this.crownGeo.dispose(); this.slingGeo.dispose();
    this.bodyMat.dispose(); this.crownMat.dispose(); this.slingMat.dispose();
    this.scene.remove(this.body, this.crown, this.sling);
  }
}
