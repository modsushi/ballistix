import * as THREE from 'three';
import { ARENA, ARC, PADDLE } from '../core/config.js';

/**
 * The ARC — a lightning fence spanning a pilot's whole goal line.
 *
 * Two surfaces: the fence itself, standing in the goal plane, and a strip of
 * discharge crawling along the deck beneath it. Both are additive, so the fence
 * never occludes an orb travelling behind it.
 *
 * The lightning is drawn as a handful of independently *gated* filaments. That
 * gating is the whole trick — a smoothly undulating line reads as a ribbon or a
 * flag no matter how you colour it, and only starts reading as electricity once
 * individual strands blink out of existence and back on their own schedules.
 * Each filament is an fbm-displaced horizontal line with its own frequency,
 * amplitude, drift and thickness; between them sits a faint haze so the gaps
 * aren't dead, and top and bottom rails plus end posts give it containment.
 *
 * It grows outward from wherever the craft was when it fired (`uOriginU`), so
 * the fence visibly unzips from the pilot to both walls rather than snapping on.
 */

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const NOISE = /* glsl */`
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float vn1(float x) {
  float i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(hash11(i), hash11(i + 1.0), f);
}
float fbm1(float x) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vn1(x); x *= 2.07; a *= 0.5; }
  return s;
}`;

const FENCE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;

uniform vec3  uColor;
uniform float uTime;
uniform float uOpen;     // 0..1, how far the fence has unzipped
uniform float uOriginU;  // where it grew from, in uv.x
uniform float uHit;      // impact envelope, 0..1
uniform float uHitU;
uniform float uFade;     // master intensity; drops to 0 on expiry

${NOISE}

/**
 * One jagged filament running the length of the fence.
 *
 * Returned as two lobes: a very tight core and a much wider halo. A single
 * gaussian gives an evenly-lit noodle — it's the hard core inside a soft bloom
 * that reads as something too bright to look at.
 */
float bolt(vec2 uv, float seed, float amp, float freq, float speed, float w) {
  float y = 0.5 + (fbm1(uv.x * freq + uTime * speed + seed) - 0.5) * amp;
  float d = abs(uv.y - y);
  return exp(-d * d / (w * w)) * 1.35        // core
       + exp(-d * d / (w * w * 16.0)) * 0.18; // halo
}

/**
 * Per-strand flicker. Smooth rather than a hard step so strands fade in and out
 * instead of popping, but it still reaches zero — a strand that never fully
 * dies is a ribbon, not a spark.
 */
float gate(float seed, float rate) {
  return smoothstep(0.30, 0.62, vn1(uTime * rate + seed));
}

