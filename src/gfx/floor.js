import * as THREE from 'three';
import { ARENA, SIDES } from '../core/config.js';

/**
 * The arena deck.
 *
 * This is a plain MeshStandardMaterial with extra code spliced in, rather than
 * a from-scratch ShaderMaterial. That choice matters: it keeps three's shadow
 * receiving, IBL and fog for free, and we only own the parts we actually want
 * to author — an emissive energy layer and a roughness break-up.
 *
 * The energy layer carries four jobs at once:
 *   · a hex lattice that grounds the scale of everything on top of it
 *   · territory washes so each pilot can see which strip of deck is theirs
 *   · expanding shock rings, one per impact, which is most of the game's feel
 *   · a slow sweep that keeps the surface alive between rallies
 */

const MAX_WAVES = 8;

const PARS = /* glsl */`
varying vec3 vWPos;
uniform float uTime;
uniform vec4  uWaves[${MAX_WAVES}];      // xz = origin, z = age, w = strength
uniform vec3  uWaveTint[${MAX_WAVES}];
uniform vec3  uTerritory[4];             // per-pilot colour
uniform vec4  uTerrState;                // per-pilot health 0..1, packed xyzw
uniform float uRadius;
uniform float uDetail;
uniform float uCharge;                   // 0..1 pre-serve build-up

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.732))), p.x);
}

// Returns .x = distance to the nearest cell edge, .yz = cell id
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
`;

const BODY = /* glsl */`
  vec2 P = vWPos.xz;
  float dist = length(P);
  float rn = dist / uRadius;

  // ---- hex lattice -------------------------------------------------------
  vec3 hg = hexGrid(P * 0.62);
  float edge = smoothstep(0.045, 0.006, hg.x);
  float cellRand = hash21(hg.yz);
  vec3 hgFine = hexGrid(P * 2.35);
  float fine = smoothstep(0.035, 0.004, hgFine.x);

  // A slow wave of illumination crawling outward keeps the deck breathing.
  float breathe = 0.5 + 0.5 * sin(uTime * 0.7 - dist * 0.26 + cellRand * 6.28);
  float cellGlow = smoothstep(0.55, 1.0, breathe) * 0.10 * step(0.55, cellRand);

  vec3 energy = vec3(0.05, 0.34, 0.52) * edge * (0.16 + breathe * 0.16);
  energy += vec3(0.04, 0.24, 0.40) * cellGlow;
  energy += vec3(0.03, 0.16, 0.26) * fine * 0.16;

  // ---- territory washes --------------------------------------------------
  // Each pilot's colour bleeds inward from their wall and dims as they lose
  // points, so peripheral vision alone tells you who is nearly out.
  float terr[4];
  terr[0] = clamp( P.y / uRadius, 0.0, 1.0);
  terr[1] = clamp(-P.x / uRadius, 0.0, 1.0);
  terr[2] = clamp(-P.y / uRadius, 0.0, 1.0);
  terr[3] = clamp( P.x / uRadius, 0.0, 1.0);
  float health[4];
  health[0] = uTerrState.x; health[1] = uTerrState.y;
  health[2] = uTerrState.z; health[3] = uTerrState.w;

  for (int i = 0; i < 4; i++) {
    float m = pow(terr[i], 2.6) * health[i];
    // Bright leading line just inside the wall, soft falloff behind it.
    float band = smoothstep(0.66, 0.99, terr[i]) * health[i];
    float pulse = 0.75 + 0.25 * sin(uTime * 2.0 + float(i));
    energy += uTerritory[i] * (m * 0.035 + band * (0.10 + edge * 0.85) * pulse * 0.55);
  }

  // ---- impact shock rings ------------------------------------------------
  for (int i = 0; i < ${MAX_WAVES}; i++) {
    vec4 w = uWaves[i];
    if (w.w <= 0.001) continue;
    float d = length(P - w.xy);
    float rad = w.z * 13.0;
    float ring = gauss((d - rad) * 1.9);
    float fade = w.w * exp(-w.z * 3.4);
    energy += uWaveTint[i] * ring * fade * 1.05;
    // Trailing inner fill gives the ring some body instead of a bare line.
    energy += uWaveTint[i] * smoothstep(rad, rad - 2.0, d) * fade * 0.07;
  }

  // ---- serve charge-up ----------------------------------------------------
  if (uCharge > 0.001) {
    float ring = gauss((dist - (1.0 - uCharge) * 11.0) * 1.4);
    energy += vec3(0.6, 0.95, 1.0) * ring * uCharge * 1.8;
  }

  // ---- centre emblem ------------------------------------------------------
  float core = exp(-dist * dist * 0.075);
  float coreRing = gauss((dist - 3.1) * 3.4);
  energy += vec3(0.10, 0.44, 0.66) * (core * 0.16 + coreRing * 0.26 * (0.65 + 0.35 * sin(uTime * 1.4)));

  // ---- rim ----------------------------------------------------------------
  energy += vec3(0.22, 0.68, 0.95) * smoothstep(0.955, 1.0, rn) * 0.30;

  // Radial vignette so the middle of the deck stays readable under the orbs.
  energy *= mix(1.0, 0.62, smoothstep(0.0, 0.55, rn));

  totalEmissiveRadiance += energy * uDetail;
`;

