import * as THREE from 'three';

/**
 * HDR post chain.
 *
 *   scene ──▶ [RGBA16F + MSAA] ──▶ prefilter ──▶ down×N ──▶ up×N ──▶ composite ──▶ screen
 *
 * Bloom is the dual-filter ("COD: Advanced Warfare") variant: a 13-tap
 * downsample chain and a 9-tap tent upsample chain that accumulates additively.
 * It gives a wide, smooth, energy-preserving glow for a fraction of the cost of
 * a stack of separable gaussians, which matters a great deal on a phone.
 *
 * The composite does everything else in one pass: radial chromatic aberration,
 * an optional radial blur pulse, ACES tonemapping, lift/gain grading, vignette
 * and grain. One dependent texture chain, one write.
 */

const VERT = /* glsl */`
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// --- threshold + karis-weighted 4-tap box, straight into half res -----------
const PREFILTER = /* glsl */`
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uTexel;
uniform float uThreshold;
uniform float uKnee;
out vec4 fragColor;

float karis(vec3 c) { return 1.0 / (1.0 + max(c.r, max(c.g, c.b))); }

void main() {
  vec2 t = uTexel;
  vec3 a = texture(uTex, vUv + vec2(-t.x, -t.y)).rgb;
  vec3 b = texture(uTex, vUv + vec2( t.x, -t.y)).rgb;
  vec3 c = texture(uTex, vUv + vec2(-t.x,  t.y)).rgb;
  vec3 d = texture(uTex, vUv + vec2( t.x,  t.y)).rgb;

  // Weighting each tap by inverse luma kills single-pixel fireflies before
  // they get smeared across the screen by the blur chain.
  float wa = karis(a), wb = karis(b), wc = karis(c), wd = karis(d);
  vec3 col = (a * wa + b * wb + c * wc + d * wd) / max(wa + wb + wc + wd, 1e-4);

  float br = max(col.r, max(col.g, col.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  col *= max(soft, br - uThreshold) / max(br, 1e-4);

  fragColor = vec4(min(col, vec3(48.0)), 1.0);
}`;

const DOWN = /* glsl */`
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
out vec4 fragColor;

void main() {
  vec2 t = uTexel;
  vec3 a = texture(uTex, vUv + t * vec2(-2.0,  2.0)).rgb;
  vec3 b = texture(uTex, vUv + t * vec2( 0.0,  2.0)).rgb;
  vec3 c = texture(uTex, vUv + t * vec2( 2.0,  2.0)).rgb;
  vec3 d = texture(uTex, vUv + t * vec2(-2.0,  0.0)).rgb;
  vec3 e = texture(uTex, vUv                        ).rgb;
  vec3 f = texture(uTex, vUv + t * vec2( 2.0,  0.0)).rgb;
  vec3 g = texture(uTex, vUv + t * vec2(-2.0, -2.0)).rgb;
  vec3 h = texture(uTex, vUv + t * vec2( 0.0, -2.0)).rgb;
  vec3 i = texture(uTex, vUv + t * vec2( 2.0, -2.0)).rgb;
  vec3 j = texture(uTex, vUv + t * vec2(-1.0,  1.0)).rgb;
  vec3 k = texture(uTex, vUv + t * vec2( 1.0,  1.0)).rgb;
  vec3 l = texture(uTex, vUv + t * vec2(-1.0, -1.0)).rgb;
  vec3 m = texture(uTex, vUv + t * vec2( 1.0, -1.0)).rgb;

  vec3 col = e * 0.125;
  col += (a + c + g + i) * 0.03125;
  col += (b + d + f + h) * 0.0625;
  col += (j + k + l + m) * 0.125;
  fragColor = vec4(col, 1.0);
}`;

const UP = /* glsl */`
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uTexel;
uniform float uRadius;
uniform float uStretch;   // >1 widens the kernel horizontally: anamorphic streak
out vec4 fragColor;

void main() {
  vec2 t = uTexel * uRadius * vec2(uStretch, 1.0);
  vec3 col = texture(uTex, vUv + vec2(-t.x,  t.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2( 0.0,  t.y)).rgb * 2.0;
  col += texture(uTex, vUv + vec2( t.x,  t.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2(-t.x,  0.0)).rgb * 2.0;
  col += texture(uTex, vUv                    ).rgb * 4.0;
  col += texture(uTex, vUv + vec2( t.x,  0.0)).rgb * 2.0;
  col += texture(uTex, vUv + vec2(-t.x, -t.y)).rgb * 1.0;
  col += texture(uTex, vUv + vec2( 0.0, -t.y)).rgb * 2.0;
  col += texture(uTex, vUv + vec2( t.x, -t.y)).rgb * 1.0;
  fragColor = vec4(col * (1.0 / 16.0), 1.0);
}`;

const COMPOSITE = /* glsl */`
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2  uRes;
uniform float uTime;
uniform float uExposure;
uniform float uBloomStrength;
uniform float uAberration;
uniform float uVignette;
uniform float uGrain;
uniform float uRadial;      // radial blur pulse (0 = off)
uniform float uFlash;       // full-screen white flash
uniform vec3  uFlashTint;
uniform float uDesat;       // hit-stop drains colour momentarily
out vec4 fragColor;

// ACES fitted (Stephen Hill). Punchy highlight rolloff, keeps neons saturated
// right up to the clip point, which is the entire point of this art direction.
const mat3 ACES_IN = mat3(
  0.59719, 0.07600, 0.02840,
  0.35458, 0.90834, 0.13383,
  0.04823, 0.01566, 0.83777);
const mat3 ACES_OUT = mat3(
   1.60475, -0.10208, -0.00327,
  -0.53108,  1.10813, -0.07276,
  -0.07367, -0.00605,  1.07602);

vec3 rrtOdt(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}
vec3 aces(vec3 c) {
  c = ACES_IN * c;
  c = rrtOdt(c);
  return clamp(ACES_OUT * c, 0.0, 1.0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  vec2 cen = uv - 0.5;
  float r2 = dot(cen, cen);

  // --- barrel-ish lens pinch, very slight, sells a physical optic ----------
  uv = 0.5 + cen * (1.0 + r2 * 0.011);

  // --- radial blur pulse ---------------------------------------------------
  vec3 scene;
  if (uRadial > 0.001) {
    vec2 dir = (uv - 0.5) * uRadial * 0.055;
    scene  = texture(uScene, uv).rgb                * 0.30;
    scene += texture(uScene, uv - dir * 0.35).rgb   * 0.24;
    scene += texture(uScene, uv - dir * 0.70).rgb   * 0.20;
    scene += texture(uScene, uv - dir * 1.05).rgb   * 0.15;
    scene += texture(uScene, uv - dir * 1.45).rgb   * 0.11;
  } else {
    scene = texture(uScene, uv).rgb;
  }

  // --- chromatic aberration, scaled by distance from centre ---------------
  float ca = uAberration * (0.00042 + r2 * 0.0019);
  if (ca > 0.00002) {
    vec2 off = normalize(cen + 1e-6) * ca;
    scene.r = texture(uScene, uv + off).r;
    scene.b = texture(uScene, uv - off).b;
  }

  vec3 bloom = texture(uBloom, uv).rgb;
  // Bloom gets its own, stronger aberration — that's what reads as "lens".
  if (ca > 0.00002) {
    vec2 off2 = normalize(cen + 1e-6) * ca * 1.9;
    bloom.r = texture(uBloom, uv + off2).r;
    bloom.b = texture(uBloom, uv - off2).b;
  }

  vec3 col = scene + bloom * uBloomStrength;
  col += uFlashTint * uFlash;
  col *= uExposure;

  col = aces(col);

  // --- grade: cool shadows, warm speculars, gentle S-curve ----------------
  col = mix(col, col * vec3(0.90, 0.97, 1.12), 0.42 * (1.0 - smoothstep(0.0, 0.45, dot(col, vec3(0.333)))));
  col = mix(col, col * vec3(1.06, 1.01, 0.94), 0.30 * smoothstep(0.55, 1.0, dot(col, vec3(0.333))));
  col = clamp(col, 0.0, 1.0);
  col = col * col * (3.0 - 2.0 * col) * 0.16 + col * 0.84;

  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(luma), uDesat);

  // --- vignette ------------------------------------------------------------
  float vig = 1.0 - uVignette * smoothstep(0.16, 0.82, r2);
  col *= vig;

  // --- grain, tuned to sit just at the edge of perception -----------------
  if (uGrain > 0.0) {
    float n = hash12(gl_FragCoord.xy + fract(uTime) * 431.7);
    col += (n - 0.5) * uGrain * (1.08 - luma * 0.72);
  }

  // sRGB encode
  col = max(col, vec3(0.0));
  vec3 lo = col * 12.92;
  vec3 hi = 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055;
  fragColor = vec4(mix(hi, lo, step(col, vec3(0.0031308))), 1.0);
}`;

function fsMaterial(fragment, uniforms) {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: `in vec3 position;\nin vec2 uv;\n` + VERT,
    fragmentShader: fragment,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

export class PostFX {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {{bloomLevels:number, msaa:number, grain:boolean, aberration:number}} preset
   */
  constructor(renderer, preset) {
    this.renderer = renderer;
    this.levels = preset.bloomLevels;
    this.preset = preset;

    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    this.quad = new THREE.Mesh(geo, null);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    const rtOpts = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: true,
      generateMipmaps: false,
      colorSpace: THREE.LinearSRGBColorSpace,
    };
    this.hdr = new THREE.WebGLRenderTarget(2, 2, { ...rtOpts, samples: preset.msaa | 0 });
    this.mips = [];

    // --- materials ---------------------------------------------------------
    this.mPre = fsMaterial(PREFILTER, {
      uTex: { value: null }, uTexel: { value: new THREE.Vector2() },
      uThreshold: { value: 1.28 }, uKnee: { value: 0.55 },
    });
    this.mDown = fsMaterial(DOWN, {
      uTex: { value: null }, uTexel: { value: new THREE.Vector2() },
    });
    this.mUp = fsMaterial(UP, {
      uTex: { value: null }, uTexel: { value: new THREE.Vector2() },
      uRadius: { value: 1.0 }, uStretch: { value: 1.42 },
    });
    this.mUp.blending = THREE.AdditiveBlending;

    this.mComp = fsMaterial(COMPOSITE, {
      uScene: { value: null }, uBloom: { value: null },
      uRes: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uExposure: { value: 1.0 },
      uBloomStrength: { value: 0.42 },
      uAberration: { value: preset.aberration },
      uVignette: { value: 0.44 },
      uGrain: { value: preset.grain ? 0.011 : 0 },
      uRadial: { value: 0 },
      uFlash: { value: 0 },
      uFlashTint: { value: new THREE.Color(1, 1, 1) },
      uDesat: { value: 0 },
    });

    this.u = this.mComp.uniforms;
  }

  setSize(w, h) {
    w = Math.max(2, w | 0); h = Math.max(2, h | 0);
    this.w = w; this.h = h;
    this.hdr.setSize(w, h);
    this.u.uRes.value.set(w, h);

    for (const m of this.mips) m.dispose();
    this.mips = [];
    let mw = w, mh = h;
    for (let i = 0; i < this.levels; i++) {
      mw = Math.max(1, mw >> 1);
      mh = Math.max(1, mh >> 1);
      const rt = new THREE.WebGLRenderTarget(mw, mh, {
        type: THREE.HalfFloatType, format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
        depthBuffer: false, generateMipmaps: false,
        colorSpace: THREE.LinearSRGBColorSpace,
      });
      this.mips.push(rt);
      if (mw <= 2 || mh <= 2) { this.activeLevels = i + 1; break; }
      this.activeLevels = i + 1;
    }
  }

  /** Render a fullscreen pass of `mat` into `target` (null = screen). */
  _pass(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.cam);
  }

  /** Draw the scene into the HDR buffer. */
  renderScene(scene, camera) {
    this.renderer.setRenderTarget(this.hdr);
    this.renderer.clear(true, true, true);
    this.renderer.render(scene, camera);
  }

  /** Run bloom + composite to the default framebuffer. */
  present(time) {
    const n = this.activeLevels;

    // prefilter -> mip0
    this.mPre.uniforms.uTex.value = this.hdr.texture;
    this.mPre.uniforms.uTexel.value.set(1 / this.w, 1 / this.h);
    this._pass(this.mPre, this.mips[0]);

    // downsample chain
    for (let i = 1; i < n; i++) {
      const src = this.mips[i - 1];
      this.mDown.uniforms.uTex.value = src.texture;
      this.mDown.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      this._pass(this.mDown, this.mips[i]);
    }

    // upsample chain, accumulating additively into the larger mip each step
    for (let i = n - 1; i > 0; i--) {
      const src = this.mips[i];
      this.mUp.uniforms.uTex.value = src.texture;
      this.mUp.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      this._pass(this.mUp, this.mips[i - 1]);
    }

    this.u.uScene.value = this.hdr.texture;
    this.u.uBloom.value = this.mips[0].texture;
    this.u.uTime.value = time;
    this.renderer.setRenderTarget(null);
    this._pass(this.mComp, null);
  }

  dispose() {
    this.hdr.dispose();
    for (const m of this.mips) m.dispose();
    this.mPre.dispose(); this.mDown.dispose(); this.mUp.dispose(); this.mComp.dispose();
    this.quad.geometry.dispose();
  }
}
