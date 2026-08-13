import * as THREE from 'three';

/**
 * A camera-facing ribbon fed from a short position history.
 *
 * The billboarding happens in the vertex shader — each sample carries its
 * segment direction, and the side offset is `cross(dir, toCamera)`. That keeps
 * the ribbon full-width from any viewing angle, which a fixed world-space
 * offset can't do once the camera tilts down over the deck.
 */

const VERT = /* glsl */`
attribute vec3 aDir;
attribute float aSide;
attribute float aT;
uniform float uWidth;
varying float vT;
varying float vEdge;
void main() {
  vT = aT;
  vEdge = aSide;
  vec3 toCam = normalize(cameraPosition - position);
  vec3 side = cross(aDir, toCam);
  float len = length(side);
  side = len > 1e-4 ? side / len : vec3(1.0, 0.0, 0.0);

  // Tapered: full width at the head, pinched to nothing at the tail.
  float w = uWidth * pow(clamp(1.0 - aT, 0.0, 1.0), 0.62) * (1.0 - 0.35 * aT);
  vec3 p = position + side * aSide * w;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const FRAG = /* glsl */`
precision mediump float;
varying float vT;
varying float vEdge;
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uOpacity;
void main() {
  // Clamped before every pow(): the interpolated edge/age values can overshoot
  // their [0,1] range by an ulp at mediump, and pow() of a negative base is NaN
  // — which is what turned the ribbon edges into black stipple on mobile.
  float across = clamp(1.0 - abs(vEdge), 0.0, 1.0);  // 1 at the spine, 0 at the edges
  float body = pow(across, 1.6);
  float fade = pow(clamp(1.0 - vT, 0.0, 1.0), 2.1);
  // Hot core near the head cooling to the team colour down the tail.
  vec3 col = mix(uColor, uHot, body * (1.0 - vT * 0.75));
  float a = body * fade * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a * 2.4, a);
}`;

export class Trail {
  /**
   * @param {number} segments number of history samples
   */
  constructor(segments, color, hot = 0xffffff, width = 0.34) {
    this.n = segments;
    const n = segments;

    const pos = new Float32Array(n * 2 * 3);
    const dir = new Float32Array(n * 2 * 3);
    const side = new Float32Array(n * 2);
    const tAttr = new Float32Array(n * 2);
    const idx = new Uint16Array((n - 1) * 6);

    for (let i = 0; i < n; i++) {
      side[i * 2] = -1; side[i * 2 + 1] = 1;
      const t = i / (n - 1);
      tAttr[i * 2] = t; tAttr[i * 2 + 1] = t;
    }
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.set([a, b, c, b, d, c], i * 6);
    }

    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aDir = new THREE.BufferAttribute(dir, 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aPos);
    g.setAttribute('aDir', this.aDir);
    g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
    g.setAttribute('aT', new THREE.BufferAttribute(tAttr, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);

    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uWidth: { value: width },
        uColor: { value: new THREE.Color(color).convertSRGBToLinear() },
        uHot: { value: new THREE.Color(hot).convertSRGBToLinear() },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 8;
    this._primed = false;
  }

  setColor(color, hot) {
    this.mat.uniforms.uColor.value.set(color).convertSRGBToLinear();
    if (hot !== undefined) this.mat.uniforms.uHot.value.set(hot).convertSRGBToLinear();
  }

  setWidth(v) { this.mat.uniforms.uWidth.value = v; }

  /** Snap the whole ribbon to a point — call on spawn and after teleports. */
  reset(x, y, z) {
    const p = this.aPos.array, d = this.aDir.array;
    for (let i = 0; i < this.n * 2; i++) {
      p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
      d[i * 3] = 0; d[i * 3 + 1] = 0; d[i * 3 + 2] = 1;
    }
    this.aPos.needsUpdate = true;
    this.aDir.needsUpdate = true;
    this._primed = true;
  }

  /** Push a new head sample, shifting the history back one slot. */
  push(x, y, z) {
    if (!this._primed) return this.reset(x, y, z);
    const p = this.aPos.array, d = this.aDir.array;
    const n = this.n;

    // Shift back: sample i takes sample i-1's value. Copying 2*n*3 floats for
    // a ~24-sample ribbon is a few hundred bytes; not worth a ring buffer.
    p.copyWithin(6, 0, (n - 1) * 6);
    p[0] = x; p[1] = y; p[2] = z;
    p[3] = x; p[4] = y; p[5] = z;

    // Recompute directions from the (now current) positions.
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(0, i - 1) * 6;
      const i1 = Math.min(n - 1, i + 1) * 6;
      let dx = p[i0] - p[i1], dy = p[i0 + 1] - p[i1 + 1], dz = p[i0 + 2] - p[i1 + 2];
      const l = Math.hypot(dx, dy, dz);
      if (l > 1e-5) { dx /= l; dy /= l; dz /= l; } else { dx = 0; dy = 0; dz = 1; }
      const o = i * 6;
      d[o] = dx; d[o + 1] = dy; d[o + 2] = dz;
      d[o + 3] = dx; d[o + 4] = dy; d[o + 5] = dz;
    }

    this.aPos.needsUpdate = true;
    this.aDir.needsUpdate = true;
  }

  dispose() { this.mesh.geometry.dispose(); this.mat.dispose(); }
}
