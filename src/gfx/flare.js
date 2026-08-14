import * as THREE from 'three';

/**
 * Pooled impact flares — the hot flash at the moment of contact.
 *
 * A spray of debris tells you something broke; it doesn't tell you it was
 * *struck*. What sells the strike is the sub-tenth-of-a-second flare: a
 * blown-out core, a horizontal anamorphic streak and a shorter vertical one,
 * all gone before the eye can resolve them. Because it lives for four frames
 * it can be far brighter than anything else on screen without reading as a
 * light source, and the bloom chain turns it into the bang.
 *
 * Billboarded in the vertex shader rather than by rotating the mesh, so the
 * flare faces the camera exactly even during a shake.
 */

const VERT = /* glsl */`
uniform float uSize;
varying vec2 vP;
void main() {
  vP = position.xy;
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  c.xy += position.xy * uSize;
  gl_Position = projectionMatrix * c;
}`;

const FRAG = /* glsl */`
precision mediump float;
varying vec2 vP;
uniform vec3 uColor;
uniform float uFade;
uniform float uAngle;

void main() {
  float s = sin(uAngle), c = cos(uAngle);
  vec2 p = mat2(c, -s, s, c) * vP;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;

  // Core, then the two streaks. The horizontal one runs longer and brighter:
  // an even cross reads as a sprite, a lopsided one reads as a lens.
  //
  // The falloffs are deliberately tight. A wide soft kernel is above the bloom
  // threshold across its whole area, so the blur chain turns it into a
  // featureless ball of light — every bit of structure has to be small and
  // hard-edged to survive being bloomed.
  float core = exp(-r2 * 62.0) + exp(-r2 * 15.0) * 0.22;
  float bar  = exp(-p.y * p.y * 520.0) * exp(-abs(p.x) * 2.2);
  float post = exp(-p.x * p.x * 900.0) * exp(-abs(p.y) * 4.0) * 0.5;
  float halo = exp(-r2 * 5.0) * 0.07;

  float e = core + bar + post + halo;
  // White at the centre bleeding to the pilot's colour through the falloff —
  // the same rule the orb and the ARC follow, so hits read as one family.
  vec3 col = mix(uColor, vec3(1.0), clamp(core * 1.8, 0.0, 1.0));
  float a = clamp(e, 0.0, 1.0) * uFade;
  gl_FragColor = vec4(col * e * uFade * 2.3, a);
}`;

export class FlarePool {
  constructor(scene, count = 8) {
    this.geo = new THREE.PlaneGeometry(2, 2);
    this.items = [];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(1, 1, 1) },
          uSize: { value: 1 },
          uFade: { value: 0 },
          uAngle: { value: 0 },
        },
        transparent: true, depthWrite: false, depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(this.geo, mat);
      m.visible = false;
      m.frustumCulled = false;
      // Above the deck and the orbs: a flare occluded by the thing it was
      // struck off reads as a bug.
      m.renderOrder = 12;
      scene.add(m);
      this.items.push({ mesh: m, mat, life: 0, dur: 0.12, size: 1 });
    }
    this.cursor = 0;
  }

  /**
   * @param {number} size  world-space radius at full extent
   * @param {number} dur   seconds; keep it short, this is a flash not a light
   */
  spawn(x, y, z, size, dur, color, angle = 0) {
    let it = this.items.find((i) => i.life <= 0);
    if (!it) { it = this.items[this.cursor]; this.cursor = (this.cursor + 1) % this.items.length; }
    it.life = dur; it.dur = dur; it.size = size;
    it.mesh.position.set(x, y, z);
    it.mesh.visible = true;
    it.mat.uniforms.uColor.value.set(color).convertSRGBToLinear();
    it.mat.uniforms.uAngle.value = angle;
    it.mat.uniforms.uSize.value = size * 0.45;
    it.mat.uniforms.uFade.value = 1;
    return it;
  }

  update(dt) {
    for (const it of this.items) {
      if (it.life <= 0) continue;
      it.life -= dt;
      if (it.life <= 0) { it.mesh.visible = false; continue; }
      const k = 1 - it.life / it.dur;
      // Snaps open, then decays. The opening is over in the first fifth of the
      // life so the flare is at full size before anyone can track it.
      const grow = 0.45 + 0.55 * Math.min(1, k * 5.0);
      it.mat.uniforms.uSize.value = it.size * grow;
      it.mat.uniforms.uFade.value = (1 - k) * (1 - k);
    }
  }

  dispose() {
    this.geo.dispose();
    for (const it of this.items) { it.mat.dispose(); it.mesh.parent?.remove(it.mesh); }
  }
}