export function createEnergyFloor(shapePoints, preset, players) {
  // --- geometry: the octagon deck, laid flat ---------------------------------
  const shape = new THREE.Shape();
  shape.moveTo(shapePoints[0].x, shapePoints[0].y);
  for (let i = 1; i < shapePoints.length; i++) shape.lineTo(shapePoints[i].x, shapePoints[i].y);
  shape.closePath();

  const geo = new THREE.ShapeGeometry(shape, 1);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();

  const uniforms = {
    uTime: { value: 0 },
    uWaves: { value: Array.from({ length: MAX_WAVES }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uWaveTint: { value: Array.from({ length: MAX_WAVES }, () => new THREE.Color(0, 0, 0)) },
    uTerritory: { value: players.map((p) => new THREE.Color(p.color).convertSRGBToLinear()) },
    uTerrState: { value: new THREE.Vector4(1, 1, 1, 1) },
    uRadius: { value: ARENA.half },
    uDetail: { value: preset.floorDetail },
    uCharge: { value: 0 },
  };

  const mat = new THREE.MeshStandardMaterial({
    color: 0x1b2432,
    metalness: 0.12,
    roughness: 0.72,
    emissive: 0x000000,
    envMapIntensity: 0.38,
  });

  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);

    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');

    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + PARS)
      // Panel joints should read as polished metal against a matte deck.
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        {
          vec3 hgR = hexGrid(vWPos.xz * 0.62);
          float e = smoothstep(0.05, 0.0, hgR.x);
          roughnessFactor = mix(roughnessFactor, 0.26, e * 0.7);
        }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + BODY);
  };
  // Force a distinct program from other standard materials.
  mat.customProgramCacheKey = () => 'arena-floor';

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = ARENA.floorY;
  mesh.receiveShadow = true;
  mesh.name = 'deck';

  // --- wave pool -------------------------------------------------------------
  let cursor = 0;
  const waves = uniforms.uWaves.value;
  const tints = uniforms.uWaveTint.value;
  const _c = new THREE.Color();

  return {
    mesh,
    uniforms,

    /** Kick off an expanding ring. Oldest slot is recycled when full. */
    addWave(x, z, strength = 1, color = 0x66e0ff) {
      // Prefer a dead slot; otherwise stomp the most-decayed one.
      let slot = -1, worst = 1e9;
      for (let i = 0; i < MAX_WAVES; i++) {
        if (waves[i].w <= 0.001) { slot = i; break; }
        const life = waves[i].w * Math.exp(-waves[i].z * 3.4);
        if (life < worst) { worst = life; slot = i; }
      }
      if (slot < 0) slot = (cursor = (cursor + 1) % MAX_WAVES);
      waves[slot].set(x, z, 0, strength);
      _c.set(color).convertSRGBToLinear();
      tints[slot].copy(_c);
    },

    setTerritory(index, health01) {
      const v = uniforms.uTerrState.value;
      if (index === 0) v.x = health01;
      else if (index === 1) v.y = health01;
      else if (index === 2) v.z = health01;
      else v.w = health01;
    },

    setCharge(v) { uniforms.uCharge.value = v; },

    update(dt, t) {
      uniforms.uTime.value = t;
      for (let i = 0; i < MAX_WAVES; i++) {
        const w = waves[i];
        if (w.w <= 0.001) continue;
        w.z += dt;
        if (w.z > 1.5) w.w = 0;
      }
    },

    dispose() { geo.dispose(); mat.dispose(); },
  };
}

/** The eight boundary planes, in the order the deck outline visits them. */
export function arenaOutline() {
  const { half, chamfer } = ARENA;
  const a = half - chamfer;
  return [
    new THREE.Vector2(-a, half), new THREE.Vector2(a, half),
    new THREE.Vector2(half, a), new THREE.Vector2(half, -a),
    new THREE.Vector2(a, -half), new THREE.Vector2(-a, -half),
    new THREE.Vector2(-half, -a), new THREE.Vector2(-half, a),
  ];
}

/**
 * Collision planes as { nx, nz, d, goal }. A point p is inside when
 * nx*px + nz*pz <= d for all eight.
 */
export function arenaPlanes() {
  const { half, chamfer } = ARENA;
  const dDiag = (2 * half - chamfer) / Math.SQRT2;
  const s = Math.SQRT1_2;
  const planes = [];
  // Goal planes, indexed to match SIDES / player ids.
  for (let i = 0; i < 4; i++) {
    const sd = SIDES[i];
    planes.push({ nx: sd.nx, nz: sd.nz, d: half, goal: i, halfWidth: half - chamfer });
  }
  // Chamfered bumpers.
  planes.push({ nx: s, nz: s, d: dDiag, goal: -1 });
  planes.push({ nx: s, nz: -s, d: dDiag, goal: -1 });
  planes.push({ nx: -s, nz: -s, d: dDiag, goal: -1 });
  planes.push({ nx: -s, nz: s, d: dDiag, goal: -1 });
  return planes;
}
