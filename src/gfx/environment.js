import * as THREE from 'three';

/**
 * The sky is expensive to evaluate and never changes, so we pay for it exactly
 * once: an fbm nebula is rendered into a small HDR cubemap at load, that cube
 * becomes both the scene background and the source for a PMREM environment.
 * Runtime cost afterwards is a single cube fetch per background pixel.
 *
 * Crisp elements that would smear at cube resolution — stars, the gas giant —
 * live in the scene as real geometry instead.
 */

const SKY_FRAG = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uNebulaA;
uniform vec3 uNebulaB;
uniform vec3 uSunDir;
uniform vec3 uSunColor;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i + vec3(0,0,0)), n100 = hash13(i + vec3(1,0,0));
  float n010 = hash13(i + vec3(0,1,0)), n110 = hash13(i + vec3(1,1,0));
  float n001 = hash13(i + vec3(0,0,1)), n101 = hash13(i + vec3(1,0,1));
  float n011 = hash13(i + vec3(0,1,1)), n111 = hash13(i + vec3(1,1,1));
  return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
             mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 6; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return s;
}

void main() {
  vec3 d = normalize(vDir);

  // Base vertical gradient — cold void above, a faint warm floor below.
  float up = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(up, 0.75));

  // Two nebula layers at different scales, warped by a third for filament
  // structure. Ridged (1 - |n|) gives the wispy edges rather than blobs.
  vec3 w = vec3(fbm(d * 1.6 + 11.0), fbm(d * 1.6 + 27.0), fbm(d * 1.6 + 43.0));
  float n1 = fbm(d * 2.4 + w * 1.8);
  n1 = pow(smoothstep(0.34, 0.86, n1), 1.7);
  float n2 = fbm(d * 5.1 - w * 1.1);
  n2 = pow(smoothstep(0.46, 0.95, n2), 2.6);

  col += uNebulaA * n1 * 1.7;
  col += uNebulaB * n2 * 1.1;
  // A third, tighter layer picks out bright filament cores.
  float n3 = fbm(d * 9.0 + w * 0.6);
  col += (uNebulaA + uNebulaB) * pow(smoothstep(0.58, 0.96, n3), 3.0) * 0.55;

  // A distant blue-white star acting as the key light, so IBL specular has a
  // believable dominant direction that matches the scene's directional light.
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * pow(sd, 900.0) * 42.0;
  col += uSunColor * pow(sd, 14.0) * 0.75;
  col += uSunColor * pow(sd, 3.0) * 0.13;

  // Broad warm bounce from the direction of the gas giant so metal picks it up.
  float gd = max(dot(d, normalize(vec3(-0.55, 0.12, -0.82))), 0.0);
  col += vec3(0.42, 0.20, 0.34) * pow(gd, 3.5) * 0.5;

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// --------------------------------------------------------------------------

const STAR_VERT = /* glsl */`
attribute float aSize;
attribute float aPhase;
attribute vec3 aTint;
uniform float uTime;
uniform float uPixelRatio;
varying float vAlpha;
varying vec3 vTint;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // Slow, per-star scintillation — two detuned sines never visibly loop.
  float tw = 0.62 + 0.38 * sin(uTime * 1.5 + aPhase) * sin(uTime * 0.41 + aPhase * 2.3);
  vAlpha = tw;
  vTint = aTint;
  gl_PointSize = aSize * uPixelRatio * (0.55 + tw * 0.65);
}`;

const STAR_FRAG = /* glsl */`
precision mediump float;
varying float vAlpha;
varying vec3 vTint;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float r = length(p);
  float core = exp(-r * r * 34.0);
  // Cross-shaped diffraction spikes: cheap, and instantly reads as "lens".
  float spike = exp(-abs(p.x) * 46.0) * exp(-abs(p.y) * 7.0)
              + exp(-abs(p.y) * 46.0) * exp(-abs(p.x) * 7.0);
  float a = core + spike * 0.34;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vTint * a * vAlpha * 3.2, 1.0);
}`;

// --------------------------------------------------------------------------

