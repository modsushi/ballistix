import * as THREE from 'three';
import { ARENA, BLACKHOLE } from '../core/config.js';
import { clamp, rand } from '../core/math.js';

/**
 * The singularity: one black hole, occasionally, somewhere off-centre.
 *
 * While it is open, every orb inside its reach is pulled toward it and its path
 * bends into an arc. See `BLACKHOLE` in config for why it turns orbs without
 * accelerating them, why it provably cannot capture one, and how it stays fair
 * given that a single object cannot be symmetric.
 *
 * ### Rendering
 *
 * Four layers, and none of them is a screen-space distortion — real lensing
 * would mean another full-screen pass in a chain that already has twelve, for
 * an effect the player sees for eleven seconds every minute. The illusion is
 * carried instead by:
 *
 *   · a genuinely black core that occludes everything behind it
 *   · a photon ring: a hard fresnel rim on that core, which is the single most
 *     recognisable feature of the real thing
 *   · an accretion disc of spiralling noise, hot at the inner edge
 *   · a faint boundary ring on the deck at the exact radius of the pull, so the
 *     reach is legible and the mechanic is something you can play around rather
 *     than something that happens to you
 */

const CLOSED = 0, WARNING = 1, OPENING = 2, OPEN = 3, CLOSING = 4;

const NOISE = /* glsl */`
float hHash(vec2 p){ p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float hNoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hHash(i), hHash(i + vec2(1,0)), f.x),
             mix(hHash(i + vec2(0,1)), hHash(i + vec2(1,1)), f.x), f.y);
}`;

export class BlackHole {
  constructor(scene, preset) {
    this.scene = scene;
    this.preset = preset;

    this.x = 0; this.z = 0;
    this.phase = CLOSED;
    this.timer = BLACKHOLE.first;
    this.strength = 0;        // 0..1, multiplies the pull *and* the visuals
    this.quadrant = Math.floor(Math.random() * 4);
    this.justWarned = false;
    this.justOpened = false;
    this.justClosed = false;
    this._warned = false;

    this.root = new THREE.Group();
    this.root.visible = false;
    scene.add(this.root);

    this._time = { value: 0 };
    this._amount = { value: 0 };
    this._build();
  }

