import * as THREE from 'three';

/**
 * Kenney ships flat-coloured materials with stable names (`metal`, `metalRed`,
 * `dark`, …). We throw those away and substitute a small, shared PBR set keyed
 * off the same names. Two things fall out of that:
 *
 *  - Everything picks up the scene's IBL, which is what makes low-poly geometry
 *    read as expensive rather than as a prototype.
 *  - `metalRed` becomes a dedicated *accent slot*. Recolouring one material
 *    re-skins an entire craft in a team colour, for free.
 */

const shared = new Map();

function std(key, params) {
  if (shared.has(key)) return shared.get(key);
  const m = new THREE.MeshStandardMaterial(params);
  shared.set(key, m);
  return m;
}

/**
 * The station kit ships one atlas-textured material called `colormap` rather
 * than the space kit's named slots, so it gets its own entry. Worth keeping:
 * it's a 7KB texture that buys a whole second family of props.
 */
let colormapTex = null;
export function setColormap(tex) {
  colormapTex = tex;
  const m = shared.get('f.colormap');
  if (m) { m.map = tex; m.needsUpdate = true; }
}

/** Neutral facility palette used for everything that isn't a player craft. */
export function facilityMaterials() {
  return {
    colormap: std('f.colormap', {
      map: colormapTex, color: 0x62707f, metalness: 0.55, roughness: 0.66,
      envMapIntensity: 0.45,
    }),
    metal: std('f.metal', {
      color: 0x53637a, metalness: 0.9, roughness: 0.5, envMapIntensity: 0.5,
    }),
    metalDark: std('f.metalDark', {
      color: 0x333f4f, metalness: 0.86, roughness: 0.6, envMapIntensity: 0.45,
    }),
    dark: std('f.dark', {
      color: 0x0d121b, metalness: 0.42, roughness: 0.6, envMapIntensity: 0.45,
    }),
    metalRed: std('f.accent', {
      color: 0x0e2a38, metalness: 0.55, roughness: 0.38,
      emissive: 0x1ea9c8, emissiveIntensity: 0.28, envMapIntensity: 0.9,
    }),
    _defaultMat: std('f.default', {
      color: 0x4a5665, metalness: 0.72, roughness: 0.55, envMapIntensity: 0.5,
    }),
    rock: std('f.rock', {
      color: 0x1d212a, metalness: 0.06, roughness: 0.92, envMapIntensity: 0.4,
    }),
    rockTrack: std('f.rockTrack', {
      color: 0x181b23, metalness: 0.05, roughness: 0.95, envMapIntensity: 0.38,
    }),
    crystal: std('f.crystal', {
      color: 0x0d3a4a, metalness: 0.1, roughness: 0.12,
      emissive: 0x36e0ff, emissiveIntensity: 1.5, envMapIntensity: 1.2,
      transparent: true, opacity: 0.9,
    }),
  };
}

/**
 * A per-player craft set. `metalRed` carries the team colour and glows; the
 * greys are tinted very slightly toward it so the whole hull reads as theirs
 * even in silhouette.
 */
export function craftMaterials(colorHex, deepHex) {
  const c = new THREE.Color(colorHex);
  const deep = new THREE.Color(deepHex);

  // Rebuild the hull colours from the team *hue* at fixed saturation and
  // lightness rather than tinting a grey toward the raw team colour. Blending
  // toward cyan lands near white while blending toward magenta stays vivid,
  // so a naive lerp gives the four pilots wildly different visual weight. Held
  // in HSL, every craft reads with the same strength.
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const body = new THREE.Color().setHSL(hsl.h, 0.58, 0.64);
  const bodyDark = new THREE.Color().setHSL(hsl.h, 0.62, 0.30);
  // Even the darkest slot stays on the team hue. The four speeders spend that
  // slot very differently — one of them is mostly `dark` — and a neutral black
  // there turns that craft into an unreadable silhouette while the other three
  // glow.
  const shadow = new THREE.Color().setHSL(hsl.h, 0.55, 0.14);

  return {
    metal: new THREE.MeshStandardMaterial({
      color: body, metalness: 0.62, roughness: 0.33, envMapIntensity: 1.8,
    }),
    metalDark: new THREE.MeshStandardMaterial({
      color: bodyDark, metalness: 0.58, roughness: 0.46, envMapIntensity: 1.5,
    }),
    dark: new THREE.MeshStandardMaterial({
      color: shadow, metalness: 0.5, roughness: 0.45, envMapIntensity: 1.0,
    }),
    metalRed: new THREE.MeshStandardMaterial({
      color: deep.clone().multiplyScalar(0.35), metalness: 0.4, roughness: 0.3,
      emissive: c, emissiveIntensity: 3.4, envMapIntensity: 1.0,
    }),
    _defaultMat: new THREE.MeshStandardMaterial({
      color: body, metalness: 0.85, roughness: 0.38, envMapIntensity: 1.2,
    }),
  };
}

/** Swap every mesh's material using the name we stashed at load time. */
export function applyMaterials(root, set, fallbackKey = 'metal') {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const key = o.userData.srcMat;
    o.material = set[key] || set[fallbackKey] || set._defaultMat;
  });
  return root;
}

/** Release the shared facility materials. Only needed on a full teardown. */
export function disposeShared() {
  for (const m of shared.values()) m.dispose();
  shared.clear();
}