const GIANT_VERT = /* glsl */`
varying vec3 vN;
varying vec3 vPos;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = mv.xyz;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const GIANT_FRAG = /* glsl */`
precision highp float;
varying vec3 vN;
varying vec3 vPos;
varying vec3 vWorld;
uniform vec3 uSunDir;
uniform float uTime;

float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; return fract(p*(p+p)); }
float n1d(float x){ float i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f); return mix(hash11(i),hash11(i+1.0),f); }
float bands(float y){
  float s = 0.0, a = 0.6, fq = 5.0;
  for (int i=0;i<5;i++){ s += a * n1d(y*fq + float(i)*17.0); fq *= 2.1; a *= 0.5; }
  return s;
}

void main() {
  vec3 n = normalize(vN);
  vec3 L = normalize(uSunDir);
  vec3 V = normalize(-vPos);

  // Latitude banding, sheared slowly to imply rotation.
  vec3 op = normalize(vWorld);
  float lat = op.y;
  float b = bands(lat * 3.1 + sin(lat * 9.0 + uTime * 0.012) * 0.06 + uTime * 0.004);

  vec3 warm = vec3(0.62, 0.24, 0.30);
  vec3 cool = vec3(0.20, 0.13, 0.32);
  vec3 pale = vec3(0.78, 0.55, 0.48);
  vec3 albedo = mix(cool, warm, smoothstep(0.28, 0.76, b));
  albedo = mix(albedo, pale, smoothstep(0.72, 0.98, b) * 0.6);

  // Wrapped diffuse — a planet-sized body has no hard terminator at this range.
  float ndl = dot(n, L);
  float wrap = clamp((ndl + 0.35) / 1.35, 0.0, 1.0);
  vec3 col = albedo * wrap * 1.75;
  col += albedo * 0.045;                                   // ambient fill

  // Atmospheric limb: forward-scattered light hugging the silhouette.
  float fres = pow(clamp(1.0 - dot(n, V), 0.0, 1.0), 3.2);
  float lit  = smoothstep(-0.55, 0.6, ndl);
  col += vec3(0.72, 0.42, 0.92) * fres * (0.18 + lit * 1.35);

  gl_FragColor = vec4(col, 1.0);
}`;

// --------------------------------------------------------------------------

export const SUN_DIR = new THREE.Vector3(0.42, 0.76, 0.5).normalize();

export function buildEnvironment(renderer, scene, preset) {
  const group = new THREE.Group();
  group.name = 'environment';

  // ---- 1. bake the sky cube ------------------------------------------------
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uHorizon:  { value: new THREE.Color(0x121a38).convertSRGBToLinear() },
      uZenith:   { value: new THREE.Color(0x050815).convertSRGBToLinear() },
      uNebulaA:  { value: new THREE.Color(0x3a2490).convertSRGBToLinear().multiplyScalar(2.1) },
      uNebulaB:  { value: new THREE.Color(0x1585b8).convertSRGBToLinear().multiplyScalar(1.7) },
      uSunDir:   { value: SUN_DIR.clone() },
      uSunColor: { value: new THREE.Color(0xbfe4ff).convertSRGBToLinear() },
    },
  });

  const bakeScene = new THREE.Scene();
  const skyMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), skyMat);
  bakeScene.add(skyMesh);

  const cubeRT = new THREE.WebGLCubeRenderTarget(preset.envSize, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  });
  const cubeCam = new THREE.CubeCamera(0.1, 10, cubeRT);
  const prevTarget = renderer.getRenderTarget();
  cubeCam.update(renderer, bakeScene);
  renderer.setRenderTarget(prevTarget);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();
  const envRT = pmrem.fromCubemap(cubeRT.texture);
  scene.environment = envRT.texture;
  scene.background = cubeRT.texture;
  scene.backgroundIntensity = 1.25;
  scene.environmentIntensity = 2.1;

  pmrem.dispose();
  skyMesh.geometry.dispose();
  skyMat.dispose();

  // ---- 2. crisp starfield --------------------------------------------------
  const N = preset.starCount;
  const pos = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);
  const tint = new Float32Array(N * 3);
  const R = 620;
  const CULL_Y = -0.18;   // nothing lives below the deck plane
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    // Uniform on the sphere, biased away from straight down (we never look there).
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = Math.cos(th) * s * R;
    pos[i * 3 + 1] = Math.max(CULL_Y, u) * R * 0.9 + 40;
    pos[i * 3 + 2] = Math.sin(th) * s * R;

    const mag = Math.pow(Math.random(), 3.2);         // few bright, many faint
    size[i] = 1.4 + mag * 8.2;
    phase[i] = Math.random() * 100;

    // Loose stellar-class distribution: mostly white-blue, a few warm.
    const t = Math.random();
    if (t > 0.90) c.setHSL(0.08, 0.55, 0.72);
    else if (t > 0.76) c.setHSL(0.11, 0.30, 0.84);
    else if (t > 0.34) c.setHSL(0.58, 0.18, 0.92);
    else c.setHSL(0.60, 0.42, 0.86);
    tint[i * 3] = c.r; tint[i * 3 + 1] = c.g; tint[i * 3 + 2] = c.b;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  starGeo.setAttribute('aTint', new THREE.BufferAttribute(tint, 3));
  starGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), R * 1.4);

  const starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(renderer.getPixelRatio(), 2) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -900;
  stars.frustumCulled = false;
  group.add(stars);

  // ---- 3. gas giant --------------------------------------------------------
  const giantMat = new THREE.ShaderMaterial({
    vertexShader: 'varying vec3 vWorld;\n' + GIANT_VERT,
    fragmentShader: GIANT_FRAG,
    uniforms: {
      uSunDir: { value: SUN_DIR.clone() },
      uTime: { value: 0 },
    },
    depthWrite: false,
  });
  const giant = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), giantMat);
  giant.scale.setScalar(95);
  giant.position.set(-390, 105, -640);
  giant.renderOrder = -880;
  giant.frustumCulled = false;
  group.add(giant);

  // Ring plane, seen nearly edge-on. Additive so it never occludes.
  const ringGeo = new THREE.RingGeometry(1.42, 2.35, 128, 1);
  const ringMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uSunDir: { value: SUN_DIR.clone() } },
    vertexShader: /* glsl */`
      varying vec2 vUvR; varying vec3 vW;
      void main(){
        vUvR = uv;
        vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      precision mediump float;
      varying vec2 vUvR; varying vec3 vW;
      float h(float x){ x=fract(x*0.1031); x*=x+33.33; return fract(x*(x+x)); }
      void main(){
        float r = vUvR.y;
        // Concentric density gaps, plus a soft falloff at both edges.
        float d = 0.0, f = 7.0, a = 0.6;
        for (int i=0;i<4;i++){ d += a*h(floor(r*f)); f*=2.3; a*=0.55; }
        d *= smoothstep(0.0,0.13,r) * (1.0 - smoothstep(0.72,1.0,r));
        vec3 col = mix(vec3(0.42,0.30,0.26), vec3(0.62,0.52,0.58), d);
        gl_FragColor = vec4(col * d * 0.42, 1.0);
      }`,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.scale.setScalar(95);
  ring.position.copy(giant.position);
  ring.rotation.set(-Math.PI / 2 + 0.30, 0.22, 0.5);
  ring.renderOrder = -870;
  ring.frustumCulled = false;
  group.add(ring);

  scene.add(group);

  return {
    group,
    envTexture: envRT.texture,
    update(t) {
      starMat.uniforms.uTime.value = t;
      giantMat.uniforms.uTime.value = t;
      // Parallax-free: the sky rides with the camera so it stays infinitely far.
    },
    setPixelRatio(pr) { starMat.uniforms.uPixelRatio.value = Math.min(pr, 2); },
    dispose() {
      starGeo.dispose(); starMat.dispose();
      giant.geometry.dispose(); giantMat.dispose();
      ringGeo.dispose(); ringMat.dispose();
      cubeRT.dispose(); envRT.dispose();
    },
  };
}
