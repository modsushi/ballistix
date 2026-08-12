import * as THREE from 'three';
import { ARENA, PADDLE, SIDES } from '../core/config.js';
import { craftMaterials, applyMaterials } from '../gfx/materials.js';
import { clamp, damp, lerp } from '../core/math.js';

/**
 * A pilot's craft: the paddle, plus everything that makes moving it feel good.
 *
 * Gameplay-wise this is one number — `u`, the lateral offset along the pilot's
 * wall. Everything else is presentation layered on top of that number's
 * derivatives: bank from velocity, pitch from acceleration, thruster flare from
 * throttle, recoil from impacts. Reading motion off derivatives rather than
 * scripting it per-event is what keeps the movement continuous and physical
 * instead of steppy.
 */

const _v = new THREE.Vector3();

export class Craft {
  /**
   * @param {number} index      pilot id, also the wall they defend
   * @param {object} def        entry from PLAYERS
   */
  constructor(index, def, assets, scene) {
    this.index = index;
    this.def = def;
    this.side = SIDES[index];

    // Basis: `n` points out through their wall, `t` runs along it.
    this.nx = this.side.nx; this.nz = this.side.nz;
    this.tx = -this.side.nz; this.tz = this.side.nx;
    this.yaw = Math.atan2(this.nx, this.nz);   // nose (-Z) faces the centre

    this.halfLen = PADDLE.halfLen;
    this.halfThick = PADDLE.halfThick;
    this.limit = ARENA.half - ARENA.chamfer - this.halfLen * 0.42;

    this.u = 0;          // lateral position along the wall
    this.vu = 0;         // lateral velocity
    this.targetU = 0;
    this.alive = true;
    this.throttle = 0;

    this.surge = 1;          // 0..1 readiness
    this.surgeActive = 0;    // seconds of boosted deflection remaining
    this.recoil = 0;
    this.hitFlash = 0;
    this.dying = 0;
    this._dt = 0;

    this.root = new THREE.Group();
    this.root.name = `craft:${def.name}`;
    scene.add(this.root);

    this._buildHull(assets);
    this._buildDeflector();
    this._buildThrusters();
    this.sync(0);
  }

