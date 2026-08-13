import * as THREE from 'three';

/**
 * The barrier behind each pilot. It has to answer three questions at a glance,
 * from across a phone screen, while orbs are moving:
 *
 *   whose is it     -> team colour, saturated
 *   how healthy     -> brightness and lattice density collapse as points drain
 *   was it just hit -> a bright impact bloom that rides outward from the point
 *
 * Drawn additively so it never occludes an orb travelling behind it.
 */

const VERT = /* glsl */`
varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vViewDir;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWPos = wp.xyz;
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
varying vec3 vWPos;
varying vec3 vViewDir;

uniform vec3  uColor;
uniform float uTime;
uniform float uHealth;    // 1 -> full, 0 -> eliminated
uniform float uHit;       // 0..1 impact envelope
uniform vec2  uHitPos;    // uv of the last impact
uniform float uSealed;    // 1 when the pilot is out and the wall is solid
uniform vec3  uNormal;

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.732))), p.x);
}
vec3 hexGrid(vec2 uv) {
  vec2 r = vec2(1.0, 1.732);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  return vec3(0.5 - hexDist(gv), uv - gv);
}
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.73));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
// exp(-x²), written as a multiply. pow(x, 2.0) with a negative x is undefined
// in GLSL and several mobile drivers return NaN for it, which then blows out
// the bloom chain — so we never hand a signed value to pow().
float gauss(float x) { return exp(-x * x); }

void main() {
  vec2 uv = vUv;
  // Aspect-correct the lattice: the panel is wide and short.
  vec2 gp = vec2(uv.x * 15.0, uv.y * 3.4);
  vec3 hg = hexGrid(gp);
  float cellR = hash21(hg.yz);

  float edge = smoothstep(0.10, 0.015, hg.x);

  // Cells flicker in and out; fewer stay lit as health drops.
  float flick = step(1.0 - uHealth * 0.85, hash21(hg.yz + floor(uTime * 2.2) * 0.137));
  float cell = smoothstep(0.34, 0.5, hg.x) * flick * 0.10;

  // Grazing angles should light up — that's what makes it feel like a surface
  // of energy rather than a decal.
  float fres = pow(clamp(1.0 - abs(dot(normalize(uNormal), vViewDir)), 0.0, 1.0), 2.1);

  // Vertical containment: bright at the base, dissolving toward the top.
  float vFade = smoothstep(1.02, 0.18, uv.y);
  float base  = smoothstep(0.26, 0.0, uv.y);

  float scan = gauss((fract(uv.y - uTime * 0.22) - 0.5) * 6.48);

  float a = edge * 0.42 + cell + fres * 0.34 + scan * 0.22 + base * 0.5;
  a *= vFade;

  vec3 col = uColor * a;

  // ---- impact bloom --------------------------------------------------------
  if (uHit > 0.001) {
    float d = distance(uv * vec2(4.2, 1.0), uHitPos * vec2(4.2, 1.0));
    float ripple = gauss((d - (1.0 - uHit) * 1.5) * 3.4);
    float flash = exp(-d * 5.0) * uHit;
    col += (uColor * 2.0 + vec3(0.55)) * (ripple * uHit * 1.8 + flash * 2.2);
  }

  // ---- sealed: the wall goes cold and hard --------------------------------
  if (uSealed > 0.001) {
    vec3 dead = vec3(0.30, 0.36, 0.46) * (edge * 0.75 + 0.05) * vFade;
    // Slow diagonal hazard sweep so a sealed wall still reads as *active*.
    float bar = step(0.5, fract((uv.x * 9.0 + uv.y * 2.0) - uTime * 0.10));
    dead += vec3(0.42, 0.30, 0.10) * bar * edge * 0.5;
    col = mix(col, dead, uSealed);
  }

  float alpha = clamp(a * (0.35 + uHealth * 0.65) + uHit, 0.0, 1.0);
  gl_FragColor = vec4(col * (0.5 + uHealth * 0.9), alpha);
}`;

export class ForceField {
  /**
   * @param {number} width  span along the wall
   * @param {number} height
   * @param {number} color  team colour
   */
  constructor(width, height, color) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(color).convertSRGBToLinear() },
        uTime: { value: 0 },
        uHealth: { value: 1 },
        uHit: { value: 0 },
        uHitPos: { value: new THREE.Vector2(0.5, 0.35) },
        uSealed: { value: 0 },
        uNormal: { value: new THREE.Vector3(0, 0, 1) },
      },
    });

    const geo = new THREE.PlaneGeometry(width, height, 1, 1);
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.renderOrder = 6;
    this._hit = 0;
    this._sealTarget = 0;
  }

  /** @param {number} u 0..1 across the panel, from the impact's lateral offset */
  hit(u, v = 0.34, power = 1) {
    this.mat.uniforms.uHitPos.value.set(u, v);
    this._hit = Math.min(1.6, this._hit + power);
  }

  setHealth(h) { this.mat.uniforms.uHealth.value = h; }
  seal() { this._sealTarget = 1; }
  setNormal(x, y, z) { this.mat.uniforms.uNormal.value.set(x, y, z); }

  update(dt, t) {
    const u = this.mat.uniforms;
    u.uTime.value = t;
    this._hit *= Math.exp(-dt * 4.2);
    if (this._hit < 0.002) this._hit = 0;
    u.uHit.value = this._hit;
    u.uSealed.value += (this._sealTarget - u.uSealed.value) * Math.min(1, dt * 3.2);
  }

  dispose() { this.mesh.geometry.dispose(); this.mat.dispose(); }
}