  // ----------------------------------------------------------------- build --
  _build() {
    // ---- core: black, opaque, with a photon ring on its silhouette ---------
    this.coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: this._time, uAmount: this._amount },
      vertexShader: /* glsl */`
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        precision highp float;
        varying vec3 vN; varying vec3 vV;
        uniform float uTime; uniform float uAmount;
        void main() {
          float fres = clamp(1.0 - abs(dot(normalize(vN), vV)), 0.0, 1.0);
          // Two rings: a hard photon ring right on the limb and a softer
          // halo just outside it. Everything inside stays absolutely black,
          // which is what makes it read as a hole rather than a dark ball.
          float ring = pow(fres, 9.0) * 3.4 + pow(fres, 3.4) * 0.5;
          vec3 col = mix(vec3(1.0, 0.72, 0.36), vec3(0.75, 0.85, 1.0),
                         0.5 + 0.5 * sin(uTime * 1.7));
          gl_FragColor = vec4(col * ring * uAmount * 2.2, 1.0);
        }`,
    });
    this.core = new THREE.Mesh(new THREE.IcosahedronGeometry(BLACKHOLE.coreR, 4), this.coreMat);
    this.core.renderOrder = 8;

    // ---- accretion disc ----------------------------------------------------
    const discGeo = new THREE.RingGeometry(BLACKHOLE.coreR * 1.05, BLACKHOLE.discR, 72, 3);
    discGeo.rotateX(-Math.PI / 2);
    this.discMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: this._time, uAmount: this._amount },
      vertexShader: `varying vec2 vP; void main(){ vP = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        precision mediump float;
        varying vec2 vP;
        uniform float uTime; uniform float uAmount;
        ${NOISE}
        void main() {
          float r = length(vP);
          float a = atan(vP.y, vP.x);
          float rn = clamp((r - ${BLACKHOLE.coreR.toFixed(3)}) /
                           ${(BLACKHOLE.discR - BLACKHOLE.coreR).toFixed(3)}, 0.0, 1.0);

          // Differential rotation — the inner edge laps the outer one, which is
          // what makes it read as falling in rather than as a spinning decal.
          float swirl = a * 2.0 + r * 3.4 - uTime * (5.2 - rn * 3.0);
          float streak = 0.5 + 0.5 * sin(swirl);
          float turb = hNoise(vec2(swirl * 1.6, r * 5.0 - uTime * 1.4));
          float body = mix(streak, turb, 0.45);

          // Hot and tight at the inner edge, cool and thin at the rim.
          float fall = smoothstep(1.0, 0.15, rn) * smoothstep(0.0, 0.10, rn);
          float inten = fall * (0.35 + body * 0.85);
          // Kept off white on purpose: at full intensity the bloom chain eats
          // the gradient and the disc turns into a flat bright ring.
          vec3 hot = vec3(1.0, 0.72, 0.34);
          vec3 cool = vec3(0.52, 0.22, 1.0);
          vec3 col = mix(hot, cool, smoothstep(0.0, 0.6, rn));
          float al = clamp(inten * uAmount, 0.0, 1.0);
          gl_FragColor = vec4(col * al * 1.5, al);
        }`,
    });
    this.disc = new THREE.Mesh(discGeo, this.discMat);
    this.disc.position.y = 0.02;
    this.disc.renderOrder = 7;

    // ---- boundary: where the pull ends, drawn on the deck -------------------
    const edgeGeo = new THREE.RingGeometry(BLACKHOLE.radius * 0.965, BLACKHOLE.radius, 96, 1);
    edgeGeo.rotateX(-Math.PI / 2);
    this.edgeMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: this._time, uAmount: this._amount },
      vertexShader: `varying vec2 vU; void main(){ vU = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        precision mediump float;
        varying vec2 vU;
        uniform float uTime; uniform float uAmount;
        void main() {
          // Dashes crawling inward around the boundary: unmistakably a limit,
          // and unmistakably pulling.
          float d = 0.5 + 0.5 * sin(vU.x * 132.0 - uTime * 2.4);
          float a = (0.18 + d * 0.42) * uAmount;
          gl_FragColor = vec4(vec3(0.72, 0.45, 1.0) * a * 1.6, a * 0.8);
        }`,
    });
    this.edge = new THREE.Mesh(edgeGeo, this.edgeMat);
    this.edge.position.y = ARENA.floorY - ARENA.playY + 0.045;
    this.edge.renderOrder = 4;

    this.root.add(this.core, this.disc, this.edge);
  }

  // ------------------------------------------------------------------- api --
  reset() {
    this.phase = CLOSED;
    this.timer = BLACKHOLE.first;
    this.strength = 0;
    this.justWarned = this.justOpened = this.justClosed = false;
    this._warned = false;
    this.root.visible = false;
  }

  /** True while orbs are actually being bent. */
  get live() { return this.strength > 0.001; }

  /**
   * 0..1 for the HUD: filling while it is away and due, draining while open.
   */
  get cycle01() {
    if (this.phase === CLOSED) return clamp(1 - this.timer / BLACKHOLE.cooldown, 0, 1);
    if (this.phase === OPEN) return clamp(this.timer / BLACKHOLE.duration, 0, 1);
    return this.phase === WARNING ? 1 : this.strength;
  }

  /**
   * Choose where the next one opens.
   *
   * Steps to the next quadrant every time, so no pilot gets it twice running
   * and every seat sees the same number over a match. Within the quadrant the
   * angle is free, and a handful of tries are spent looking for a spot clear of
   * standing blocks — failing that we take the last candidate, because a
   * singularity overlapping a block is far less bad than one that never opens.
   *
   * @param {import('./bricks.js').BrickField} [bricks]
   */
  _place(bricks) {
    this.quadrant = (this.quadrant + 1) % 4;
    let x = 0, z = 0;
    for (let tries = 0; tries < 12; tries++) {
      const a = (this.quadrant + rand(0.18, 0.82)) * Math.PI * 0.5;
      x = Math.cos(a) * BLACKHOLE.spawnR;
      z = Math.sin(a) * BLACKHOLE.spawnR;
      if (!bricks || this._clearOf(bricks, x, z)) break;
    }
    this.x = x; this.z = z;
    this.root.position.set(x, ARENA.playY, z);
  }

  _clearOf(bricks, x, z) {
    for (const b of bricks.standing()) {
      const cx = clamp(x - b.x, -b.hw, b.hw), cz = clamp(z - b.z, -b.hd, b.hd);
      if (Math.hypot(x - b.x - cx, z - b.z - cz) < BLACKHOLE.coreR + BLACKHOLE.clearance) {
        return false;
      }
    }
    return true;
  }

  // ------------------------------------------------------------------ pull --
  /**
   * Bend one orb, for one substep.
   *
   * Called from inside the substep loop. Adds an acceleration toward the core
   * and then puts the velocity back to the speed it came in with, so the orb
   * turns without gaining or losing energy.
   *
   * @returns {boolean} true if the orb was inside the field of influence
   */
  affect(o, step) {
    if (this.strength <= 0.001) return false;
    const dx = this.x - o.x, dz = this.z - o.z;
    const d2 = dx * dx + dz * dz;
    const R = BLACKHOLE.radius;
    if (d2 > R * R || d2 < 1e-6) return false;

    const d = Math.sqrt(d2);
    // Falls off toward the boundary, and *also* eases off at the very centre.
    // Without the inner taper an orb crossing near-dead-centre gets a huge
    // impulse across a very short window and snaps through a corner rather
    // than sweeping an arc.
    const t = d / R;
    const fall = (1 - t * t) * smoothCore(d);
    const a = BLACKHOLE.pull * fall * this.strength * step;

    const speed = o.speed || Math.hypot(o.vx, o.vz) || 1;
    o.vx += (dx / d) * a;
    o.vz += (dz / d) * a;
    const l = Math.hypot(o.vx, o.vz) || 1;
    o.vx = (o.vx / l) * speed;
    o.vz = (o.vz / l) * speed;
    return true;
  }

  // ---------------------------------------------------------------- update --
  /**
   * @param {number} dt
   * @param {number} t          match clock, for the shaders
   * @param {object} [bricks]   consulted when picking a spot
   */
  update(dt, t, bricks) {
    this.justWarned = this.justOpened = this.justClosed = false;
    this._time.value = t;
    this.timer -= dt;

    switch (this.phase) {
      case CLOSED:
        if (this.timer <= BLACKHOLE.warnTime && !this._warned) {
          this._warned = true;
          this._place(bricks);
          this.justWarned = true;
        }
        if (this.timer <= 0) {
          this.phase = OPENING; this.timer = BLACKHOLE.openTime;
          this._warned = false;
          this.justOpened = true;
          this.root.visible = true;
        }
        break;
      case OPENING:
        this.strength = 1 - clamp(this.timer / BLACKHOLE.openTime, 0, 1);
        if (this.timer <= 0) { this.phase = OPEN; this.timer = BLACKHOLE.duration; this.strength = 1; }
        break;
      case OPEN:
        if (this.timer <= 0) {
          this.phase = CLOSING; this.timer = BLACKHOLE.openTime;
          this.justClosed = true;
        }
        break;
      case CLOSING:
        this.strength = clamp(this.timer / BLACKHOLE.openTime, 0, 1);
        if (this.timer <= 0) {
          this.phase = CLOSED; this.timer = BLACKHOLE.cooldown;
          this.strength = 0;
          this.root.visible = false;
        }
        break;
    }

    if (!this.root.visible) return;
    this._amount.value = this.strength;
    // Collapses to a point rather than fading out — a black hole that dissolves
    // looks like a texture being turned off.
    const s = Math.pow(this.strength, 0.65);
    this.core.scale.setScalar(s);
    this.disc.scale.set(s, 1, s);
    this.disc.rotation.y = t * 0.35;
    this.edge.scale.set(0.35 + s * 0.65, 1, 0.35 + s * 0.65);
  }

  dispose() {
    this.core.geometry.dispose(); this.disc.geometry.dispose(); this.edge.geometry.dispose();
    this.coreMat.dispose(); this.discMat.dispose(); this.edgeMat.dispose();
    this.scene.remove(this.root);
  }
}

/** Eases the pull off inside the core so a central pass sweeps rather than snaps. */
function smoothCore(d) {
  const k = clamp(d / (BLACKHOLE.coreR * 2.2), 0, 1);
  return k * k * (3 - 2 * k);
}