void main() {
  vec2 uv = vUv;

  // Growth: the fence unzips outward from where the craft was standing.
  float reach = uOpen * 1.22;
  float grow = 1.0 - smoothstep(reach - 0.07, reach, abs(uv.x - uOriginU));
  if (grow <= 0.002) discard;

  // --- filaments -----------------------------------------------------------
  float e = 0.0;
  e += bolt(uv,  0.0, 0.78,  4.5,  1.6, 0.013) * gate( 3.0, 11.0);
  e += bolt(uv, 17.3, 0.60,  7.5, -2.4, 0.009) * gate( 9.0, 14.0) * 0.9;
  e += bolt(uv, 31.7, 0.88,  3.0,  1.0, 0.019) * gate(21.0,  8.0) * 0.75;
  e += bolt(uv, 55.1, 0.42, 12.0, -3.4, 0.006) * gate(33.0, 19.0) * 0.7;
  // Two fast, thin strands gated hard — these are the ones that read as forks.
  e += bolt(uv, 71.9, 0.52, 19.0,  4.6, 0.005) * gate(47.0, 26.0) * 0.55;
  e += bolt(uv, 88.2, 0.34, 27.0, -5.9, 0.004) * gate(61.0, 31.0) * 0.45;

  // --- vertical jumps ------------------------------------------------------
  // Short arcs leaping between strands. Their x position is quantised in time,
  // so each one holds for a frame or two and then relocates.
  float jumps = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float slot = floor(uTime * 8.0 + fi * 13.7);
    float jx = vn1(slot * 1.37 + fi * 57.0);
    float jy = vn1(slot * 2.11 + fi * 91.0);
    float dx = abs(uv.x - jx) + fbm1(uv.y * 26.0 + slot) * 0.012;
    jumps += exp(-dx * dx * 2600.0)
           * exp(-pow((uv.y - jy) * 3.4, 2.0))
           * gate(slot + fi, 60.0);
  }

  // --- containment ---------------------------------------------------------
  // Broken, not continuous. Two unbroken lines running the full span read as
  // the edges of a pane of glass no matter how thin they are; chewing them up
  // with noise turns them back into current crawling along a rail.
  float railMask = smoothstep(0.35, 0.75, fbm1(uv.x * 22.0 + uTime * 3.1))
                 + smoothstep(0.45, 0.85, fbm1(uv.x * 31.0 - uTime * 2.3)) * 0.7;
  float rails = (exp(-pow((uv.y - 0.02) * 90.0, 2.0)) + exp(-pow((uv.y - 0.98) * 90.0, 2.0)))
              * railMask;
  float posts = exp(-pow(uv.x * 55.0, 2.0)) + exp(-pow((uv.x - 1.0) * 55.0, 2.0));

  // Barely-there haze so the gaps read as charged air rather than as holes.
  float haze = exp(-pow((uv.y - 0.5) * 2.6, 2.0))
             * (0.030 + 0.022 * sin(uTime * 13.0 + uv.x * 24.0));

  // --- impact --------------------------------------------------------------
  float dHit = abs(uv.x - uHitU);
  float wave = exp(-pow((dHit - (1.0 - uHit) * 0.55) * 10.0, 2.0)) * uHit;
  float flash = exp(-dHit * dHit * 240.0) * uHit;

  float energy = (e + jumps * 1.2 + rails * 0.30 + posts * 0.85 + haze) * grow;
  energy += (wave * 1.5 + flash * 2.8) * grow;

  // White-hot core bleeding to the team colour in the halo. The threshold is
  // low so anything at full strength clips to white and the colour only shows
  // in the falloff — which is how a real discharge photographs.
  vec3 col = mix(uColor, vec3(1.0), clamp(energy * 1.15, 0.0, 1.0));
  col *= energy * (2.1 + uHit * 1.4) * uFade;

  float a = clamp(energy * 0.95, 0.0, 1.0) * uFade;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`;

/** The discharge crawling along the deck under the fence. */
const DECK_FRAG = /* glsl */`
precision mediump float;
varying vec2 vUv;
uniform vec3 uColor;
uniform float uTime, uOpen, uOriginU, uFade, uHit, uHitU;

${NOISE}