  // ------------------------------------------------------------------ build --
  _buildHull(assets) {
    this.mats = craftMaterials(this.def.color, this.def.deep);
    const hull = applyMaterials(assets.clone(this.def.craft), this.mats);

    // Normalise across the kit: the four speeders differ in span by 40%, and a
    // deflector that doesn't match its hull looks broken.
    const box = new THREE.Box3().setFromObject(hull);
    const span = Math.max(0.001, box.max.x - box.min.x);
    const s = (this.halfLen * 2 * 0.95) / span;
    hull.scale.setScalar(s);
    // Sit the hull astern of the deflector plane. Overlapping them let the
    // additive field wash the whole craft out to a grey smear.
    hull.position.set(0, 0, 0.62);

    // The shadow map is baked once at load (the arena and key light never
    // move), so anything that moves must stay out of it — otherwise the
    // craft leaves a shadow frozen at its starting position. Their hover
    // glow does the grounding instead, which suits a floating craft better
    // than a hard shadow would anyway.
    hull.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });

    this.hullPivot = new THREE.Group();   // bank/pitch happen here
    this.hullPivot.add(hull);
    this.bobPivot = new THREE.Group();    // hover bob, kept off the bank axis
    this.bobPivot.add(this.hullPivot);
    this.root.add(this.bobPivot);
    this.hull = hull;
  }

  _buildDeflector() {
    // A shallow arc of energy, bowed toward the centre of the arena.
    const R = 6.2;
    const arc = (this.halfLen * 2.06) / R;
    const geo = new THREE.CylinderGeometry(R, R, 1.55, 26, 1, true, Math.PI - arc / 2, arc);
    geo.translate(0, 0, R);           // bring the arc's midpoint onto the origin
    geo.rotateY(0);

    this.defMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(this.def.color).convertSRGBToLinear() },
        uTime: { value: 0 },
        uHit: { value: 0 },
        uHitU: { value: 0.5 },
        uSurge: { value: 1 },
        uAlive: { value: 1 },
      },
      vertexShader: /* glsl */`
        varying vec2 vUvD; varying vec3 vN; varying vec3 vV;
        void main(){
          vUvD = uv;
          vec4 wp = modelMatrix * vec4(position,1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        precision mediump float;
        varying vec2 vUvD; varying vec3 vN; varying vec3 vV;
        uniform vec3 uColor; uniform float uTime, uHit, uHitU, uSurge, uAlive;
        void main(){
          float u = vUvD.x, v = vUvD.y;
          // Vertical containment plus a bright rim top and bottom.
          float band = smoothstep(0.0,0.22,v) * smoothstep(1.0,0.72,v);
          float rim  = smoothstep(0.11,0.0,v) + smoothstep(0.90,1.0,v) * 0.6;
          // Ends taper so the field looks projected, not cut off.
          float ends = smoothstep(0.0,0.10,u) * smoothstep(1.0,0.90,u);
          float fres = pow(1.0 - abs(dot(normalize(vN), vV)), 1.7);

          float ripple = 0.5 + 0.5 * sin(u * 15.0 - uTime * 4.0);
          float a = (band * 0.30 + rim * 0.55 + fres * 0.45) * ends;
          a *= 0.78 + ripple * 0.22;

          // Impact: a bright bloom centred where the orb struck.
          float d = abs(u - uHitU);
          a += exp(-d * d * 46.0) * uHit * 2.4;

          vec3 col = uColor * a;
          // Charged and ready reads as white-hot; spent reads as team colour.
          col = mix(col, vec3(1.0) * a * 1.2, uSurge * 0.10);
          // Readiness reads as a bright hairline along the top edge.
          col += vec3(0.85, 0.95, 1.0) * smoothstep(0.95, 1.0, v) * ends * uSurge * 0.55;
          col += vec3(1.0) * exp(-d * d * 90.0) * uHit * 1.6;

          gl_FragColor = vec4(col * 2.6 * uAlive, clamp(a, 0.0, 1.0) * uAlive);
        }`,
    });

    this.deflector = new THREE.Mesh(geo, this.defMat);
    this.deflector.position.set(0, 0.62, -0.5);
    this.deflector.renderOrder = 7;
    this.deflectorPivot = new THREE.Group();
    this.deflectorPivot.add(this.deflector);
    this.root.add(this.deflectorPivot);
  }

  _buildThrusters() {
    this.thrustMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.def.color), transparent: true,
      opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const geo = new THREE.ConeGeometry(0.19, 1.5, 10, 1, true);
    geo.rotateX(Math.PI / 2);          // point the cone down +Z (astern)
    geo.translate(0, 0, 0.75);

    this.thrusters = [];
    const off = this.halfLen * 0.44;
    for (const sx of [-off, off]) {
      const m = new THREE.Mesh(geo, this.thrustMat);
      m.position.set(sx, 0.24, 1.45);
      m.renderOrder = 7;
      this.bobPivot.add(m);
      this.thrusters.push(m);
    }

    // A tight glow disc under the hull, standing in for a hover field.
    const gl = new THREE.Mesh(
      new THREE.CircleGeometry(this.halfLen * 0.9, 20),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.def.color), transparent: true, opacity: 0.16,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    gl.rotation.x = -Math.PI / 2;
    gl.position.y = -0.42;
    this.root.add(gl);
    this.hoverGlow = gl;
    this.glowMat = gl.material;
  }

  // ------------------------------------------------------------------- api --

  /** World position of the paddle centre. */
  worldPos(out = _v) {
    const d = ARENA.half - PADDLE.standoff - this.recoil;
    return out.set(
      this.nx * d + this.tx * this.u,
      ARENA.playY,
      this.nz * d + this.tz * this.u,
    );
  }

  /** Where the paddle plane sits, measured out from the centre. */
  get standoffDist() { return ARENA.half - PADDLE.standoff - this.recoil; }

  /** Current effective half-width, wider while a surge is burning. */
  get effHalfLen() { return this.halfLen * (1 + this.surgeActive * 0.42); }

  /** @param {number} u desired lateral offset, clamped to the wall */
  steer(u) { this.targetU = clamp(u, -this.limit, this.limit); }

  trySurge() {
    if (!this.alive || this.surge < 1) return false;
    this.surge = 0;
    this.surgeActive = 0.55;
    return true;
  }

  /** Called when an orb is deflected off this craft. */
  onDeflect(u01, power) {
    this.defMat.uniforms.uHitU.value = u01;
    this.defMat.uniforms.uHit.value = Math.min(1.4, this.defMat.uniforms.uHit.value + power);
    this.recoil = Math.min(0.85, this.recoil + power * 0.5);
    this.hitFlash = 1;
  }

  /** Called when this pilot concedes a point. */
  onConcede() { this.hitFlash = 1.6; }

  eliminate() {
    if (!this.alive) return;
    this.alive = false;
    this.dying = 0.001;
  }

  // ----------------------------------------------------------------- update --
  update(dt, t) {
    this._dt = dt;
    if (this.alive) {
      // Motion: acceleration toward the target with heavy damping. A spring
      // would overshoot, which feels wrong for something you're aiming.
      const err = this.targetU - this.u;
      const desired = clamp(err * 9.0, -PADDLE.maxSpeed, PADDLE.maxSpeed);
      const prevV = this.vu;
      this.vu += clamp(desired - this.vu, -PADDLE.accel * dt, PADDLE.accel * dt);
      this.vu = damp(this.vu, desired, PADDLE.damp, dt);
      this.u = clamp(this.u + this.vu * dt, -this.limit, this.limit);
      if (Math.abs(this.u) >= this.limit - 1e-4) this.vu *= 0.35;
      this.accel = (this.vu - prevV) / Math.max(dt, 1e-4);

      this.throttle = damp(this.throttle, Math.min(1, Math.abs(this.vu) / PADDLE.maxSpeed), 9, dt);
      this.surge = Math.min(1, this.surge + dt / 4.2);
      this.surgeActive = Math.max(0, this.surgeActive - dt);
    } else {
      this.dying += dt;
      this.vu *= Math.exp(-dt * 2);
      this.u += this.vu * dt;
    }

    this.recoil = damp(this.recoil, 0, 7.5, dt);
    this.hitFlash = damp(this.hitFlash, 0, 5.5, dt);

    const u = this.defMat.uniforms;
    u.uTime.value = t;
    u.uHit.value *= Math.exp(-dt * 6.5);
    u.uSurge.value = damp(u.uSurge.value, this.alive ? this.surge : 0, 8, dt);
    u.uAlive.value = damp(u.uAlive.value, this.alive ? 1 : 0, 3, dt);

    this.sync(t);
  }

  sync(t) {
    const d = this.standoffDist;
    this.root.position.set(this.nx * d + this.tx * this.u, ARENA.playY, this.nz * d + this.tz * this.u);
    this.root.rotation.y = this.yaw;

    if (this.alive) {
      // Bank into the turn, pitch back under acceleration.
      const speed01 = clamp(this.vu / PADDLE.maxSpeed, -1, 1);
      const bank = -speed01 * PADDLE.bankMax;
      const pitch = clamp((this.accel || 0) / 900, -0.22, 0.22);
      const h = this._dt;   // 0 during hit-stop, which correctly freezes the pose
      this.hullPivot.rotation.z = damp(this.hullPivot.rotation.z, bank, 11, h);
      this.hullPivot.rotation.x = damp(this.hullPivot.rotation.x, pitch, 9, h);

      // Hover: two detuned sines so the bob never lands on an obvious loop.
      const bob = Math.sin(t * 2.4 + this.index * 1.7) * PADDLE.hover
                + Math.sin(t * 3.9 + this.index) * PADDLE.hover * 0.35;
      this.bobPivot.position.y = bob;
      this.bobPivot.rotation.z = Math.sin(t * 1.6 + this.index * 2.1) * 0.035;

      const flare = 0.25 + this.throttle * 1.5 + this.hitFlash * 0.8;
      for (const th of this.thrusters) th.scale.set(1 + this.throttle * 0.35, 1, flare);
      this.thrustMat.opacity = 0.35 + this.throttle * 0.55;
      this.hoverGlow.material.opacity = 0.10 + this.throttle * 0.14;

      const em = this.mats.metalRed;
      em.emissiveIntensity = 2.2 + this.hitFlash * 5.0 + this.surge * 0.7;
    } else {
      // Death spiral: tumble, sink, and let the emissive die out.
      const k = this.dying;
      // Rate-scaled, not per-frame: the wreck tumbles at the same speed on a
      // 30fps phone as on a 120Hz desktop, and hit-stop freezes it correctly.
      const spin = this._dt * 60;
      this.hullPivot.rotation.z += 0.055 * spin;
      this.hullPivot.rotation.x += 0.031 * spin;
      this.bobPivot.position.y = -k * k * 3.2;
      const fade = Math.max(0, 1 - k * 0.85);
      this.thrustMat.opacity = fade * 0.2;
      this.hoverGlow.material.opacity = fade * 0.04;
      this.mats.metalRed.emissiveIntensity = fade * 1.2;
      for (const th of this.thrusters) th.scale.set(1, 1, fade * 0.4);
      if (k > 2.4) this.root.visible = false;
    }

    const w = 1 + this.surgeActive * 0.42;
    this.deflector.scale.set(w, 1, w);
  }

  dispose() {
    this.root.traverse((o) => { if (o.isMesh) o.geometry?.dispose(); });
    for (const m of Object.values(this.mats)) m.dispose();
    this.defMat.dispose(); this.thrustMat.dispose(); this.glowMat.dispose();
    this.root.parent?.remove(this.root);
  }
}
