import * as THREE from 'three';

/**
 * One pooled Points system for every spark, ember and shard in the game.
 *
 * Simulation is on the CPU (a few hundred particles is nothing) but uploads are
 * kept honest: we track the highest live index and only push that slice of each
 * attribute, so a quiet frame costs almost no bus traffic.
 *
 * Sprites are drawn procedurally in the fragment shader — no texture fetch, no
 * atlas to download, and the streak shape can be rotated per particle to align
 * with its velocity, which is what sells an impact as an impact.
 */

const VERT = /* glsl */`
attribute float aSize;
attribute vec3  aColor;
attribute float aLife;    // 1 -> just born, 0 -> dead
attribute float aAngle;
attribute float aStretch;
attribute float aKind;    // 0 glow, 1 streak, 2 shard
uniform float uPixelRatio;
uniform float uScale;
varying vec3  vColor;
varying float vLife;
varying float vAngle;
varying float vStretch;
varying float vKind;
void main() {
  vColor = aColor; vLife = aLife; vAngle = aAngle;
  vStretch = aStretch; vKind = aKind;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // Perspective attenuation, clamped so distant sparks don't vanish entirely.
  float atten = uScale / max(-mv.z, 0.6);
  gl_PointSize = max(1.0, aSize * uPixelRatio * atten * (0.25 + vLife * 0.75));
}`;

const FRAG = /* glsl */`
precision mediump float;
varying vec3  vColor;
varying float vLife;
varying float vAngle;
varying float vStretch;
varying float vKind;

void main() {
  vec2 p = gl_PointCoord - 0.5;

  // Rotate into the particle's own frame so streaks lie along their velocity.
  float s = sin(vAngle), c = cos(vAngle);
  p = mat2(c, -s, s, c) * p;

  float a;
  if (vKind < 0.5) {
    // Round ember: tight gaussian core with a soft halo.
    float r2 = dot(p, p);
    a = exp(-r2 * 22.0) + exp(-r2 * 5.5) * 0.35;
  } else if (vKind < 1.5) {
    // Streak: squeezed across, stretched along.
    p.x /= max(vStretch, 0.05);
    p.y *= 3.4;
    float r2 = dot(p, p);
    a = exp(-r2 * 26.0) * 1.25;
  } else {
    // Shard: a hard-edged sliver that tumbles.
    vec2 q = abs(p);
    float d = max(q.x * 2.6, q.y * 9.0);
    a = smoothstep(0.5, 0.16, d);
  }

  a *= vLife * vLife;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * a * 2.6, a);
}`;

const _dir = new THREE.Vector3();

