import * as THREE from 'three';
import { ARENA, ORB } from '../core/config.js';
import { Trail } from '../gfx/trail.js';
import { clamp, damp } from '../core/math.js';

/**
 * A plasma orb.
 *
 * Visually it is four layers stacked: an opaque hot core, a fresnel shell that
 * catches the silhouette, a soft additive glow billboard, and a ribbon trail.
 * That layering is what stops a small bright sphere from reading as a flat
 * circle — the shell gives it volume, the glow gives it presence, the trail
 * gives it a readable direction of travel at speed.
 *
 * It also carries the tint of whoever touched it last, which is the single most
 * useful piece of information on screen: you can tell at a glance whose shot is
 * about to arrive.
 */

const CORE_VERT = /* glsl */`
varying vec3 vN; varying vec3 vV; varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const CORE_FRAG = /* glsl */`
precision highp float;
varying vec3 vN; varying vec3 vV; varying vec3 vLocal;
uniform vec3 uColor; uniform vec3 uHot; uniform float uTime; uniform float uEnergy;

float hash13(vec3 p){ p = fract(p*0.1031); p += dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x),
                 mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),
                 mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);
}

void main() {
  // Convecting plasma cells crawling over the surface.
  vec3 q = normalize(vLocal) * 3.4;
  float n = vn(q + vec3(0.0, uTime * 0.9, uTime * 0.35));
  n = n * 0.65 + vn(q * 2.3 - uTime * 0.6) * 0.35;

  float fres = pow(1.0 - max(dot(normalize(vN), vV), 0.0), 2.4);

  vec3 col = mix(uColor, uHot, smoothstep(0.42, 0.86, n));
  col = mix(col, uHot * 1.6, fres * 0.75);
  col *= 1.1 + uEnergy * 1.5;
  gl_FragColor = vec4(col, 1.0);
}`;

const SHELL_FRAG = /* glsl */`
precision mediump float;
varying vec3 vN; varying vec3 vV; varying vec3 vLocal;
uniform vec3 uColor; uniform float uTime; uniform float uEnergy;
void main() {
  float fres = pow(1.0 - max(dot(normalize(vN), vV), 0.0), 3.1);
  // Latitude bands drifting upward read as containment rings.
  float bands = 0.5 + 0.5 * sin(normalize(vLocal).y * 19.0 - uTime * 4.5);
  float a = fres * (0.55 + bands * 0.45);
  gl_FragColor = vec4(uColor * a * (1.6 + uEnergy * 2.2), a * 0.85);
}`;

const GLOW_VERT = /* glsl */`
uniform float uSize;
varying vec2 vP;
void main() {
  vP = position.xy;
  // Billboard: build the quad directly in view space.
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  c.xy += position.xy * uSize;
  gl_Position = projectionMatrix * c;
}`;

const GLOW_FRAG = /* glsl */`
precision mediump float;
varying vec2 vP;
uniform vec3 uColor; uniform float uIntensity;
void main() {
  float r2 = dot(vP, vP);
  if (r2 > 1.0) discard;
  // Two lobes: a tight bright centre and a wide soft falloff.
  float a = exp(-r2 * 7.0) * 0.85 + exp(-r2 * 1.9) * 0.30;
  gl_FragColor = vec4(uColor * a * uIntensity * 2.4, a);
}`;

let SHARED_GEO = null;
function sharedGeo() {
  if (!SHARED_GEO) {
    SHARED_GEO = {
      core: new THREE.IcosahedronGeometry(ORB.radius * 0.82, 3),
      shell: new THREE.IcosahedronGeometry(ORB.radius * 1.16, 3),
      glow: new THREE.PlaneGeometry(2, 2),
    };
  }
  return SHARED_GEO;
}

export class Orb {
  constructor(scene, preset, withLight) {
    this.scene = scene;
    this.active = false;
    this.x = 0; this.z = 0;
    this.vx = 0; this.vz = 0;
    this.speed = ORB.baseSpeed;
    this.lastHitBy = -1;
    this.rally = 0;
    this.age = 0;
    this.impact = 0;      // decaying squash amount
    this.impactDirX = 1; this.impactDirZ = 0;

    const G = sharedGeo();
    this.root = new THREE.Group();

    const base = new THREE.Color(0x6fe6ff);
    const hot = new THREE.Color(0xffffff);

    this.coreMat = new THREE.ShaderMaterial({
      vertexShader: CORE_VERT, fragmentShader: CORE_FRAG,
      uniforms: {
        uColor: { value: base.clone().convertSRGBToLinear() },
        uHot: { value: hot.clone().convertSRGBToLinear() },
        uTime: { value: 0 }, uEnergy: { value: 0 },
      },
    });
    this.core = new THREE.Mesh(G.core, this.coreMat);
    this.core.castShadow = false;

    this.shellMat = new THREE.ShaderMaterial({
      vertexShader: CORE_VERT, fragmentShader: SHELL_FRAG,
      uniforms: {
        uColor: { value: base.clone().convertSRGBToLinear() },
        uTime: { value: 0 }, uEnergy: { value: 0 },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.shell = new THREE.Mesh(G.shell, this.shellMat);

    this.glowMat = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG,
      uniforms: {
        uColor: { value: base.clone().convertSRGBToLinear() },
        uSize: { value: ORB.radius * 4.6 },
        uIntensity: { value: 1 },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Mesh(G.glow, this.glowMat);
    this.glow.frustumCulled = false;
    this.glow.renderOrder = 10;

    // The squash pivot only scales the sphere layers, never the billboard —
    // a stretched glow quad reads as a bug.
    this.squash = new THREE.Group();
    this.squash.add(this.core, this.shell);
    this.root.add(this.squash, this.glow);

    this.trail = new Trail(preset.trailSegments, 0x2ec8ff, 0xffffff, ORB.radius * 0.86);
    scene.add(this.trail.mesh);

    if (withLight) {
      this.light = new THREE.PointLight(0x6fe6ff, 12, 16, 2);
      this.root.add(this.light);
    }

    // A soft contact shadow on the deck. Cheaper and better-looking than
    // putting a small fast sphere into the shadow map.
    this.blob = new THREE.Mesh(
      new THREE.PlaneGeometry(ORB.radius * 6, ORB.radius * 6),
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: base.clone().convertSRGBToLinear() } },
        vertexShader: 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: `precision mediump float; varying vec2 vU; uniform vec3 uColor;
          void main(){ vec2 p=(vU-0.5)*2.0; float r2=dot(p,p);
            if(r2>1.0) discard; float a=exp(-r2*4.5)*0.42;
            gl_FragColor=vec4(uColor*a,a); }`,
      }),
    );
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.renderOrder = 3;
    this.root.add(this.blob);

    scene.add(this.root);
    this.setVisible(false);
  }

  setVisible(v) {
    this.root.visible = v;
    this.trail.mesh.visible = v;
  }

  /** Tint every layer to the colour of whoever last touched the orb. */
  setTint(hex) {
    const c = new THREE.Color(hex);
    const lin = c.clone().convertSRGBToLinear();
    this.coreMat.uniforms.uColor.value.copy(lin);
    this.shellMat.uniforms.uColor.value.copy(lin);
    this.glowMat.uniforms.uColor.value.copy(lin);
    this.blob.material.uniforms.uColor.value.copy(lin);
    this.trail.setColor(hex, 0xffffff);
    if (this.light) this.light.color.copy(c);
  }

  /**
   * @param {number} ang launch direction, radians in the XZ plane
   */
  spawn(x, z, ang, speed) {
    this.active = true;
    this.x = x; this.z = z;
    this.speed = speed;
    this.vx = Math.sin(ang) * speed;
    this.vz = Math.cos(ang) * speed;
    this.lastHitBy = -1;
    this.rally = 0;
    this.age = 0;
    this.impact = 0;
    this.setTint(0x6fe6ff);
    this.root.position.set(x, ARENA.playY, z);
    this.trail.reset(x, ARENA.playY, z);
    this.setVisible(true);
  }

  kill() {
    this.active = false;
    this.setVisible(false);
  }

  /** Record an impact for the squash/stretch response. */
  registerImpact(nx, nz, power = 1) {
    this.impact = Math.min(1.5, this.impact + power);
    this.impactDirX = nx; this.impactDirZ = nz;
  }

  updateVisual(dt, t) {
    if (!this.active) return;
    this.age += dt;

    const speed01 = clamp((this.speed - ORB.baseSpeed) / (ORB.maxSpeed - ORB.baseSpeed), 0, 1);
    this.impact = damp(this.impact, 0, 9, dt);

    this.root.position.set(this.x, ARENA.playY, this.z);

    // Stretch along travel, squash across it — amount driven by speed, spiked
    // by recent impacts. Held in a quaternion so it survives any orientation.
    const inv = 1 / Math.max(1e-4, Math.hypot(this.vx, this.vz));
    const dx = this.vx * inv, dz = this.vz * inv;
    const stretch = 1 + speed01 * 0.28 + this.impact * 0.34;
    const pinch = 1 / Math.sqrt(stretch);

    this.squash.quaternion.setFromUnitVectors(
      _AXIS_Z, _tmpDir.set(dx, 0, dz),
    );
    this.squash.scale.set(pinch, pinch, stretch);

    const en = speed01 * 0.7 + this.impact * 0.5;
    this.coreMat.uniforms.uTime.value = t;
    this.coreMat.uniforms.uEnergy.value = en;
    this.shellMat.uniforms.uTime.value = t;
    this.shellMat.uniforms.uEnergy.value = en;
    this.glowMat.uniforms.uIntensity.value = 0.85 + speed01 * 0.7 + this.impact * 1.1;
    this.glowMat.uniforms.uSize.value = ORB.radius * (4.4 + speed01 * 1.5 + this.impact * 2.2);

    if (this.light) this.light.intensity = 9 + speed01 * 10 + this.impact * 22;

    // Blob shadow shrinks and dims with height above the deck (we're flat, but
    // the impact pop lifts the orb visually, and the shadow should follow).
    this.blob.position.set(0, -ARENA.playY + 0.035, 0);
    const bs = 1 + speed01 * 0.35;
    this.blob.scale.set(bs, bs, 1);

    this.trail.push(this.x, ARENA.playY, this.z);
    this.trail.setWidth(ORB.radius * (0.8 + speed01 * 0.5));
  }

  dispose() {
    this.coreMat.dispose(); this.shellMat.dispose(); this.glowMat.dispose();
    this.blob.geometry.dispose(); this.blob.material.dispose();
    this.trail.dispose();
    this.scene.remove(this.root, this.trail.mesh);
  }
}

const _AXIS_Z = new THREE.Vector3(0, 0, 1);
const _tmpDir = new THREE.Vector3();