void main() {
  vec2 uv = vUv;
  float reach = uOpen * 1.22;
  float grow = 1.0 - smoothstep(reach - 0.07, reach, abs(uv.x - uOriginU));
  if (grow <= 0.002) discard;

  // Across the strip: tight to the fence line, gone within a metre.
  float across = exp(-pow((uv.y - 0.5) * 5.4, 2.0));
  // Tendrils crawling outward. Contrast-stretched hard so this reads as
  // discharge branching over the deck rather than as a lit strip of floor —
  // a smooth band under the fence is most of what makes the whole thing look
  // like a glass panel standing on the ground.
  float creep = fbm1(uv.x * 16.0 + uTime * 1.3) * fbm1(uv.y * 6.0 - uTime * 0.7);
  creep = smoothstep(0.18, 0.62, creep);
  float e = across * (0.06 + creep * 1.15);
  e += exp(-abs(uv.x - uHitU) * 14.0) * uHit * across * 2.2;

  vec3 col = mix(uColor, vec3(1.0), clamp(e * 0.7, 0.0, 1.0)) * e * 1.4 * uFade * grow;
  float a = clamp(e, 0.0, 1.0) * uFade * grow * 0.7;
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`;

export class ArcField {
  /**
   * @param {{nx:number,nz:number,tx:number,tz:number}} side  the pilot's basis
   * @param {number} span   full width of the goal line
   * @param {number} color  team colour
   */
  constructor(side, span, color, scene) {
    this.span = span;
    this.side = side;

    const lin = new THREE.Color(color).convertSRGBToLinear();
    const shared = () => ({
      uColor: { value: lin.clone() },
      uTime: { value: 0 },
      uOpen: { value: 0 },
      uOriginU: { value: 0.5 },
      uHit: { value: 0 },
      uHitU: { value: 0.5 },
      uFade: { value: 0 },
    });

    this.fenceMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FENCE_FRAG,
      uniforms: shared(),
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.deckMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: DECK_FRAG,
      uniforms: shared(),
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });

    // The fence stands in the goal plane, at the paddle's nominal standoff —
    // fixed, not tied to the craft's recoil, so it never jitters.
    const d = ARENA.half - PADDLE.standoff;
    const yaw = Math.atan2(side.nx, side.nz);

    this.fence = new THREE.Mesh(new THREE.PlaneGeometry(span, ARC.height, 1, 1), this.fenceMat);
    this.fence.position.set(side.nx * d, ARENA.playY + ARC.height * 0.34, side.nz * d);
    this.fence.rotation.y = yaw;
    this.fence.renderOrder = 11;
    this.fence.visible = false;
    this.fence.frustumCulled = false;

    this.deck = new THREE.Mesh(new THREE.PlaneGeometry(span, 2.3, 1, 1), this.deckMat);
    this.deck.position.set(side.nx * d, 0.045, side.nz * d);
    this.deck.rotation.set(-Math.PI / 2, 0, -yaw);
    this.deck.renderOrder = 4;
    this.deck.visible = false;
    this.deck.frustumCulled = false;

    scene.add(this.fence, this.deck);

    this.active = false;
    this._open = 0;
    this._fade = 0;
    this._hit = 0;
    this.scene = scene;
  }

  /** @param {number} u lateral offset of the craft, in world units */
  ignite(u) {
    const origin = THREE.MathUtils.clamp(u / this.span + 0.5, 0, 1);
    for (const m of [this.fenceMat, this.deckMat]) m.uniforms.uOriginU.value = origin;
    this.active = true;
    this.fence.visible = true;
    this.deck.visible = true;
  }

  extinguish() { this.active = false; }

  /** @param {number} u01 where along the fence the orb struck, 0..1 */
  strike(u01, power = 1) {
    for (const m of [this.fenceMat, this.deckMat]) m.uniforms.uHitU.value = u01;
    this._hit = Math.min(1.5, this._hit + power);
  }

  update(dt, t) {
    const target = this.active ? 1 : 0;
    // Unzipping and collapsing take the same time; fading trails the collapse
    // so the last flicker outlives the geometry.
    const openRate = dt / Math.max(1e-4, ARC.openTime);
    this._open = this.active
      ? Math.min(1, this._open + openRate)
      : Math.max(0, this._open - openRate);
    const fadeRate = dt / Math.max(1e-4, this.active ? ARC.openTime : ARC.fadeTime);
    this._fade += Math.sign(target - this._fade) * Math.min(fadeRate, Math.abs(target - this._fade));

    this._hit *= Math.exp(-dt * 5.0);
    if (this._hit < 0.003) this._hit = 0;

    for (const m of [this.fenceMat, this.deckMat]) {
      const u = m.uniforms;
      u.uTime.value = t;
      u.uOpen.value = this._open;
      u.uFade.value = this._fade;
      u.uHit.value = this._hit;
    }

    if (this._fade <= 0.001 && !this.active) {
      this.fence.visible = false;
      this.deck.visible = false;
    }
  }

  dispose() {
    this.fence.geometry.dispose(); this.fenceMat.dispose();
    this.deck.geometry.dispose(); this.deckMat.dispose();
    this.scene.remove(this.fence, this.deck);
  }
}