export class Sparks {
  constructor(capacity, pixelRatio = 1) {
    this.cap = capacity;
    const n = capacity;

    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n);
    this.life = new Float32Array(n);      // normalised 1 -> 0
    this.rate = new Float32Array(n);      // 1 / lifetime
    this.angle = new Float32Array(n);
    this.stretch = new Float32Array(n);
    this.kind = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.grav = new Float32Array(n);
    this.spin = new Float32Array(n);

    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage);
    this.aSize = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
    this.aLife = new THREE.BufferAttribute(this.life, 1).setUsage(THREE.DynamicDrawUsage);
    this.aAngle = new THREE.BufferAttribute(this.angle, 1).setUsage(THREE.DynamicDrawUsage);
    this.aStretch = new THREE.BufferAttribute(this.stretch, 1).setUsage(THREE.DynamicDrawUsage);
    this.aKind = new THREE.BufferAttribute(this.kind, 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aPos);
    g.setAttribute('aColor', this.aCol);
    g.setAttribute('aSize', this.aSize);
    g.setAttribute('aLife', this.aLife);
    g.setAttribute('aAngle', this.aAngle);
    g.setAttribute('aStretch', this.aStretch);
    g.setAttribute('aKind', this.aKind);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);
    g.setDrawRange(0, 0);

    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uPixelRatio: { value: pixelRatio },
        uScale: { value: 26 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 9;

    this.cursor = 0;
    this.high = 0;      // highest index ever used; bounds the upload slice
    this._c = new THREE.Color();
  }

  setPixelRatio(pr) { this.mat.uniforms.uPixelRatio.value = pr; }

  _alloc() {
    // Linear probe from the cursor for a dead slot; if the pool is saturated
    // we overwrite at the cursor, which recycles the oldest burst first.
    const n = this.cap;
    for (let i = 0; i < n; i++) {
      const idx = (this.cursor + i) % n;
      if (this.life[idx] <= 0) {
        this.cursor = (idx + 1) % n;
        if (idx + 1 > this.high) this.high = idx + 1;
        return idx;
      }
    }
    const idx = this.cursor;
    this.cursor = (idx + 1) % n;
    return idx;
  }

  /**
   * @param {object} o
   * @param {number[]} o.at      [x,y,z]
   * @param {number[]} [o.dir]   preferred direction; omit for a sphere burst
   * @param {number} [o.spread]  0 = laser tight, 1 = hemisphere, 2 = sphere
   */
  burst(o) {
    const count = o.count | 0;
    const [ox, oy, oz] = o.at;
    const spread = o.spread ?? 1;
    const sMin = o.speedMin ?? 4, sMax = o.speedMax ?? 12;
    const lMin = o.lifeMin ?? 0.25, lMax = o.lifeMax ?? 0.7;
    const szMin = o.sizeMin ?? 6, szMax = o.sizeMax ?? 16;
    const kind = o.kind ?? 1;
    const drag = o.drag ?? 2.4;
    const grav = o.grav ?? -9;
    const jitter = o.jitter ?? 0;
    const c1 = this._c.set(o.color ?? 0xffffff).convertSRGBToLinear();
    const cr = c1.r, cg = c1.g, cb = c1.b;
    let c2r = cr, c2g = cg, c2b = cb;
    if (o.color2 !== undefined) {
      const c2 = this._c.set(o.color2).convertSRGBToLinear();
      c2r = c2.r; c2g = c2.g; c2b = c2.b;
    }

    const hasDir = !!o.dir;
    const dx = hasDir ? o.dir[0] : 0, dy = hasDir ? o.dir[1] : 0, dz = hasDir ? o.dir[2] : 0;

    for (let k = 0; k < count; k++) {
      const i = this._alloc();

      // Random point on a sphere, then bent toward `dir` by (1 - spread).
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const rs = Math.sqrt(Math.max(0, 1 - u * u));
      let vx = Math.cos(th) * rs, vy = u, vz = Math.sin(th) * rs;
      if (hasDir) {
        const w = 1 - Math.min(spread, 1);
        vx = vx * (1 - w) + dx * w;
        vy = vy * (1 - w) + dy * w;
        vz = vz * (1 - w) + dz * w;
        const l = Math.hypot(vx, vy, vz) || 1;
        vx /= l; vy /= l; vz /= l;
      }
      if (spread < 1 && !hasDir) vy = Math.abs(vy);

      const sp = sMin + Math.random() * (sMax - sMin);
      const i3 = i * 3;
      this.pos[i3] = ox + (Math.random() - 0.5) * jitter;
      this.pos[i3 + 1] = oy + (Math.random() - 0.5) * jitter;
      this.pos[i3 + 2] = oz + (Math.random() - 0.5) * jitter;
      this.vel[i3] = vx * sp;
      this.vel[i3 + 1] = vy * sp;
      this.vel[i3 + 2] = vz * sp;

      const mix = Math.random();
      this.col[i3] = cr + (c2r - cr) * mix;
      this.col[i3 + 1] = cg + (c2g - cg) * mix;
      this.col[i3 + 2] = cb + (c2b - cb) * mix;

      this.size[i] = szMin + Math.random() * (szMax - szMin);
      this.life[i] = 1;
      this.rate[i] = 1 / (lMin + Math.random() * (lMax - lMin));
      this.angle[i] = Math.random() * Math.PI * 2;
      this.stretch[i] = 0.16 + Math.random() * 0.2;
      this.kind[i] = kind;
      this.drag[i] = drag;
      this.grav[i] = grav;
      this.spin[i] = kind === 2 ? (Math.random() - 0.5) * 14 : 0;
    }
  }

  update(dt, camera) {
    const n = this.high;
    if (n === 0) return;
    let maxLive = 0;

    // Screen-space velocity angle for streaks: project the world velocity into
    // view space and take atan2. Cheaper than a full matrix per particle.
    const e = camera.matrixWorldInverse.elements;

    for (let i = 0; i < n; i++) {
      let L = this.life[i];
      if (L <= 0) continue;
      L -= this.rate[i] * dt;
      if (L <= 0) { this.life[i] = 0; continue; }
      this.life[i] = L;
      maxLive = i + 1;

      const i3 = i * 3;
      const d = Math.exp(-this.drag[i] * dt);
      let vx = this.vel[i3] * d;
      let vy = this.vel[i3 + 1] * d + this.grav[i] * dt;
      let vz = this.vel[i3 + 2] * d;

      let px = this.pos[i3] + vx * dt;
      let py = this.pos[i3 + 1] + vy * dt;
      let pz = this.pos[i3 + 2] + vz * dt;

      // Bounce embers off the deck once, with a big energy loss.
      if (py < 0.08 && vy < 0) { py = 0.08; vy = -vy * 0.34; vx *= 0.7; vz *= 0.7; }

      this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
      this.pos[i3] = px; this.pos[i3 + 1] = py; this.pos[i3 + 2] = pz;

      if (this.kind[i] === 1) {
        const sx = e[0] * vx + e[4] * vy + e[8] * vz;
        const sy = e[1] * vx + e[5] * vy + e[9] * vz;
        this.angle[i] = Math.atan2(sy, sx);
      } else if (this.spin[i] !== 0) {
        this.angle[i] += this.spin[i] * dt;
      }
    }

    this.high = maxLive;
    const count = maxLive;
    this.points.geometry.setDrawRange(0, count);
    if (count === 0) return;

    for (const a of [this.aPos, this.aCol, this.aSize, this.aLife, this.aAngle, this.aStretch, this.aKind]) {
      a.updateRanges.length = 0;
      a.addUpdateRange(0, count * a.itemSize);
      a.needsUpdate = true;
    }
  }

  clear() {
    this.life.fill(0);
    this.high = 0;
    this.points.geometry.setDrawRange(0, 0);
  }

  dispose() { this.points.geometry.dispose(); this.mat.dispose(); }
}
